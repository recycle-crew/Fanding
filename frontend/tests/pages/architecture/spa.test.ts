import type { Page, Locator } from "@playwright/test";
import {
  test,
  expect,
  enterWorkspace,
  loginEnabled,
} from "../../helpers/test";
import { checkPageEntry } from "../../helpers/test";


test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-15T04:00:00Z"));
});

test("SPA 頁面載入失敗可重新載入重試", async ({ page }) => {
  await page.route("**/src/pages/Architecture/Home.tsx*", (route) =>
    route.abort(),
  );
  await page.goto("/");
  await page.locator('nav a[href="/architecture"]').click();
  await expect(
    page.getByRole("heading", { name: "畫面載入失敗" }),
  ).toBeVisible();
  await expect(page).toHaveScreenshot("spa-load-error.png");
  await page.unroute("**/src/pages/Architecture/Home.tsx*");
  await page.getByRole("button", { name: "重新載入" }).click();
  await expect(page).toHaveURL(/\/architecture$/);
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.getByRole("heading", { name: "畫面載入失敗" })).toHaveCount(
    0,
  );
});

test("SPA 延遲載入顯示狀態並恢復頁面", async ({ page }) => {
  let resume!: () => void;
  const pending = new Promise<void>((resolve) => {
    resume = resolve;
  });
  await page.route("**/src/pages/Architecture/Home.tsx*", async (route) => {
    await pending;
    await route.continue();
  });
  await page.goto("/");
  await page.locator('nav a[href="/architecture"]').click();
  await expect(
    page.getByRole("status").filter({ hasText: "正在載入畫面…" }),
  ).toBeVisible();
  try {
    await expect(page).toHaveScreenshot("spa-loading.png");
  } finally {
    resume();
  }
  await expect(page.locator("h1")).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "正在載入畫面…" }),
  ).toHaveCount(0);
});


test(
  "/architecture 直接進入與重新整理",
  { tag: "@critical" },
  async ({ page }, info) => {
    await checkPageEntry(page, "/architecture", info);
  },
);
