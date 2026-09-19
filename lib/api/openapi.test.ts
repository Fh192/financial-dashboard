import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildOpenApiDocument } from "./openapi";

const API_DIR = path.resolve("app/api/v1");
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

/** Все route.ts в app/api/v1 и методы, которые они экспортируют. */
function implementedRoutes(dir = API_DIR): Record<string, string[]> {
  const routes: Record<string, string[]> = {};
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) Object.assign(routes, implementedRoutes(full));
    else if (entry === "route.ts") {
      const source = readFileSync(full, "utf8");
      const url = path
        .relative(API_DIR, dir)
        .split(path.sep)
        .map((s) => s.replace(/^\[(.+)\]$/, "{$1}"))
        .join("/");
      routes[`/${url}`] = METHODS.filter((m) => new RegExp(`export const ${m}\\b`).test(source));
    }
  }
  return routes;
}

describe("спецификация OpenAPI", () => {
  const doc = buildOpenApiDocument();

  it("собирается и описывает общие схемы", () => {
    expect(doc.openapi).toBe("3.1.0");
    expect(Object.keys(doc.components?.schemas ?? {})).toEqual(
      expect.arrayContaining(["Invoice", "InvoiceCreate", "InvoiceUpdate", "Customer", "Error", "Pagination"]),
    );
    expect(doc.components?.securitySchemes).toHaveProperty("bearerAuth");
  });

  it("описывает ровно те пути и методы, что реализованы в app/api/v1", () => {
    const implemented = implementedRoutes();
    const documented = Object.fromEntries(
      Object.entries(doc.paths ?? {}).map(([p, item]) => [
        p,
        METHODS.filter((m) => item && m.toLowerCase() in item),
      ]),
    );
    expect(documented).toEqual(implemented);
  });

  it("у каждой операции есть описание ответов об ошибках доступа", () => {
    for (const [p, item] of Object.entries(doc.paths ?? {})) {
      for (const method of ["get", "post", "patch", "delete"] as const) {
        const op = item?.[method];
        if (op) expect(op.responses, `${method.toUpperCase()} ${p}`).toHaveProperty("401");
      }
    }
  });
});
