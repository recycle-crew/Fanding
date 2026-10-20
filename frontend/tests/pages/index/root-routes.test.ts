import { test, expect } from "@playwright/test";

test(
  "首頁直接開啟系統，側欄切換後返回首頁",
  { tag: "@critical" },
  async ({ page }, testInfo) => {
    await page.goto("/");
    await expect(page.locator("#workspace")).toBeVisible();
    await expect(
      page.locator(
        'a[href="/docs/planning.html"], a[href="/docs/architecture.html"]',
      ),
    ).toHaveCount(0);
    await expect(page).toHaveTitle("庫存管理系統");
    await expect(page.locator('.demo-banner a[href="/board"]')).toBeVisible();
    await expect(page.locator('#sidebar a[href="/board"]')).toHaveCount(0);
    if (page.viewportSize()!.width < 768)
      await page.locator("#menu-toggle").click();
    await page.locator('[data-module="vendors"]').click();
    await expect(page).toHaveURL(/\/vendors$/);
    await expect(page.locator("#content h2")).toHaveText("廠商資料維護");
    await page.goBack();
    await expect(page).toHaveURL("/");
    await expect(page.locator("#content h2")).toHaveText("工作區總覽");
    await page.reload();
    await expect(page.locator("#content h2")).toHaveText("工作區總覽");
    await page.screenshot({ path: testInfo.outputPath("root-navigation.png") });
    await page.locator('.demo-banner a[href="/board"]').click();
    await expect(page.locator("#page-title")).toBeVisible();
    await expect(
      page.locator(
        'a[href="/docs/planning.html"], a[href="/docs/architecture.html"]',
      ),
    ).toHaveCount(0);
    await page.screenshot({
      path: testInfo.outputPath("board-navigation.png"),
    });
  },
);

test("舊 demo 路徑轉址保留子路徑、查詢及 hash", async ({ page }) => {
  await page.goto("/demo");
  await expect(page).toHaveURL("/");
  await page.goto("/demo/stocktake/history?embed=1#content");
  await expect(page).toHaveURL(/\/stocktake\/history\?embed=1#content$/);
  await expect(page.locator("#content h2")).toHaveText("歷史盤點紀錄");
  await page.reload();
  await expect(page.locator("#content h2")).toHaveText("歷史盤點紀錄");
  await page.goto("/demo.html?embed=1#/stocktake/current");
  await expect(page).toHaveURL(/\/stocktake\/current\?embed=1$/);
  await expect(page.locator("#content h2")).toHaveText("現有盤點週期");
});
