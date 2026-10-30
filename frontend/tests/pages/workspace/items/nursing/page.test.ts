import { test, expect } from "@playwright/test";

test("/items/nursing 直接進入與重新整理", async ({ page }) => {
  await page.goto("/items/nursing");
  await expect(
    page.getByRole("tab", { name: "護理", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.reload();
  await expect(page).toHaveURL((url) => url.pathname === "/items/nursing");
  await expect(
    page.getByRole("tab", { name: "護理", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
});
