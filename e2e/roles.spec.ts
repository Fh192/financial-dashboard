import { expect, test } from "@playwright/test";
import { storageState, USERS } from "./helpers";

test.describe("наблюдатель", () => {
  test.use({ storageState: storageState("viewer") });

  test("видит счета, но без кнопок изменения", async ({ page }) => {
    await page.goto("/dashboard/invoices");

    await expect(page.getByTestId("invoices-table")).toBeVisible();
    await expect(page.getByTestId("invoice-create")).toHaveCount(0);
    await expect(page.getByTestId("invoice-edit")).toHaveCount(0);
    await expect(page.getByTestId("invoice-delete")).toHaveCount(0);
    // Выгрузка доступна всем ролям
    await expect(page.getByTestId("export-csv")).toBeVisible();
  });

  test("прямые ссылки на изменение не открываются", async ({ page }) => {
    await page.goto("/dashboard/invoices/create");
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/dashboard/users");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("в меню нет управления пользователями", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByTestId("nav-invoices")).toBeVisible();
    await expect(page.getByTestId("nav-users")).toHaveCount(0);
  });
});

test.describe("менеджер", () => {
  test.use({ storageState: storageState("manager") });

  test("может создавать клиентов, но не удалять их", async ({ page }) => {
    await page.goto("/dashboard/customers");

    await expect(page.getByTestId("customer-create")).toBeVisible();
    await expect(page.getByTestId("customers-table").getByTestId("customer-edit").first()).toBeVisible();
    await expect(page.getByTestId("customer-delete")).toHaveCount(0);
  });
});

test.describe("администратор", () => {
  test.use({ storageState: storageState("admin") });

  test("видит пользователей, свою строку без действий", async ({ page }) => {
    await page.goto("/dashboard/users");

    const ownRow = page.getByTestId(`user-row-${USERS.admin.id}`);
    await expect(ownRow.getByTestId("current-user")).toBeVisible();
    await expect(ownRow.getByTestId("user-actions")).toHaveCount(0);
    const managerRow = page.getByTestId(`user-row-${USERS.manager.id}`);
    await expect(managerRow.getByTestId("user-actions")).toBeVisible();
  });
});
