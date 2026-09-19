import { expect, type Page, test } from "@playwright/test";
import { SEED_CUSTOMER, search, storageState, unique } from "./helpers";

async function fillCustomer(page: Page, name: string, email: string) {
  await page.getByLabel("Название или имя").fill(name);
  await page.getByLabel("Почта для счетов").fill(email);
}

test.describe("менеджер", () => {
  test.use({ storageState: storageState("manager") });

  test("дубль почты в другом регистре отклоняется у поля", async ({ page }) => {
    await page.goto("/dashboard/customers/create");
    await fillCustomer(page, "Дубль", "FINANCE@TechnoSphere.ru");
    await page.getByRole("button", { name: "Добавить клиента" }).click();

    await expect(page.getByText("Клиент с такой почтой уже есть.")).toBeVisible();
    // Введенные значения остались в форме
    await expect(page.getByLabel("Название или имя")).toHaveValue("Дубль");
  });
});

test.describe("администратор", () => {
  test.use({ storageState: storageState("admin") });

  test("создает, изменяет и удаляет клиента", async ({ page }) => {
    const id = unique();
    const name = `ООО «E2E ${id}»`;

    await page.goto("/dashboard/customers/create");
    await fillCustomer(page, name, `E2E.${id}@Example.com`);
    await page.getByRole("button", { name: "Добавить клиента" }).click();
    await expect(page).toHaveURL(/\/dashboard\/customers$/);

    await search(page, id);
    const row = page.getByRole("row").filter({ hasText: name });
    // Почта сохранена в нижнем регистре
    await expect(row.getByText(`e2e.${id}@example.com`)).toBeVisible();

    await row.getByRole("link", { name: "Изменить клиента" }).click();
    await page.getByLabel("Название или имя").fill(`${name} 2`);
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expect(page).toHaveURL(/\/dashboard\/customers$/);

    await search(page, id);
    const renamed = page.getByRole("row").filter({ hasText: `${name} 2` });
    await renamed.getByRole("button", { name: "Удалить клиента" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Удалить" }).click();
    await expect(page.getByText("Клиент удален")).toBeVisible();
  });

  test("клиента со счетами удалить нельзя", async ({ page }) => {
    await page.goto(`/dashboard/customers?query=${encodeURIComponent("ТехноСфера")}`);
    const row = page.getByRole("row").filter({ hasText: SEED_CUSTOMER.name });
    await row.getByRole("button", { name: "Удалить клиента" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Удалить" }).click();

    await expect(page.getByText(/У клиента есть счета/)).toBeVisible();
    await page.getByRole("alertdialog").getByRole("button", { name: "Отмена" }).click();
    await expect(row).toBeVisible();
  });
});
