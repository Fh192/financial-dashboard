import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { storageState } from "./helpers";

test.use({ storageState: storageState("viewer") });

test("выгрузка счетов в CSV учитывает поиск и открывается в русском Excel", async ({ page }) => {
  await page.goto(`/dashboard/invoices?query=${encodeURIComponent("кофейня")}`);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "CSV" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/^invoices-\d{4}-\d{2}-\d{2}\.csv$/);
  const bytes = await readFile((await download.path())!);
  // UTF-8 BOM — иначе Excel прочитает кириллицу как windows-1251
  expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);

  const lines = bytes.subarray(3).toString("utf8").split("\r\n");
  expect(lines[0]).toBe("Дата;Клиент;Почта клиента;Сумма, USD;Статус");
  expect(lines.length).toBeGreaterThan(1);
  for (const line of lines.slice(1)) expect(line).toContain("Кофейня на углу");
});
