import { test, expect } from "@playwright/test";
import { DEMO_LOGIN_ENABLED as loginEnabled } from "../../../../src/constants/demoAccess";
import type { Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-15T04:00:00Z"));
  await page.goto("/");
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

test("React 領用新增、庫存不足、刪除回復及查無資料", async ({ page }) => {
  await expect(page.locator("#workspace")).toBeVisible();
  await navigate(page, "requisitions");
  await page.locator("[data-action=add]").click();
  await page.locator("#editor [name=productId]").selectOption("O001");
  await page.locator("#editor [name=person]").fill("React 測試領用人");
  await page.locator("#editor [name=quantity]").fill("999");
  await page.locator("#editor-form button[type=submit]").click();
  await expect(page.locator("#editor-error")).toContainText("庫存不足");
  await page.locator("#editor [name=quantity]").fill("2");
  await page.locator("#editor-form button[type=submit]").click();
  await page.locator("#search").fill("React 測試領用人");
  await expect(page.locator("#list-table tbody tr:visible")).toHaveCount(1);
  await page.locator("#list-table [data-action=delete]").click();
  await page.locator("#confirmation button[value=confirm]").click();
  await expect(page.locator("#list-table")).toContainText("目前沒有符合的資料");
  await expect(page.locator("#content")).toHaveScreenshot(
    "react-requisition-empty.png",
  );
});

test(
  "/requisitions 直接進入與重新整理",
  { tag: "@critical" },
  async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
    await page.goto("/requisitions");
    await expect(page.locator("#workspace")).toBeVisible();
    await expect(
      page.locator("#workspace").getByRole("heading").first(),
    ).not.toBeEmpty();
    await expect(page).toHaveURL((url) => url.pathname === "/requisitions");
    const entryURL = page.url();
    await page.reload();
    await expect(page).toHaveURL(entryURL);
    await expect(page.locator("#workspace").first()).toBeVisible();
  },
);
