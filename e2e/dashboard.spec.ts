import { expect, test } from "@playwright/test";
import { storageState } from "./helpers";

test.use({ storageState: storageState("viewer") });

test("обзор показывает показатели, выручку, курсы ЦБ и последние счета", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByTestId("page-title")).toHaveText("Обзор");
  for (const card of ["summary-paid", "summary-pending", "summary-invoices", "summary-customers"]) {
    await expect(page.getByTestId(card)).toContainText(/\d/);
  }
  await expect(page.getByTestId("revenue-chart")).toBeVisible();
  await expect(page.getByTestId("latest-invoices")).toBeVisible();

  // Курсы грузятся из внешнего API: в CI ЦБ может быть недоступен — тогда
  // карточка честно сообщает об этом, а страница продолжает работать
  await expect(page.getByTestId("exchange-rates")).toHaveAttribute("data-state", /^(loaded|unavailable)$/);
});
