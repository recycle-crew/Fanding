import type { Page, Locator } from "@playwright/test";
import {
  test,
  expect,
  enterWorkspace,
  loginEnabled,
} from "../../helpers/test";


test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-15T04:00:00Z"));
});

test("SPA 找不到頁面可返回首頁", async ({ page }) => {
  await page.goto("/demo/missing-module");
  await expect(page.getByRole("heading", { name: "找不到頁面" })).toBeVisible();
  await expect(page).toHaveScreenshot("spa-not-found.png");
  await page.getByRole("link", { name: "返回系統規劃" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.locator("h1")).toBeVisible();
});
