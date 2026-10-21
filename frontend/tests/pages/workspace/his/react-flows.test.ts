import { test, expect } from "@playwright/test";
import { WORKSPACE_LOGIN_ENABLED as loginEnabled } from "../../../../src/constants/workspaceAccess";
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

test("React HIS 高權限回寫展示不修改庫存", async ({ page }) => {
  await expect(page.locator("#workspace")).toBeVisible();
  await page.evaluate(() =>
    window.__workspaceTest.run((state) => {
      state.canEditExistingData = true;
    }),
  );
  await navigate(page, "his");
  const row = page.locator("#list-table tbody tr").first();
  await expect(row).toContainText("1200");
  await row.locator("[data-action=edit]").click();
  await page.locator("#editor [name=name]").fill("示例藥品 React");
  await page.locator("#editor-form button[type=submit]").click();
  await expect(row).toContainText("示例藥品 React");
  await expect(row).toContainText("1200");
  await expect(
    page.locator("[data-pagination-key=data-changes-his]"),
  ).toContainText("示例藥品 A");
  await expect(page.locator("#content")).toHaveScreenshot(
    "react-his-changed.png",
  );
});

test("/his 直接進入與重新整理", { tag: "@critical" }, async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
  await page.goto("/his");
  await expect(page.locator("#workspace")).toBeVisible();
  await expect(
    page.locator("#workspace").getByRole("heading").first(),
  ).not.toBeEmpty();
  await expect(page).toHaveURL((url) => url.pathname === "/his");
  const entryURL = page.url();
  await page.reload();
  await expect(page).toHaveURL(entryURL);
  await expect(page.locator("#workspace").first()).toBeVisible();
});
