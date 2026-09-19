import { describe, expect, it } from "vitest";
import { resolveBaseUrl, vercelTrustedOrigins } from "./deployment";

const vercelProduction = {
  VERCEL: "1",
  VERCEL_ENV: "production",
  VERCEL_URL: "financial-dashboard-abc123-fh192.vercel.app",
  VERCEL_BRANCH_URL: "financial-dashboard-git-master-fh192.vercel.app",
  VERCEL_PROJECT_PRODUCTION_URL: "financial-dashboard.vercel.app",
};

describe("resolveBaseUrl", () => {
  it("явный BETTER_AUTH_URL важнее всего", () => {
    expect(resolveBaseUrl({ ...vercelProduction, BETTER_AUTH_URL: "https://dashboard.example.ru" })).toBe(
      "https://dashboard.example.ru",
    );
  });

  it("в продакшене Vercel берет постоянный домен проекта", () => {
    expect(resolveBaseUrl(vercelProduction)).toBe("https://financial-dashboard.vercel.app");
  });

  it("в preview — адрес конкретного деплоя", () => {
    expect(resolveBaseUrl({ ...vercelProduction, VERCEL_ENV: "preview" })).toBe(
      "https://financial-dashboard-abc123-fh192.vercel.app",
    );
  });

  it("вне Vercel без настроек возвращает undefined — адрес берется из запроса", () => {
    expect(resolveBaseUrl({})).toBeUndefined();
  });
});

describe("vercelTrustedOrigins", () => {
  it("доверяет всем адресам деплоя без дублей", () => {
    expect(vercelTrustedOrigins(vercelProduction)).toEqual([
      "https://financial-dashboard.vercel.app",
      "https://financial-dashboard-git-master-fh192.vercel.app",
      "https://financial-dashboard-abc123-fh192.vercel.app",
    ]);
    expect(vercelTrustedOrigins({ VERCEL_URL: "a.vercel.app", VERCEL_BRANCH_URL: "a.vercel.app" })).toEqual([
      "https://a.vercel.app",
    ]);
  });

  it("вне Vercel ничего не добавляет", () => {
    expect(vercelTrustedOrigins({})).toEqual([]);
  });
});
