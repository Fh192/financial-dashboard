import { describe, expect, it } from "vitest";
import { z } from "zod";
import { banSchema, parseCreateUserForm, roleSchema, setPasswordSchema } from "./user";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return data;
}

const valid = { name: " Анна ", email: "Anna@Example.com", password: "Secret123", role: "manager" };

describe("parseCreateUserForm", () => {
  it("нормализует имя и почту", () => {
    const result = parseCreateUserForm(form(valid));
    expect(result.success && result.data).toEqual({
      name: "Анна",
      email: "anna@example.com",
      password: "Secret123",
      role: "manager",
    });
  });

  it("не принимает короткий пароль и неизвестную роль", () => {
    const result = parseCreateUserForm(form({ ...valid, password: "1234567", role: "root" }));
    const errors = result.success ? {} : z.flattenError(result.error).fieldErrors;
    expect(errors.password).toEqual(["Не короче 8 символов"]);
    expect(errors.role).toEqual(["Выберите роль"]);
  });

  it("не принимает пароль длиннее, чем разрешает Better Auth", () => {
    expect(setPasswordSchema.safeParse({ password: "x".repeat(129) }).success).toBe(false);
    expect(setPasswordSchema.safeParse({ password: "x".repeat(128) }).success).toBe(true);
  });
});

describe("roleSchema", () => {
  it("знает только роли из lib/permissions", () => {
    expect(roleSchema.safeParse("admin").success).toBe(true);
    expect(roleSchema.safeParse("viewer").success).toBe(true);
    expect(roleSchema.safeParse("user").success).toBe(false);
  });
});

describe("banSchema", () => {
  it("принимает причину и срок из списка", () => {
    expect(banSchema.safeParse({ reason: "Уволился", duration: "forever" }).success).toBe(true);
    expect(banSchema.safeParse({ reason: "", duration: "7d" }).success).toBe(true);
  });

  it("отклоняет неизвестный срок и слишком длинную причину", () => {
    expect(banSchema.safeParse({ reason: "", duration: "100y" }).success).toBe(false);
    expect(banSchema.safeParse({ reason: "x".repeat(201), duration: "1d" }).success).toBe(false);
  });
});
