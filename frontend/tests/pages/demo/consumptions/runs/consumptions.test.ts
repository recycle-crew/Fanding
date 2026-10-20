import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
  await page.goto("/demo/consumptions/runs");
  await expect(
    page.getByRole("heading", { name: "藥品耗用查詢", exact: true }),
  ).toBeVisible();
});
test("@critical 重複同步略過、部分成功與失敗留存、待人工核對", async ({
  page,
}) => {
  const dialog = page.getByRole("dialog");
  async function sync(scenario: string) {
    await page.getByRole("button", { name: "手動同步", exact: true }).click();
    await dialog
      .getByLabel("展示同步情境", { exact: true })
      .selectOption(scenario);
    await dialog
      .getByRole("button", { name: "開始展示同步", exact: true })
      .click();
    await expect(dialog).toBeHidden();
  }
  await sync("success");
  await sync("success");
  await page.getByRole("tab", { name: "同步紀錄", exact: true }).click();
  const first = page.locator("tbody tr:visible").first();
  await expect(first).toContainText("SUCCESS");
  await expect(first.locator("td").nth(5)).toHaveText("0");
  await expect(first.locator("td").nth(6)).toHaveText("2");
  await sync("partial");
  await expect(page.locator("tbody tr:visible").first()).toContainText(
    "PARTIAL_SUCCESS",
  );
  await sync("failure");
  await expect(page.locator("tbody tr:visible").first()).toContainText(
    "FAILED",
  );
  // Module-owned data survives unmounting the consumption page.
  if (
    !(await page
      .getByRole("button", { name: "品項與庫存管理（新版）", exact: true })
      .isVisible())
  )
    await page
      .getByRole("button", { name: "☰ 功能選單", exact: true })
      .click();
  await page
    .getByRole("button", { name: "品項與庫存管理（新版）", exact: true })
    .click();
  await expect(page).toHaveURL(/\/demo\/items\/his$/);
  const menu = page.getByRole("button", { name: "☰ 功能選單", exact: true });
  if (await menu.isVisible()) {
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
  }
  await page
    .getByRole("button", { name: "耗用查詢（新版）", exact: true })
    .click();
  await page.getByRole("tab", { name: "同步紀錄", exact: true }).click();
  await expect(page.locator("tbody tr:visible").first()).toContainText(
    "FAILED",
  );
  await page.getByRole("tab", { name: "同步異常", exact: true }).click();
  await page
    .getByRole("button", { name: "查看異常 RX-DEMO-FAILED", exact: true })
    .first()
    .click();
  await dialog.getByRole("button", { name: "待人工核對", exact: true }).click();
  await expect(dialog).toContainText("未回補庫存");
  await dialog.getByRole("button", { name: "重新處理", exact: true }).click();
  await expect(dialog).toContainText("未新增耗用");
});

test(
  "/demo/consumptions/runs 直接進入與重新整理",
  { tag: "@critical" },
  async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
    await page.goto("/demo/consumptions/runs");
    await expect(page.locator("#workspace")).toBeVisible();
    await expect(
      page.locator("#workspace").getByRole("heading").first(),
    ).not.toBeEmpty();
    await expect(page).toHaveURL(
      (url) => url.pathname === "/demo/consumptions/runs",
    );
    const entryURL = page.url();
    await page.reload();
    await expect(page).toHaveURL(entryURL);
    await expect(page.locator("#workspace").first()).toBeVisible();
  },
);
