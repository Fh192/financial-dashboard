import { describe, expect, it } from "vitest";
import { hasPermission, isRole } from "./permissions";

describe("hasPermission", () => {
  it("viewer только читает и выгружает отчеты", () => {
    expect(hasPermission("viewer", { invoice: ["read"], customer: ["read"] })).toBe(true);
    expect(hasPermission("viewer", { report: ["export"] })).toBe(true);
    expect(hasPermission("viewer", { invoice: ["create"] })).toBe(false);
    expect(hasPermission("viewer", { customer: ["update"] })).toBe(false);
    expect(hasPermission("viewer", { user: ["list"] })).toBe(false);
  });

  it("manager работает со счетами, но не удаляет клиентов и не управляет пользователями", () => {
    expect(hasPermission("manager", { invoice: ["read", "create", "update", "delete"] })).toBe(true);
    expect(hasPermission("manager", { customer: ["create", "update"] })).toBe(true);
    expect(hasPermission("manager", { customer: ["delete"] })).toBe(false);
    expect(hasPermission("manager", { user: ["set-role"] })).toBe(false);
    expect(hasPermission("manager", { session: ["revoke"] })).toBe(false);
  });

  it("admin может все, включая пользователей и сессии", () => {
    expect(hasPermission("admin", { customer: ["delete"] })).toBe(true);
    expect(hasPermission("admin", { user: ["create", "list", "set-role", "ban", "delete"] })).toBe(true);
    expect(hasPermission("admin", { session: ["revoke"] })).toBe(true);
  });

  it("требует все перечисленные действия сразу", () => {
    expect(hasPermission("manager", { invoice: ["read"], customer: ["delete"] })).toBe(false);
  });

  it("без роли и с неизвестной ролью прав нет", () => {
    expect(hasPermission(null, { invoice: ["read"] })).toBe(false);
    expect(hasPermission(undefined, { invoice: ["read"] })).toBe(false);
    expect(hasPermission("", { invoice: ["read"] })).toBe(false);
    expect(hasPermission("root", { invoice: ["read"] })).toBe(false);
  });

  it("при нескольких ролях через запятую достаточно одной подходящей", () => {
    expect(hasPermission("viewer, manager", { invoice: ["create"] })).toBe(true);
    expect(hasPermission("viewer,unknown", { invoice: ["create"] })).toBe(false);
  });
});

describe("isRole", () => {
  it("узнает только известные роли", () => {
    expect(isRole("admin")).toBe(true);
    expect(isRole("viewer")).toBe(true);
    expect(isRole("user")).toBe(false);
    expect(isRole(42)).toBe(false);
  });
});
