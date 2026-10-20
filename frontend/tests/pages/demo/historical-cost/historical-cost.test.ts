import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

import * as XLSX from "xlsx";
import * as fs from "node:fs";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-15T04:00:00Z"));
  await page.goto("/demo");
  await expect(page.locator("#workspace")).toBeVisible();
  await page.addStyleTag({
    content: "#notice {visibility:hidden !important;}",
  });
});
async function navigate(page: Page, module: string) {
  if (page.viewportSize().width <= 800)
    await page.locator("#menu-toggle").click();
  await page.locator(`#module-nav [data-module="${module}"]`).click();
  if (module === "historical-cost") {
    await expect(page.locator(".field-hint").first()).toContainText(
      "數量加權平均",
    );
    await expect(page.locator("#content")).not.toContainText("算法待確認");
  }
}
async function purchase(page: Page, quantity: number, price: number) {
  await page.locator('[data-action="create-voucher"]').click();
  await page.locator("#barcode").fill("9902000000001");
  await page.locator("#barcode").press("Enter");
  await page.locator('[name="quantity"]').fill(String(quantity));
  await page.locator('[name="unitCost"]').fill(String(price));
  await page.locator('#movement-form button[type="submit"]').click();
  await page.locator('[data-action="submit-voucher"]').click();
  await page.locator('#confirmation button[value="confirm"]').click();
}
test("入庫單價快照、數量加權平均及已送出傳票鎖定", async ({ page }) => {
  await navigate(page, "receipt");
  await purchase(page, 10, 20);
  await purchase(page, 30, 40);
  await expect(page.locator(".voucher-section")).toContainText("40.00");
  await page.evaluate(() =>
    window.__demoTest.run((state, domain) => {
      state.otcProducts[0].costPrice = 999;
      state.otcProducts[0].name = "更名後品項";
    }),
  );
  await navigate(page, "historical-cost");
  const row = page.locator(
    '[data-pagination-key="historical-cost-summary"] tbody tr',
  );
  await expect(row).toContainText("35.00");
  await expect(row).toContainText("1400.00");
  await expect(row).toContainText("醫用口罩");
  expect(
    await page.evaluate(() =>
      window.__demoTest.run((state, domain) =>
        state.movementVouchers.map((voucher) => voucher.lines[0].unitCost),
      ),
    ),
  ).toEqual([20, 40]);
  await expect(page.locator("#content")).toHaveScreenshot(
    "historical-cost-weighted.png",
  );
});
test("草稿取消出庫不納入，缺單價不當零，零元合法", async ({ page }) => {
  await page.evaluate(() =>
    window.__demoTest.run((state, domain) => {
      for (const [direction, cost, quantity, voucherStatus] of [
        ["receipt", 0, 2, "posted"],
        ["receipt", null, 1, "posted"],
        ["receipt", 50, 10, "draft"],
        ["receipt", 60, 10, "cancelled"],
        ["issue", 900, 1, "posted"],
      ] as const) {
        const voucher = domain.createMovementVoucher(state, direction);
        voucher.lines.push({
          productId: "O001",
          quantity,
          note: "成本案例",
          unitCost: cost,
          filledBy: state.currentAccount,
        });
        if (voucherStatus === "posted")
          domain.submitMovementVoucher(state, voucher);
        if (voucherStatus === "cancelled")
          voucher.cancelledAt = voucher.createdAt;
      }
    }),
  );
  await navigate(page, "historical-cost");
  await expect(
    page.locator('[data-pagination-key="historical-cost-details"] tbody tr'),
  ).toHaveCount(2);
  await expect(
    page.locator('[data-pagination-key="historical-cost-summary"]'),
  ).toContainText("缺 1 筆單價");
  await expect(page.locator("#content")).toHaveScreenshot(
    "historical-cost-missing.png",
  );
  await page.locator('[name="voucherId"]').fill("20261015001");
  await page.locator('#historical-cost-filter button[type="submit"]').click();
  await expect(
    page.locator('[data-pagination-key="historical-cost-summary"]'),
  ).toContainText("0.00");
  await expect(page.locator("#content")).toHaveScreenshot(
    "historical-cost-zero.png",
  );
});
test("成本篩選交集、跨頁 XLSX、無結果與錯誤重試", async ({ page }) => {
  await page.evaluate(() =>
    window.__demoTest.run((state, domain) => {
      const voucher = domain.createMovementVoucher(state, "receipt");
      for (let index = 0; index < 6; index++)
        voucher.lines.push({
          productId: index % 2 ? "O002" : "O001",
          quantity: 1,
          note: "明細",
          unitCost: index === 0 ? 0.01 : 0.02,
          filledBy: state.currentAccount,
        });
      domain.submitMovementVoucher(state, voucher);
    }),
  );
  await navigate(page, "historical-cost");
  const details = page
    .locator('[data-pagination-key="historical-cost-details"]')
    .locator("..");
  await details.locator("[data-page-next]").click();
  await expect(details.locator("tbody tr:visible")).toHaveCount(1);
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    details.locator("[data-export-excel]").click(),
  ]);
  const workbook = XLSX.read(fs.readFileSync(await download.path()), {
    type: "buffer",
  });
  const rows = XLSX.utils.sheet_to_json<(string | number | boolean)[]>(
    workbook.Sheets[workbook.SheetNames[0]],
    {
      header: 1,
    },
  );
  expect(rows).toHaveLength(7);
  expect(rows[0]).toContain("入庫單價");
  expect(rows[1]).toContain("20261015001");
  const costCell =
    workbook.Sheets[workbook.SheetNames[0]][
      XLSX.utils.encode_cell({
        r: 1,
        c: rows[0].indexOf("入庫單價"),
      })
    ];
  expect(costCell.t).toBe("n");
  expect(costCell.v).toBe(0.02);
  await expect(
    page
      .locator('[data-pagination-key="historical-cost-summary"] tbody tr')
      .first()
      .locator("td")
      .nth(5),
  ).toHaveText("0.02");
  await expect(page.locator("#content")).toHaveScreenshot(
    "historical-cost-pagination.png",
  );
  await page.locator('[name="materialNumber"]').fill("O001");
  await page.locator('[name="person"]').fill("pharmacy");
  await page.locator('#historical-cost-filter button[type="submit"]').click();
  await expect(
    page
      .locator('[data-pagination-key="historical-cost-details"]')
      .locator("..")
      .locator(".export-status"),
  ).toHaveText("");
  await expect(
    page.locator('[data-pagination-key="historical-cost-details"] tbody tr'),
  ).toHaveCount(3);
  await page.locator('[name="start"]').fill("2026-10-16T00:00");
  await page.locator('[name="end"]').fill("2026-10-15T00:00");
  await page.locator('#historical-cost-filter button[type="submit"]').click();
  await expect(page.locator("#historical-cost-error")).toContainText(
    "不可早於",
  );
  await expect(page.locator("#content")).toHaveScreenshot(
    "historical-cost-invalid-date.png",
  );
  await page.locator('[data-action="clear-historical-cost-filter"]').click();
  await page.locator('[name="voucherId"]').fill("999");
  await page.locator('#historical-cost-filter button[type="submit"]').click();
  await expect(
    page.locator('[data-pagination-key="historical-cost-summary"]'),
  ).toContainText("目前沒有符合");
  await expect(page.locator("#content")).toHaveScreenshot(
    "historical-cost-empty.png",
  );
});
test("入庫單價輸入、沿用主檔及送出重新驗證，不回寫主檔", async ({ page }) => {
  await page.evaluate(() =>
    window.__demoTest.run((state, domain) => {
      state.otcProducts[0].costPrice = 12.34;
    }),
  );
  await navigate(page, "receipt");
  await page.locator("#barcode").fill("9902000000001");
  await page.locator("#barcode").press("Enter");
  await page.locator('[name="quantity"]').fill("2");
  await page.locator('[name="unitCost"]').fill("1.234");
  await page.locator('#movement-form button[type="submit"]').click();
  expect(
    await page.evaluate(() =>
      window.__demoTest.run((state, domain) => state.movementVouchers.length),
    ),
  ).toBe(0);
  await expect(page.locator('[name="unitCost"]')).toBeFocused();
  expect(
    await page
      .locator('[name="unitCost"]')
      .evaluate((input) => (input as HTMLInputElement).validity.stepMismatch),
  ).toBe(true);
  expect(
    await page
      .locator('[name="unitCost"]')
      .evaluate((input) => (input as HTMLInputElement).validationMessage),
  ).not.toBe("");
  // 原生驗證泡泡的位置由 Chromium 決定；核對驗證後移至備註欄，再比較穩定的表單。
  await page.locator('#movement-form [name="note"]').focus();
  await expect(page.locator('#movement-form [name="note"]')).toBeFocused();
  await expect(page.locator("#movement-form")).toHaveScreenshot(
    "receipt-unit-cost.png",
  );
  await page.locator('[name="unitCost"]').fill("");
  await page.locator('#movement-form button[type="submit"]').click();
  expect(
    await page.evaluate(() =>
      window.__demoTest.run(
        (state, domain) => state.movementVouchers[0].lines[0].unitCost,
      ),
    ),
  ).toBe(12.34);
  await page.evaluate(() =>
    window.__demoTest.run((state, domain) => {
      state.otcProducts[0].costPrice = 99;
      state.movementVouchers[0].lines[0].unitCost = -1;
    }),
  );
  await page.locator('[data-action="submit-voucher"]').click();
  await page.locator('#confirmation button[value="confirm"]').click();
  await expect(page.locator("#voucher-error")).toContainText("入庫單價");
  expect(
    await page.evaluate(() =>
      window.__demoTest.run((state, domain) => state.otcProducts[0].stock),
    ),
  ).toBe(240);
  await expect(page.locator(".voucher-section")).toHaveScreenshot(
    "receipt-invalid-cost.png",
  );
});

test(
  "/demo/historical-cost 直接進入與重新整理",
  { tag: "@critical" },
  async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
    await page.goto("/demo/historical-cost");
    await expect(page.locator("#workspace")).toBeVisible();
    await expect(
      page.locator("#workspace").getByRole("heading").first(),
    ).not.toBeEmpty();
    await expect(page).toHaveURL(
      (url) => url.pathname === "/demo/historical-cost",
    );
    const entryURL = page.url();
    await page.reload();
    await expect(page).toHaveURL(entryURL);
    await expect(page.locator("#workspace").first()).toBeVisible();
  },
);
