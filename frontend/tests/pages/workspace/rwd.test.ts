import { test, expect } from "@playwright/test";

test("RWD 工作區選單只呈現現行模組，切頁保持可操作", async ({
  page,
}, testInfo) => {
  await page.goto("/items");
  const mobile = page.viewportSize()!.width < 768;
  if (mobile) await page.locator("#menu-toggle").click();
  const nav = page.getByRole("navigation", { name: "功能選單", exact: true });
  await expect(nav.getByRole("button")).toHaveCount(6);
  await expect(nav).not.toContainText("新版");
  await nav.getByRole("button", { name: "基礎資料管理", exact: true }).click();
  await expect(page).toHaveURL(/\/base-data$/);
  if (mobile) await expect(page.locator("#sidebar")).toBeHidden();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: testInfo.outputPath("workspace-navigation.png"),
    fullPage: true,
  });
});

test("桌面側欄可用鍵盤調整寬度", async ({ page }) => {
  test.skip(page.viewportSize()!.width < 768);
  await page.goto("/items");
  const resize = page.getByRole("separator", {
    name: "調整導覽區塊寬度，使用左右方向鍵",
  });
  await resize.focus();
  const original = Number(await resize.getAttribute("aria-valuenow"));
  await page.keyboard.press("ArrowRight");
  await expect(resize).toHaveAttribute("aria-valuenow", String(original + 20));
});
