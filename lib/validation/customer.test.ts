import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parseCustomerForm } from "./customer";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return data;
}

function fieldErrors(fields: Record<string, string>) {
  const result = parseCustomerForm(form(fields));
  return result.success ? {} : z.flattenError(result.error).fieldErrors;
}

describe("parseCustomerForm", () => {
  it("обрезает пробелы и приводит почту к нижнему регистру", () => {
    const result = parseCustomerForm(form({ name: "  ООО «Ромашка» ", email: " Info@Romashka.RU " }));
    expect(result.success && result.data).toEqual({ name: "ООО «Ромашка»", email: "info@romashka.ru", imageUrl: null });
  });

  it("принимает https-ссылку на логотип", () => {
    const result = parseCustomerForm(
      form({ name: "Ромашка", email: "a@b.ru", imageUrl: "https://cdn.example.com/logo.png" }),
    );
    expect(result.success && result.data.imageUrl).toBe("https://cdn.example.com/logo.png");
  });

  it("требует имя и корректную почту", () => {
    expect(fieldErrors({ name: "   ", email: "a@b.ru" }).name).toEqual(["Введите название или имя"]);
    expect(fieldErrors({ name: "Ромашка", email: "not-an-email" }).email).toEqual(["Некорректный адрес почты"]);
    expect(fieldErrors({ name: "Ромашка" }).email).toBeDefined();
  });

  it("ограничивает длину как в БД", () => {
    expect(fieldErrors({ name: "x".repeat(256), email: "a@b.ru" }).name).toEqual(["Не длиннее 255 символов"]);
  });

  it("отклоняет ссылки не по https", () => {
    expect(fieldErrors({ name: "Р", email: "a@b.ru", imageUrl: "http://example.com/a.png" }).imageUrl).toBeDefined();
    expect(fieldErrors({ name: "Р", email: "a@b.ru", imageUrl: "javascript:alert(1)" }).imageUrl).toBeDefined();
  });
});
