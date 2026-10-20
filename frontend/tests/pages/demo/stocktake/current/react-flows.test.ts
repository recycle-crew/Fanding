import { test, expect } from "@playwright/test";
import { DEMO_LOGIN_ENABLED as loginEnabled } from "../../../../../src/constants/demoAccess";
import type { Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-15T04:00:00Z"));
  await page.goto("/demo");
  await expect(
    page.locator(loginEnabled ? "#login-form" : "#workspace"),
  ).toBeVisible();
  await page.addStyleTag({ content: "#notice{visibility:hidden!important}" });
});
async function navigate(page: Page, module: string) {
  if (page.viewportSize().width <= 800)
    await page.locator("#menu-toggle").click();
  await page.locator(`[data-module="${module}"]`).click();
}

test("React 盤點草稿、路由保護、鎖定與歷史更正", async ({ page }) => {
  await expect(page.locator("#workspace")).toBeVisible();
  await page.evaluate(() =>
    window.__demoTest.run((state) => {
      state.canEditExistingData = true;
    }),
  );
  await navigate(page, "stocktake");
  await page.locator("[data-action=start-batch]").click();
  await page.locator("#barcode").fill("9902000000001");
  await page.locator("#barcode").press("Enter");
  await page.locator("[data-action=edit-count]").click();
  await page.locator("#editor [name=actual]").fill("238");
  await page.goBack();
  await expect(page.locator("#editor")).toBeVisible();
  await expect(page).toHaveURL(/\/demo\/stocktake\/current$/);
  const warningStyle = await page.addStyleTag({
    content: "#notice{visibility:visible!important}",
  });
  await expect(page.locator("#notice")).toContainText("請先儲存");
  await expect(page.locator("#notice")).toBeVisible();
  await expect(page.locator("#notice")).toHaveScreenshot(
    "react-route-guard-warning.png",
  );
  await warningStyle.evaluate((element) =>
    element.parentNode?.removeChild(element),
  );
  await page.locator("#editor-form button[type=submit]").click();
  await page.locator("[data-confirm-count]").check();
  await page.locator("[data-action=submit-batch]").click();
  await page.locator("#confirmation button[value=cancel]").click();
  await expect(page.locator("[data-action=edit-count]")).toBeVisible();
  await page.locator("[data-action=submit-batch]").click();
  await page.locator("#confirmation button[value=confirm]").click();
  await navigate(page, "stocktake-history");
  await expect(page.locator("#stocktake-batch")).toHaveValue("ST0006");
  await expect(
    page.locator("[data-pagination-key=stocktake-ST0006]"),
  ).toContainText("已送出");
  await page.locator("[data-action=correct-count]").click();
  await page.locator("#editor [name=actual]").fill("237");
  await page.locator("#editor [name=correctionReason]").fill("重新核對");
  await page.locator("#editor-form button[type=submit]").click();
  await expect(
    page.locator("[data-pagination-key=batch-corrections-ST0006]"),
  ).toContainText("重新核對");
  await expect(page.locator("#content")).toHaveScreenshot(
    "react-stocktake-corrected.png",
  );
});

test("React 盤點路由直接開啟與上一頁", async ({ page }) => {
  await page.goto("/demo/stocktake/history");
  await expect(page.locator("#workspace")).toBeVisible();
  await expect(page.locator("#content h2")).toHaveText("歷史盤點紀錄");
  await navigate(page, "stocktake");
  await expect(page).toHaveURL(/\/demo\/stocktake\/current$/);
  await page.goBack();
  await expect(page.locator("#content h2")).toHaveText("歷史盤點紀錄");
});

test("React 盤點未完成不能結束，移除後可取消或結束批次", async ({ page }) => {
  await expect(page.locator("#workspace")).toBeVisible();
  await navigate(page, "stocktake");
  await page.locator("[data-action=start-batch]").click();
  await page.locator("#barcode").fill("9902000000001");
  await page.locator("#barcode").press("Enter");
  await page.locator("[data-action=end-batch]").click();
  await expect(page.locator("#confirmation")).toBeHidden();
  await expect(
    page.locator("[data-pagination-key=batch-operations-ST0006]"),
  ).toContainText("結束批次遭拒");
  await page.locator("[data-action=remove-count]").click();
  await expect(
    page.locator("[data-pagination-key=stocktake-ST0006]"),
  ).toContainText("目前沒有符合的資料");
  await page.locator("[data-action=end-batch]").click();
  await page.locator("#confirmation button[value=cancel]").click();
  await expect(page.locator("[data-action=end-batch]")).toBeVisible();
  await page.locator("[data-action=end-batch]").click();
  await page.locator("#confirmation button[value=confirm]").click();
  await navigate(page, "stocktake-history");
  await expect(page.locator("#stocktake-batch")).toHaveValue("ST0006");
  await expect(
    page.locator("[data-pagination-key=batch-operations-ST0006]"),
  ).toContainText("移除盤點品項");
  await expect(page.locator("#content")).toHaveScreenshot(
    "react-empty-batch-ended.png",
  );
});
