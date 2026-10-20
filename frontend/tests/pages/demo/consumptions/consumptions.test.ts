import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
  await page.goto("/demo/consumptions");
  await expect(
    page.getByRole("heading", { name: "藥品耗用查詢", exact: true }),
  ).toBeVisible();
});
test("@critical 耗用唯讀查詢、日期、單位、明細與匯出", async ({ page }) => {
  await expect(
    page.getByRole("button", { name: "新增耗用", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText(/查詢淨耗用：/)).toContainText("依單位分列");
  await page.getByRole("button", { name: /查看人工淚液耗用明細/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("首次換算");
  await dialog.getByText("批次分配與更正／取消歷史").first().click();
  await expect(dialog).toContainText("FEFO 帳面推定");
  await expect(dialog.getByRole("textbox")).toHaveCount(0);
  await dialog.getByRole("button", { name: "關閉", exact: true }).click();
  await page.getByRole("textbox", { name: "搜尋耗用資料" }).fill("no-result");
  await expect(page.getByText("目前沒有符合的資料")).toBeVisible();
  await page.getByRole("button", { name: "清除", exact: true }).click();
  await page.getByLabel("開始日期", { exact: true }).fill("2099-12-31");
  await expect(page.getByRole("alert")).toContainText(
    "開始日期不可晚於結束日期",
  );
  await page.getByRole("button", { name: "清除", exact: true }).click();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: /匯出 Excel/ }).click();
  expect((await downloading).suggestedFilename()).toMatch(/\.xlsx$/);
});

test(
  "/demo/consumptions 直接進入與重新整理",
  { tag: "@critical" },
  async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
    await page.goto("/demo/consumptions");
    await expect(page.locator("#workspace")).toBeVisible();
    await expect(
      page.locator("#workspace").getByRole("heading").first(),
    ).not.toBeEmpty();
    await expect(page).toHaveURL(
      (url) => url.pathname === "/demo/consumptions",
    );
    const entryURL = page.url();
    await page.reload();
    await expect(page).toHaveURL(entryURL);
    await expect(page.locator("#workspace").first()).toBeVisible();
  },
);
