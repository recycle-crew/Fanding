import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
  await page.goto("/demo/base-data");
  await expect(
    page.getByRole("heading", { name: "基礎資料管理", exact: true }),
  ).toBeVisible();
});

test("新增主檔提供進貨選項，既有單據仍維持快照", async ({ page }) => {
  await page.getByRole("button", { name: "新增倉別", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("倉別代碼").fill("SHARED");
  await dialog.getByLabel("倉別名稱").fill("共用展示倉");
  await dialog.getByRole("button", { name: "儲存", exact: true }).click();
  await expect(dialog).toBeHidden();
  const menu = page.getByRole("button", { name: "☰ 功能選單", exact: true });
  if (await menu.isVisible()) await menu.click();
  await page
    .getByRole("button", { name: "進貨管理（新版）", exact: true })
    .click();
  await page.getByRole("button", { name: "新增進貨單", exact: true }).click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("option", { name: "共用展示倉", exact: true }),
  ).toHaveCount(1);
});
