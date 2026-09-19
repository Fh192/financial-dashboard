import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const isCI = !!process.env.CI;

// E2E-тесты работают с настоящей БД: нужны миграции и тестовые данные
// (pnpm db:migrate && pnpm db:seed). Созданные тестами записи получают
// уникальные имена и удаляются в конце теста.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  // Локально тесты идут на dev-сервер: первая компиляция страницы бывает
  // дольше 5 с, поэтому лимиты больше, чем для продакшен-сборки в CI
  timeout: isCI ? 30_000 : 60_000,
  expect: { timeout: isCI ? 5_000 : 15_000 },
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    locale: "ru-RU",
    timezoneId: "Europe/Moscow",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // Вход под каждой ролью один раз; сессии сохраняются в e2e/.auth
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        // В CI — продакшен-сборка (pnpm build выполняется отдельным шагом)
        command: isCI ? "pnpm start" : "pnpm dev",
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 120_000,
      },
});
