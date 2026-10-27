import { test, expect } from "@playwright/test";

test("規劃板預覽只使用現行工作區", async ({ page }) => {
  await page.goto("/board");
  await expect(page.locator("#page-title")).toBeVisible();
  const preview = page.locator("iframe").first();
  await expect(preview).toBeVisible();
  await expect(preview.contentFrame().locator("#content")).toContainText(
    "品項",
  );
  await page.reload();
  await expect(page).toHaveURL(/\/board$/);
});
