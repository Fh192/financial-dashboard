import { expect, test } from "@playwright/test";
import { USERS } from "./helpers";

// Без сохраненной сессии: проверяем сам вход и выход
test.describe("вход и выход", () => {
  test("без входа панель перенаправляет на страницу входа и запоминает адрес", async ({ page }) => {
    await page.goto("/dashboard/invoices?query=кофейня");

    await expect(page).toHaveURL(/\/login\?from=/);
    await expect(page.getByText("Вход в систему")).toBeVisible();
  });

  test("неверный пароль — понятная ошибка, без подсказки, что именно неверно", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Электронная почта").fill(USERS.manager.email);
    await page.getByLabel("Пароль").fill("wrong-password");
    await page.getByRole("button", { name: "Войти" }).click();

    // role="alert" есть и у служебного объявления маршрутов Next, поэтому уточняем текстом
    await expect(page.getByRole("alert").filter({ hasText: "Неверная почта или пароль." })).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("после входа возвращает на запрошенную страницу, выход завершает сессию", async ({ page }) => {
    await page.goto("/dashboard/customers");
    await page.getByLabel("Электронная почта").fill(USERS.manager.email);
    await page.getByLabel("Пароль").fill(USERS.manager.password);
    await page.getByRole("button", { name: "Войти" }).click();

    await expect(page).toHaveURL(/\/dashboard\/customers$/);
    await expect(page.getByRole("heading", { name: "Клиенты" })).toBeVisible();

    await page.locator('[data-sidebar="footer"]').getByRole("button").click();
    await page.getByRole("menuitem", { name: "Выйти" }).click();
    await expect(page).toHaveURL(/\/login$/);

    // Старая сессия больше не действует
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
