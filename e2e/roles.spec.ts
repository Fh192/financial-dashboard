import { expect, test } from "@playwright/test";
import { storageState } from "./helpers";

test.describe("наблюдатель", () => {
  test.use({ storageState: storageState("viewer") });

  test("видит счета, но без кнопок изменения", async ({ page }) => {
    await page.goto("/dashboard/invoices");

    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByRole("link", { name: "Новый счет" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Изменить счет" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Удалить счет" })).toHaveCount(0);
    // Выгрузка доступна всем ролям
    await expect(page.getByRole("link", { name: "CSV" })).toBeVisible();
  });

  test("прямые ссылки на изменение не открываются", async ({ page }) => {
    await page.goto("/dashboard/invoices/create");
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/dashboard/users");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("в меню нет управления пользователями", async ({ page }) => {
    await page.goto("/dashboard");
    const nav = page.locator('[data-sidebar="content"]');
    await expect(nav.getByRole("link", { name: "Счета" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Пользователи" })).toHaveCount(0);
  });
});

test.describe("менеджер", () => {
  test.use({ storageState: storageState("manager") });

  test("может создавать клиентов, но не удалять их", async ({ page }) => {
    await page.goto("/dashboard/customers");

    await expect(page.getByRole("link", { name: "Новый клиент" })).toBeVisible();
    await expect(page.getByRole("table").getByRole("link", { name: "Изменить клиента" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Удалить клиента" })).toHaveCount(0);
  });
});

test.describe("администратор", () => {
  test.use({ storageState: storageState("admin") });

  test("видит пользователей, свою строку без действий", async ({ page }) => {
    await page.goto("/dashboard/users");

    const ownRow = page.getByRole("row").filter({ hasText: "admin@example.com" });
    await expect(ownRow.getByText("Это вы")).toBeVisible();
    const managerRow = page.getByRole("row").filter({ hasText: "manager@example.com" });
    await expect(managerRow.getByRole("button", { name: /Действия/ })).toBeVisible();
  });
});
