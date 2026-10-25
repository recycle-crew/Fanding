import { test, expect } from "@playwright/test";

test("/sales 直接進入與重新整理", { tag: "@critical" }, async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
  await page.goto("/sales");
  await expect(page.locator("#workspace")).toBeVisible();
  await expect(
    page.locator("#workspace").getByRole("heading").first(),
  ).not.toBeEmpty();
  await expect(page).toHaveURL((url) => url.pathname === "/sales");
  const entryURL = page.url();
  await page.reload();
  await expect(page).toHaveURL(entryURL);
  await expect(page.locator("#workspace").first()).toBeVisible();
});

test("@critical 依電話與付款參考查單、日期快捷與重設", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
  await page.goto("/sales?embed=1");
  const search = page.getByLabel("搜尋銷售紀錄", { exact: true });
  await search.fill("0900-000-001");
  await expect(page.locator("tbody tr:visible")).toHaveCount(4);
  await search.fill("PAY-DEMO3");
  await expect(page.locator("tbody tr:visible")).toHaveCount(1);
  await page.getByRole("button", { name: "重設篩選", exact: true }).click();
  await expect(search).toHaveValue("");
  await expect(page).toHaveURL(/embed=1/);
  await page.getByRole("button", { name: "今天", exact: true }).click();
  await expect(page.locator("tbody tr:visible")).toHaveCount(1);
  await page.getByRole("button", { name: "昨天", exact: true }).click();
  await expect(page.getByLabel("開始日期", { exact: true })).toHaveValue(
    "2026-10-19",
  );
  await expect(page.getByLabel("結束日期", { exact: true })).toHaveValue(
    "2026-10-19",
  );
  await page.getByRole("button", { name: "重設篩選", exact: true }).click();
  await page.getByLabel("開始日期", { exact: true }).fill("2026-10-21");
  await expect(page.getByRole("alert")).toContainText(
    "開始日期不可晚於結束日期",
  );
});
