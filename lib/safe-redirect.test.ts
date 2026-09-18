import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./safe-redirect";

describe("safeRedirectPath", () => {
  it("пропускает пути внутри приложения вместе с параметрами", () => {
    expect(safeRedirectPath("/dashboard/invoices")).toBe("/dashboard/invoices");
    expect(safeRedirectPath("/dashboard/invoices?page=2&query=acme")).toBe("/dashboard/invoices?page=2&query=acme");
  });

  it("без параметра ведет в панель", () => {
    expect(safeRedirectPath(null)).toBe("/dashboard");
    expect(safeRedirectPath(undefined)).toBe("/dashboard");
    expect(safeRedirectPath("")).toBe("/dashboard");
  });

  it("не уводит на внешние сайты", () => {
    expect(safeRedirectPath("https://evil.example")).toBe("/dashboard");
    expect(safeRedirectPath("//evil.example")).toBe("/dashboard");
    expect(safeRedirectPath("/\\evil.example")).toBe("/dashboard");
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/dashboard");
  });

  it("не зацикливается на странице входа и не ведет в API", () => {
    expect(safeRedirectPath("/login")).toBe("/dashboard");
    expect(safeRedirectPath("/login?from=/dashboard")).toBe("/dashboard");
    expect(safeRedirectPath("/api/auth/sign-out")).toBe("/dashboard");
  });
});
