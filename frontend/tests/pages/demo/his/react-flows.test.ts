import {
  test,
  expect,
  enterWorkspace,
  loginEnabled,
  checkPageEntry,
} from "../../../helpers/test";
import type { Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-15T04:00:00Z"));
  await page.goto("/demo");
  await expect(
    page.locator(loginEnabled ? "#login-form" : "#workspace"),
  ).toBeVisible();
  await page.addStyleTag({ content: "#notice{visibility:hidden!important}" });
});
async function login(page: Page, privileged = false) {
  await enterWorkspace(page, privileged);
}
async function navigate(page: Page, module: string) {
  if (page.viewportSize().width <= 800)
    await page.locator("#menu-toggle").click();
  await page.locator(`[data-module="${module}"]`).click();
}

test("React HIS 高權限回寫展示不修改庫存", async ({ page }) => {
  await login(page, true);
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

test(
  "/demo/his 直接進入與重新整理",
  { tag: "@critical" },
  async ({ page }, info) => {
    await checkPageEntry(page, "/demo/his", info);
  },
);
