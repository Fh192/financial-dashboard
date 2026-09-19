import { describe, expect, it } from "vitest";
import { CustomerCreateSchema, CustomerUpdateSchema, InvoiceCreateSchema, InvoiceUpdateSchema, ListQuerySchema } from "./schemas";

const CUSTOMER = "20000000-0000-4000-8000-000000000001";

describe("InvoiceCreateSchema", () => {
  it("по умолчанию ставит статус pending, а дату оставляет обработчику", () => {
    expect(InvoiceCreateSchema.parse({ customerId: CUSTOMER, amountCents: 150050 })).toEqual({
      customerId: CUSTOMER,
      amountCents: 150050,
      status: "pending",
    });
  });

  it("принимает сумму только целым положительным числом центов в пределах лимита", () => {
    expect(InvoiceCreateSchema.safeParse({ customerId: CUSTOMER, amountCents: 10.5 }).success).toBe(false);
    expect(InvoiceCreateSchema.safeParse({ customerId: CUSTOMER, amountCents: 0 }).success).toBe(false);
    expect(InvoiceCreateSchema.safeParse({ customerId: CUSTOMER, amountCents: "100" }).success).toBe(false);
    expect(InvoiceCreateSchema.safeParse({ customerId: CUSTOMER, amountCents: 100_000_001 }).success).toBe(false);
  });

  it("отклоняет неизвестные поля и несуществующие даты", () => {
    expect(InvoiceCreateSchema.safeParse({ customerId: CUSTOMER, amountCents: 1, id: "x" }).success).toBe(false);
    expect(InvoiceCreateSchema.safeParse({ customerId: CUSTOMER, amountCents: 1, date: "2026-02-30" }).success).toBe(false);
  });
});

describe("схемы изменения", () => {
  it("требуют хотя бы одно поле", () => {
    expect(InvoiceUpdateSchema.safeParse({}).success).toBe(false);
    expect(CustomerUpdateSchema.safeParse({}).success).toBe(false);
    expect(InvoiceUpdateSchema.parse({ status: "paid" })).toEqual({ status: "paid" });
  });

  it("позволяют убрать логотип клиента через null", () => {
    expect(CustomerUpdateSchema.parse({ imageUrl: null })).toEqual({ imageUrl: null });
  });
});

describe("CustomerCreateSchema", () => {
  it("нормализует почту и проверяет ссылку на логотип так же, как форма", () => {
    expect(CustomerCreateSchema.parse({ name: " Ромашка ", email: "A@B.RU" })).toEqual({ name: "Ромашка", email: "a@b.ru" });
    expect(CustomerCreateSchema.safeParse({ name: "Р", email: "a@b.ru", imageUrl: "http://x.ru/a.png" }).success).toBe(false);
  });
});

describe("ListQuerySchema", () => {
  it("подставляет значения по умолчанию и ограничивает размер страницы", () => {
    expect(ListQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(ListQuerySchema.parse({ page: "3", pageSize: "50", query: " acme " })).toEqual({ page: 3, pageSize: 50, query: "acme" });
    expect(ListQuerySchema.safeParse({ pageSize: "1000" }).success).toBe(false);
    expect(ListQuerySchema.safeParse({ page: "0" }).success).toBe(false);
  });
});
