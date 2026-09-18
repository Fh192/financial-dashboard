import { describe, expect, it } from "vitest";
import { isForeignKeyViolation, isUniqueViolation } from "./db-errors";

describe("ошибки PostgreSQL", () => {
  it("узнает нарушение внешнего ключа", () => {
    expect(isForeignKeyViolation({ code: "23503" })).toBe(true);
    expect(isForeignKeyViolation({ code: "23505" })).toBe(false);
    expect(isForeignKeyViolation(new Error("boom"))).toBe(false);
    expect(isForeignKeyViolation(null)).toBe(false);
  });

  it("узнает нарушение уникальности, в том числе конкретного индекса", () => {
    const error = { code: "23505", constraint: "customers_email_lower_key" };
    expect(isUniqueViolation(error)).toBe(true);
    expect(isUniqueViolation(error, "customers_email_lower_key")).toBe(true);
    expect(isUniqueViolation(error, "users_email_lower_key")).toBe(false);
    expect(isUniqueViolation({ code: "23503" })).toBe(false);
  });
});
