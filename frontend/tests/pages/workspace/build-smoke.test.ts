import { test, expect } from "@playwright/test";

test("build 現行首頁、舊網址轉址與正式版無測試入口", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveURL(/\/items\/his$/);
  await expect(page.locator("#content")).toContainText("品項");
  expect(await page.evaluate(() => typeof window.__workspaceTest)).toBe(
    "undefined",
  );
  await page.goto("/stocktake/history");
  await expect(page).toHaveURL(/\/stocktakes$/);
  await expect(page.locator("#content h2")).toHaveText("盤點管理");
  await page.goto("/docs/planning.html#development-readiness");
  await expect(page.locator("#development-readiness")).toBeVisible();
  expect(errors).toEqual([]);
});

test("build 現行盤點清單可下載 XLSX", async ({ page }) => {
  await page.goto("/stocktakes");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /匯出 Excel/ }).click();
  expect((await download).suggestedFilename()).toMatch(/\.xlsx$/);
});

test("build 規劃板可切換盤點清單與差異核對", async ({ page }) => {
  await page.goto("/board");
  await page.locator('[data-page="stocktakes"]').click();
  await page.locator("#start-tour").click();
  await expect(page.locator("#player")).toBeVisible();
  await expect(page.locator("#player-status")).toHaveText("");
  await expect(
    page.frameLocator("#interactive-workspace").locator("#content h2"),
  ).toHaveText("盤點管理");
  await page.locator("#next-step").click();
  await expect(page.locator("#step-title")).toHaveText("盤點差異核對");
  await expect(
    page.frameLocator("#interactive-workspace").locator("#content h2"),
  ).toHaveText("盤點差異核對");
  await page.locator("#close-player").click();
  await expect(page.locator("#player")).not.toBeVisible();
});
