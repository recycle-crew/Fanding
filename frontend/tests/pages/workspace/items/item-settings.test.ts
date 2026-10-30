import { test, expect } from "@playwright/test";

test("@critical 四個品項分頁及兩個最低庫存欄位", async ({ page }) => {
  await page.goto("/items");
  for (const [name, path] of [
    ["護理", "nursing"],
    ["眼鏡", "glasses"],
    ["藥品", "his"],
    ["自費其他商品", "general"],
  ]) {
    const tab = page.getByRole("tab", { name, exact: true });
    await tab.click();
    await expect(page).toHaveURL(new RegExp(`/items/${path}$`));
    await expect(tab).toHaveAttribute("aria-selected", "true");
  }
  await page.getByRole("button", { name: "新增品項", exact: true }).click();
  await page.locator("#item-name").fill("最低庫存測試商品");
  await page.locator("#item-category").selectOption("保健食品");
  await page.locator("#item-unit").selectOption("盒");
  await page.locator("#item-safetyStock").fill("12");
  await page.locator("#item-safetyStockSixMonths").fill("24");
  await page.getByRole("button", { name: "儲存品項", exact: true }).click();
  await expect(page.locator("#item-specification")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.locator("#item-specification").fill("30 入");
  await page.getByRole("button", { name: "儲存品項", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await page
    .getByRole("textbox", { name: "搜尋品項", exact: true })
    .fill("最低庫存測試商品");
  const row = page
    .getByRole("row")
    .filter({ hasText: "最低庫存測試商品" })
    .first();
  await expect(row).toContainText("三個月最低庫存 12 盒");
  await expect(row).toContainText("六個月最低庫存 24 盒");
  await page
    .getByRole("button", { name: "編輯最低庫存測試商品", exact: true })
    .click();
  await expect(page.locator("#item-safetyStock")).toHaveValue("12");
  await expect(page.locator("#item-safetyStockSixMonths")).toHaveValue("24");
});
