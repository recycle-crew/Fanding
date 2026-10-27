import { test, expect } from "@playwright/test";

test("@critical 首頁進入品項管理，側欄只保留目前模組", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/items\/his$/);
  await expect(page).toHaveTitle("庫存管理系統");
  if (page.viewportSize()!.width < 768)
    await page.locator("#menu-toggle").click();
  const nav = page.getByRole("navigation", { name: "功能選單", exact: true });
  await expect(nav.getByRole("button")).toHaveText([
    "品項與庫存管理",
    "進貨管理",
    "基礎資料管理",
    "耗用查詢",
    "銷售管理",
    "盤點管理",
  ]);
  await expect(page.getByText("舊頁面區", { exact: true })).toHaveCount(0);
  await expect(nav).not.toContainText("新版");
  await nav.getByRole("button", { name: "盤點管理", exact: true }).click();
  await expect(page).toHaveURL(/\/stocktakes$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/items\/his$/);
  await page.reload();
  await expect(page.locator("#content")).toContainText("品項");
  await page.screenshot({
    path: testInfo.outputPath("current-workspace.png"),
    fullPage: true,
  });
});

test("舊 demo 網址轉到現行模組並保留查詢與錨點", async ({ page }) => {
  await page.goto("/demo");
  await expect(page).toHaveURL(/\/items\/his$/);
  await page.goto("/demo/stocktake/history?embed=1#content");
  await expect(page).toHaveURL(/\/stocktakes\?embed=1#content$/);
  await page.reload();
  await expect(page.locator("#content h2")).toHaveText("盤點管理");
  await page.goto("/demo.html?embed=1#/stocktake/current");
  await expect(page).toHaveURL(/\/stocktakes\?embed=1$/);
});
