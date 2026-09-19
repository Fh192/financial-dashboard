import { expect, type Page, test } from "@playwright/test";
import { SEED_CUSTOMER, search, storageState, unique } from "./helpers";

async function fillCustomer(page: Page, name: string, email: string) {
  await page.getByTestId("field-name").fill(name);
  await page.getByTestId("field-email").fill(email);
}

test.describe("менеджер", () => {
  test.use({ storageState: storageState("manager") });

  test("дубль почты в другом регистре отклоняется у поля", async ({ page }) => {
    await page.goto("/dashboard/customers/create");
    await fillCustomer(page, "Дубль", "FINANCE@TechnoSphere.ru");
    await page.getByTestId("form-submit").click();

    await expect(page.getByTestId("field-error-email")).toHaveText("Клиент с такой почтой уже есть.");
    // Введенные значения остались в форме
    await expect(page.getByTestId("field-name")).toHaveValue("Дубль");
  });
});

test.describe("администратор", () => {
  test.use({ storageState: storageState("admin") });

  test("создает, изменяет и удаляет клиента", async ({ page }) => {
    const id = unique();
    const name = `ООО «E2E ${id}»`;

    await page.goto("/dashboard/customers/create");
    await fillCustomer(page, name, `E2E.${id}@Example.com`);
    await page.getByTestId("form-submit").click();
    await expect(page).toHaveURL(/\/dashboard\/customers$/);

    // Уникальный id в названии: поиск находит ровно этого клиента
    await search(page, id);
    const row = page.getByTestId(/^customer-row-/);
    await expect(row).toHaveCount(1);
    await expect(row).toContainText(name);
    // Почта сохранена в нижнем регистре
    await expect(row).toContainText(`e2e.${id}@example.com`);

    await row.getByTestId("customer-edit").click();
    await page.getByTestId("field-name").fill(`${name} 2`);
    await page.getByTestId("form-submit").click();
    await expect(page).toHaveURL(/\/dashboard\/customers$/);

    await search(page, id);
    await expect(row).toContainText(`${name} 2`);
    await row.getByTestId("customer-delete").click();
    await page.getByTestId("confirm-dialog").getByTestId("confirm-delete").click();
    await expect(page.getByTestId("toast-success")).toHaveText("Клиент удален");
  });

  test("клиента со счетами удалить нельзя", async ({ page }) => {
    await page.goto(`/dashboard/customers?query=${encodeURIComponent("ТехноСфера")}`);
    const row = page.getByTestId(`customer-row-${SEED_CUSTOMER.id}`);
    await row.getByTestId("customer-delete").click();
    await page.getByTestId("confirm-dialog").getByTestId("confirm-delete").click();

    await expect(page.getByTestId("toast-error")).toContainText("У клиента есть счета");
    await page.getByTestId("confirm-dialog").getByTestId("confirm-cancel").click();
    await expect(row).toBeVisible();
  });
});
