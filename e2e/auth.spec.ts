import { expect, test } from "@playwright/test";
import { USERS } from "./helpers";

// Без сохраненной сессии: проверяем сам вход и выход
test.describe("вход и выход", () => {
  test("без входа панель перенаправляет на страницу входа и запоминает адрес", async ({ page }) => {
    await page.goto("/dashboard/invoices?query=кофейня");

    await expect(page).toHaveURL(/\/login\?from=/);
    await expect(page.getByTestId("login-card")).toBeVisible();
  });

  test("неверный пароль — понятная ошибка, без подсказки, что именно неверно", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("field-email").fill(USERS.manager.email);
    await page.getByTestId("field-password").fill("wrong-password");
    await page.getByTestId("form-submit").click();

    await expect(page.getByTestId("login-error")).toHaveText("Неверная почта или пароль.");
    await expect(page).toHaveURL(/\/login/);
  });

  test("после входа возвращает на запрошенную страницу, выход завершает сессию", async ({ page }) => {
    await page.goto("/dashboard/customers");
    await page.getByTestId("field-email").fill(USERS.manager.email);
    await page.getByTestId("field-password").fill(USERS.manager.password);
    await page.getByTestId("form-submit").click();

    await expect(page).toHaveURL(/\/dashboard\/customers$/);
    await expect(page.getByTestId("page-title")).toHaveText("Клиенты");

    await page.getByTestId("user-menu").click();
    await page.getByTestId("logout").click();
    await expect(page).toHaveURL(/\/login$/);

    // Старая сессия больше не действует
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
