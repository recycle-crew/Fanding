import { test, expect } from "@playwright/test";

test("@critical 退貨紀錄可查詢並往返原銷售單", async ({ page }, testInfo) => {
  await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
  await page.goto("/sales/returns");
  await expect(
    page.getByRole("tab", { name: "退貨紀錄", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("button", {
      name: "查看退貨單 SR20261019-0001",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByLabel("搜尋退貨紀錄", { exact: true })
    .fill("SR20261019-0001");
  await expect(page.getByRole("button", { name: /查看退貨單 SR/ })).toHaveCount(
    1,
  );
  await page
    .getByRole("button", { name: "查看退貨單 SR20261019-0001", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("table", { name: "退貨商品明細", exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("region", { name: "退貨金額摘要", exact: true }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "原銷售明細", exact: true }).click();
  await dialog
    .getByRole("button", { name: "SR20261019-0001", exact: true })
    .click();
  await expect(
    dialog.getByRole("table", { name: "退貨商品明細", exact: true }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "關閉", exact: true }).click();
  await page.getByRole("button", { name: "重設退貨篩選", exact: true }).click();
  await page.getByRole("button", { name: "待退款退貨單", exact: true }).click();
  await expect(page.getByRole("button", { name: /查看退貨單 SR/ })).toHaveCount(
    1,
  );
  await page.setViewportSize({ width: 320, height: 800 });
  await expect(
    page.getByRole("button", {
      name: "查看退貨單 SR20261019-0001",
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("return-records-mobile.png"),
    fullPage: true,
  });
});
