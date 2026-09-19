import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("server-only", () => ({}));
// Пользователь запроса подменяется: проверяем обработку прав, а не Better Auth
const getCurrentUser = vi.fn();
vi.mock("@/lib/dal", async () => {
  const { hasPermission } = await import("@/lib/permissions");
  return {
    getCurrentUser: () => getCurrentUser(),
    can: (user: { role: string }, permissions: Parameters<typeof hasPermission>[1]) => hasPermission(user.role, permissions),
  };
});

const { ApiError, apiRoute, readJson, readQuery, requireApiUser } = await import("./http");
const { ServiceError } = await import("@/lib/services/errors");

const request = (init?: { body?: string; contentType?: string; url?: string }) =>
  new NextRequest(init?.url ?? "http://localhost/api/v1/test", {
    method: init?.body ? "POST" : "GET",
    body: init?.body,
    headers: init?.contentType ? { "content-type": init.contentType } : undefined,
  });

async function errorOf(response: Response) {
  return { status: response.status, body: (await response.json()) as { error: { code: string; details?: object } } };
}

beforeEach(() => {
  getCurrentUser.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("apiRoute", () => {
  it("переводит ошибки сервисов в HTTP-статусы", async () => {
    const cases = [
      [new ServiceError("NOT_FOUND", "нет"), 404],
      [new ServiceError("CONFLICT", "дубль", "email"), 409],
      [new ServiceError("INVALID_REFERENCE", "нет клиента", "customerId"), 422],
      [new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "json"), 415],
    ] as const;
    for (const [error, status] of cases) {
      const response = await apiRoute(async () => {
        throw error;
      })(request(), {});
      expect(response.status).toBe(status);
    }
  });

  it("не раскрывает детали непредвиденной ошибки", async () => {
    const response = await apiRoute(async () => {
      throw new Error("password authentication failed for user postgres");
    })(request(), {});
    const { status, body } = await errorOf(response);
    expect(status).toBe(500);
    expect(JSON.stringify(body)).not.toContain("postgres");
  });

  it("ошибку поля возвращает в details", async () => {
    const response = await apiRoute(async () => {
      throw new ServiceError("CONFLICT", "Клиент с такой почтой уже есть.", "email");
    })(request(), {});
    expect((await errorOf(response)).body.error.details).toEqual({ email: ["Клиент с такой почтой уже есть."] });
  });
});

describe("requireApiUser", () => {
  it("401 без пользователя, 403 без прав, пользователь — если права есть", async () => {
    getCurrentUser.mockResolvedValueOnce(null);
    await expect(requireApiUser()).rejects.toMatchObject({ status: 401 });

    getCurrentUser.mockResolvedValueOnce({ id: "1", role: "viewer" });
    await expect(requireApiUser({ invoice: ["create"] })).rejects.toMatchObject({ status: 403 });

    getCurrentUser.mockResolvedValueOnce({ id: "2", role: "manager" });
    await expect(requireApiUser({ invoice: ["create"] })).resolves.toMatchObject({ id: "2" });
  });
});

describe("readJson", () => {
  const schema = z.strictObject({ name: z.string().min(1) });

  it("требует Content-Type: application/json (защита от CSRF)", async () => {
    await expect(readJson(request({ body: '{"name":"a"}', contentType: "text/plain" }), schema)).rejects.toMatchObject({
      status: 415,
    });
  });

  it("отличает битый JSON от ошибок полей", async () => {
    await expect(readJson(request({ body: "{oops", contentType: "application/json" }), schema)).rejects.toMatchObject({
      status: 400,
      code: "INVALID_JSON",
    });
    await expect(
      readJson(request({ body: '{"name":""}', contentType: "application/json; charset=utf-8" }), schema),
    ).rejects.toMatchObject({ status: 400, code: "VALIDATION_ERROR", details: { name: expect.any(Array) } });
  });

  it("возвращает проверенные данные", async () => {
    await expect(readJson(request({ body: '{"name":"a"}', contentType: "application/json" }), schema)).resolves.toEqual({
      name: "a",
    });
  });
});

describe("readQuery", () => {
  it("проверяет параметры строки запроса", () => {
    const schema = z.object({ page: z.coerce.number().int().min(1) });
    expect(readQuery(request({ url: "http://localhost/x?page=2" }), schema)).toEqual({ page: 2 });
    expect(() => readQuery(request({ url: "http://localhost/x?page=abc" }), schema)).toThrow(ApiError);
  });
});
