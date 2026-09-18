import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parseInvoiceForm } from "./invoice";

const CUSTOMER = "20000000-0000-4000-8000-000000000001";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return data;
}

const valid = { customerId: CUSTOMER, amount: "1500.5", status: "paid", date: "2026-09-18" };

function fieldErrors(fields: Record<string, string>) {
  const result = parseInvoiceForm(form(fields));
  return result.success ? {} : z.flattenError(result.error).fieldErrors;
}

describe("parseInvoiceForm", () => {
  it("переводит сумму в центы", () => {
    const result = parseInvoiceForm(form(valid));
    expect(result.success && result.data).toEqual({ customerId: CUSTOMER, amount: 150050, status: "paid", date: "2026-09-18" });
  });

  it("принимает сумму через запятую и с пробелами", () => {
    const result = parseInvoiceForm(form({ ...valid, amount: "1 234,56" }));
    expect(result.success && result.data.amount).toBe(123456);
  });

  it("не теряет центы из-за ошибок округления", () => {
    const result = parseInvoiceForm(form({ ...valid, amount: "0.29" }));
    expect(result.success && result.data.amount).toBe(29);
  });

  it("отклоняет пустую, нулевую, отрицательную и слишком большую сумму", () => {
    expect(fieldErrors({ ...valid, amount: "" }).amount).toBeDefined();
    expect(fieldErrors({ ...valid, amount: "0" }).amount).toEqual(["Сумма должна быть больше нуля"]);
    expect(fieldErrors({ ...valid, amount: "-5" }).amount).toBeDefined();
    expect(fieldErrors({ ...valid, amount: "1000000.01" }).amount).toBeDefined();
    expect(fieldErrors({ ...valid, amount: "abc" }).amount).toBeDefined();
  });

  it("отклоняет больше двух знаков после запятой", () => {
    expect(fieldErrors({ ...valid, amount: "10.001" }).amount).toEqual(["Не больше двух знаков после запятой"]);
  });

  it("требует клиента, статус и дату", () => {
    const errors = fieldErrors({ amount: "10" });
    expect(errors.customerId).toEqual(["Выберите клиента"]);
    expect(errors.status).toEqual(["Выберите статус"]);
    expect(errors.date).toBeDefined();
  });

  it("отклоняет неизвестный статус и кривой id клиента", () => {
    expect(fieldErrors({ ...valid, status: "overdue" }).status).toBeDefined();
    expect(fieldErrors({ ...valid, customerId: "1; DROP TABLE invoices" }).customerId).toBeDefined();
  });

  it("отклоняет несуществующую дату", () => {
    expect(fieldErrors({ ...valid, date: "2026-02-30" }).date).toBeDefined();
    expect(fieldErrors({ ...valid, date: "18.09.2026" }).date).toBeDefined();
  });
});
