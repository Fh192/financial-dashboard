import { expect, test } from "@playwright/test";
import { apiToken, SEED_CUSTOMER, uniqueAmount } from "./helpers";

// REST API с Bearer-токеном, как у внешнего клиента (без cookie браузера)
test.describe("REST API", () => {
  test("без аутентификации — 401 в едином формате ошибок", async ({ request }) => {
    const response = await request.get("/api/v1/invoices");
    expect(response.status()).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: "UNAUTHORIZED" } });
  });

  test("менеджер создает, изменяет и удаляет счет; журнал пишет автора", async ({ request }) => {
    const auth = { Authorization: `Bearer ${await apiToken(request, "manager")}` };
    const amount = uniqueAmount();

    const created = await request.post("/api/v1/invoices", {
      headers: auth,
      data: { customerId: SEED_CUSTOMER.id, amountCents: amount.cents },
    });
    expect(created.status()).toBe(201);
    const invoice = await created.json();
    expect(invoice).toMatchObject({ customerName: SEED_CUSTOMER.name, amountCents: amount.cents, status: "pending" });
    expect(created.headers()["location"]).toBe(`/api/v1/invoices/${invoice.id}`);

    const patched = await request.patch(`/api/v1/invoices/${invoice.id}`, { headers: auth, data: { status: "paid" } });
    expect(patched.status()).toBe(200);
    expect((await patched.json()).status).toBe("paid");

    const history = await (await request.get(`/api/v1/invoices/${invoice.id}/history`, { headers: auth })).json();
    expect(history.data).toMatchObject([
      { oldStatus: "pending", newStatus: "paid", changedBy: "Менеджер" },
      { oldStatus: null, newStatus: "pending", changedBy: "Менеджер" },
    ]);

    expect((await request.delete(`/api/v1/invoices/${invoice.id}`, { headers: auth })).status()).toBe(204);
    expect((await request.get(`/api/v1/invoices/${invoice.id}`, { headers: auth })).status()).toBe(404);
  });

  test("ошибки проверки возвращаются по полям", async ({ request }) => {
    const auth = { Authorization: `Bearer ${await apiToken(request, "manager")}` };
    const response = await request.post("/api/v1/invoices", {
      headers: auth,
      data: { customerId: "not-a-uuid", amountCents: -5, extra: true },
    });
    expect(response.status()).toBe(400);
    const { error } = await response.json();
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(Object.keys(error.details)).toEqual(expect.arrayContaining(["customerId", "amountCents"]));
  });

  test("права ролей: наблюдатель только читает", async ({ request }) => {
    const auth = { Authorization: `Bearer ${await apiToken(request, "viewer")}` };

    expect((await request.get("/api/v1/summary", { headers: auth })).status()).toBe(200);
    const denied = await request.post("/api/v1/invoices", {
      headers: auth,
      data: { customerId: SEED_CUSTOMER.id, amountCents: 100 },
    });
    expect(denied.status()).toBe(403);
  });

  test("спецификация OpenAPI и документация доступны", async ({ request }) => {
    const spec = await (await request.get("/api/openapi.json")).json();
    expect(spec.openapi).toBe("3.1.0");
    expect(Object.keys(spec.paths)).toContain("/invoices/{id}");
    expect((await request.get("/api/docs")).status()).toBe(200);
  });
});
