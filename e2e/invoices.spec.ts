import { expect, type Page, test } from "@playwright/test";
import { SEED_CUSTOMER, search, storageState, uniqueAmount } from "./helpers";

test.use({ storageState: storageState("manager") });

async function selectOption(page: Page, field: string, value: string) {
  await page.getByTestId(`field-${field}`).click();
  await page.getByTestId(`option-${value}`).click();
}

test("пустая форма счета показывает ошибки у полей", async ({ page }) => {
  await page.goto("/dashboard/invoices/create");
  await page.getByTestId("form-submit").click();

  await expect(page.getByTestId("field-error-customerId")).toHaveText("Выберите клиента");
  await expect(page.getByTestId("field-error-amount")).toHaveText("Введите сумму");
  await expect(page).toHaveURL(/\/create$/);
});

test("полный цикл счета: создание, поиск, история, смена статуса, удаление", async ({ page }) => {
  const amount = uniqueAmount();

  // Создание: сумма через запятую, как ее вводит пользователь
  await page.goto("/dashboard/invoices/create");
  await selectOption(page, "customerId", SEED_CUSTOMER.id);
  await page.getByTestId("field-amount").fill(amount.dollars.replace(".", ","));
  await selectOption(page, "status", "paid");
  await page.getByTestId("form-submit").click();
  await expect(page).toHaveURL(/\/dashboard\/invoices$/);

  // Поиск по сумме находит ровно этот счет
  await search(page, amount.dollars);
  const row = page.getByTestId(/^invoice-row-/);
  await expect(row).toHaveCount(1);
  await expect(row).toContainText(SEED_CUSTOMER.name);
  await expect(row.getByTestId("invoice-status")).toHaveAttribute("data-status", "paid");

  // Журнал статусов заполнил триггер БД от имени менеджера
  await row.getByTestId("invoice-edit").click();
  const created = page.getByTestId("status-history-created");
  await expect(created).toHaveAttribute("data-new-status", "paid");
  await expect(created).toContainText("Менеджер");
  await expect(page.getByTestId("amount-in-currencies")).toBeVisible();

  // Смена статуса
  await selectOption(page, "status", "pending");
  await page.getByTestId("form-submit").click();
  await expect(page).toHaveURL(/\/dashboard\/invoices$/);
  await search(page, amount.dollars);
  await expect(row.getByTestId("invoice-status")).toHaveAttribute("data-status", "pending");

  // Удаление через диалог подтверждения
  await row.getByTestId("invoice-delete").click();
  await page.getByTestId("confirm-dialog").getByTestId("confirm-delete").click();
  await expect(page.getByTestId("toast-success")).toHaveText("Счет удален");
  await expect(page.getByTestId("empty-state")).toBeVisible();
});

test("несуществующий счет — страница «не найдено»", async ({ page }) => {
  const response = await page.goto("/dashboard/invoices/00000000-0000-4000-8000-000000000000/edit");
  expect(response?.status()).toBe(404);
  await expect(page.getByTestId("invoice-not-found")).toBeVisible();
});
