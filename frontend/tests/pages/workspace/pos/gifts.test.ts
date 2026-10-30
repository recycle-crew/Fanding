import { test, expect } from "@playwright/test";

test("@critical 品項贈送、取消及零元成交明細", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
  await page.goto("/pos");
  const search = page.getByRole("textbox", {
    name: "掃碼／搜尋商品",
    exact: true,
  });
  for (const code of ["OTC0001", "MED0001"]) {
    await search.fill(code);
    await search.press("Enter");
  }
  const row = page.getByRole("row").filter({ hasText: "葉黃素膠囊" });
  await page.getByLabel("葉黃素膠囊單品折扣", { exact: true }).fill("10");
  await page
    .getByRole("button", { name: "贈送葉黃素膠囊", exact: true })
    .click();
  await expect(row).toContainText("贈送 · 本品項整列 0 元");
  await expect(row.locator(".pos-line-subtotal")).toHaveText("$0");
  await expect(
    page.getByLabel("葉黃素膠囊成交單價", { exact: true }),
  ).toHaveValue("0");
  await page.getByLabel("葉黃素膠囊數量", { exact: true }).fill("2");
  await expect(row.locator(".pos-line-subtotal")).toHaveText("$0");
  await page
    .getByRole("button", { name: "取消贈送葉黃素膠囊", exact: true })
    .click();
  await expect(
    page.getByLabel("葉黃素膠囊成交單價", { exact: true }),
  ).toHaveValue("355");
  await expect(
    page.getByLabel("葉黃素膠囊單品折扣", { exact: true }),
  ).toHaveValue("10");
  await expect(row.locator(".pos-line-subtotal")).toHaveText("$700");
  await page
    .getByRole("button", { name: "贈送葉黃素膠囊", exact: true })
    .click();
  await page.locator("#pos-order-discount-mode").selectOption("percentage");
  await page.locator("#pos-order-discount-percent").fill("10");
  const summary = page.getByRole("region", { name: "結帳摘要", exact: true });
  await expect(summary.locator(".pos-amount")).toContainText("162");
  await row.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("pos-gift.png") });
  expect(
    await row.evaluate(
      (element) => element.scrollWidth <= element.clientWidth + 1,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "前往結帳", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("含 1 項贈送商品（0 元）");
  await expect(dialog.getByRole("region", { name: "結帳金額" })).toContainText(
    "162",
  );
  await dialog
    .getByRole("button", { name: "確認完成結帳", exact: true })
    .click();
  await expect(
    dialog.getByRole("heading", { name: "銷售明細與交易憑證", exact: true }),
  ).toBeVisible();
  const gift = dialog.getByRole("row").filter({ hasText: "葉黃素膠囊" });
  await expect(gift).toContainText("贈送");
  await expect(gift.locator('[data-label="單價"]')).toHaveText("$0");
  await expect(gift.locator('[data-label="整單分攤"]')).toHaveText("—");
  await expect(gift.locator('[data-label="成交淨額"]')).toHaveText("$0");
  await expect(
    dialog.getByRole("region", { name: "交易金額摘要" }),
  ).toContainText("162");
  await gift.scrollIntoViewIfNeeded();
  await dialog.screenshot({ path: testInfo.outputPath("sale-gift.png") });
});

test("全部贈送仍可完成零元結帳", async ({ page }) => {
  await page.goto("/pos");
  const search = page.getByRole("textbox", {
    name: "掃碼／搜尋商品",
    exact: true,
  });
  await search.fill("OTC0001");
  await search.press("Enter");
  await page
    .getByRole("button", { name: "贈送葉黃素膠囊", exact: true })
    .click();
  await page.getByRole("button", { name: "前往結帳", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "確認完成結帳", exact: true })
    .click();
  await expect(
    dialog.getByRole("heading", { name: "銷售明細與交易憑證", exact: true }),
  ).toBeVisible();
  await expect(
    dialog
      .getByRole("region", { name: "交易金額摘要" })
      .locator("strong")
      .first(),
  ).toHaveText("$0");
});
