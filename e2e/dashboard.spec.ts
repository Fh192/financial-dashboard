import { expect, test } from "@playwright/test";
import { storageState } from "./helpers";

test.use({ storageState: storageState("viewer") });

test("обзор показывает показатели, выручку, курсы ЦБ и последние счета", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Обзор" })).toBeVisible();
  for (const title of ["Оплачено", "Ожидает оплаты", "Всего счетов", "Всего клиентов"]) {
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  }
  await expect(page.getByText("Выручка", { exact: true })).toBeVisible();
  await expect(page.getByText("Последние счета")).toBeVisible();

  // Курсы грузятся из внешнего API: в CI ЦБ может быть недоступен — тогда
  // карточка честно сообщает об этом, а страница продолжает работать
  const rates = page.locator('[data-slot="card"]').filter({ hasText: "Курсы ЦБ РФ" });
  await expect(rates).toBeVisible();
  await expect(rates.getByText(/Официальные курсы на|Курсы временно недоступны/)).toBeVisible();
});
