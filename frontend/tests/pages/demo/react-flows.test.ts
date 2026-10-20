import { test, expect } from "@playwright/test";
import { DEMO_LOGIN_ENABLED as loginEnabled } from "../../../src/constants/demoAccess";
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

test(
  "Demo 依目前登入設定進入工作區",
  { tag: "@critical" },
  async ({ page }) => {
    if (!loginEnabled) {
      await expect(page.locator("#login-form")).toHaveCount(0);
      await expect(page.locator("#logout")).toBeHidden();
      await expect(page.locator("#workspace")).toBeVisible();
      return;
    }
    await page.locator("#login-form [name=account]").fill("");
    await page.locator("#login-form button[type=submit]").click();
    await expect(page.locator("#workspace")).toBeHidden();
    await page.locator("#login-form [name=account]").fill("demo.user");
    await page.locator("#forgot-password").click();
    await expect(page.locator("#recovery-form [name=account]")).toBeFocused();
    await page.locator("#recovery-form [name=email]").fill("user@example.test");
    await page.locator("#recovery-form button[type=submit]").click();
    await expect(page.locator("#recovery-result")).toContainText(
      "本次未查詢帳號",
    );
    await expect(page.locator("#password-recovery")).toHaveScreenshot(
      "react-recovery.png",
    );
    await page.locator("#back-to-login").click();
    await expect(page.locator("#workspace")).toBeVisible();
    await expect(page.locator("#account-label")).toContainText("demo.user");
  },
);
