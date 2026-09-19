import { expect, type Page, test } from "@playwright/test";
import { SEED_CUSTOMER, search, storageState, uniqueAmount } from "./helpers";

test.use({ storageState: storageState("manager") });

async function selectOption(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("option", { name: option }).click();
}

test("пустая форма счета показывает ошибки у полей", async ({ page }) => {
  await page.goto("/dashboard/invoices/create");
  await page.getByRole("button", { name: "Создать счет" }).click();

  await expect(page.getByText("Выберите клиента")).toBeVisible();
  await expect(page.getByText("Введите сумму")).toBeVisible();
  await expect(page).toHaveURL(/\/create$/);
});

test("полный цикл счета: создание, поиск, история, смена статуса, удаление", async ({ page }) => {
  const amount = uniqueAmount();

  // Создание: сумма через запятую, как ее вводит пользователь
  await page.goto("/dashboard/invoices/create");
  await selectOption(page, "Клиент", SEED_CUSTOMER.name);
  await page.getByLabel("Сумма, $").fill(amount.dollars.replace(".", ","));
  await selectOption(page, "Статус", "Оплачен");
  await page.getByRole("button", { name: "Создать счет" }).click();
  await expect(page).toHaveURL(/\/dashboard\/invoices$/);

  // Поиск по сумме находит ровно этот счет
  await search(page, amount.dollars);
  const row = page.getByRole("row").filter({ hasText: SEED_CUSTOMER.name });
  await expect(row).toHaveCount(1);
  await expect(row.getByText("Оплачен")).toBeVisible();

  // Журнал статусов заполнил триггер БД от имени менеджера
  await row.getByRole("link", { name: "Изменить счет" }).click();
  const history = page.locator('[data-slot="card"]').filter({ hasText: "История статуса" });
  await expect(history.getByText("Создан:")).toBeVisible();
  await expect(history.getByText(/Менеджер/)).toBeVisible();
  await expect(page.locator('[data-slot="card"]').filter({ hasText: "Сумма по курсу ЦБ РФ" })).toBeVisible();

  // Смена статуса
  await selectOption(page, "Статус", "Ожидает оплаты");
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(page).toHaveURL(/\/dashboard\/invoices$/);
  await search(page, amount.dollars);
  await expect(row.getByText("Ожидает")).toBeVisible();

  // Удаление через диалог подтверждения
  await row.getByRole("button", { name: "Удалить счет" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Удалить" }).click();
  await expect(page.getByText("Счет удален")).toBeVisible();
  await expect(page.getByText(/ничего не найдено/)).toBeVisible();
});

test("несуществующий счет — страница «не найдено»", async ({ page }) => {
  const response = await page.goto("/dashboard/invoices/00000000-0000-4000-8000-000000000000/edit");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("Счет не найден")).toBeVisible();
});
