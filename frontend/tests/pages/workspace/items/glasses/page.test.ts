import { test, expect } from "@playwright/test";

test("/items/glasses 直接進入與重新整理", async ({ page }) => {
  await page.goto("/items/glasses");
  await expect(
    page.getByRole("tab", { name: "眼鏡", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.reload();
  await expect(page).toHaveURL((url) => url.pathname === "/items/glasses");
  await expect(
    page.getByRole("tab", { name: "眼鏡", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
});
