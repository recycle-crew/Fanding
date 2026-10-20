import {
  test as base,
  expect,
  enterWorkspace,
  loginEnabled,
} from "../../../helpers/test";
import type { Page } from "@playwright/test";

import XLSX from "../../../helpers/xlsx";
import * as fs from "node:fs";

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await use(errors);
      expect(errors).toEqual([]);
    },
    {
      auto: true,
    },
  ],
});
const queryForms = {
  overview: "overview-movement-filter",
  receipt: "receipt-movement-filter",
  issue: "issue-movement-time-filter",
};
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-15T04:00:00Z"));
  await page.goto("/demo");
  await expect(
    page.locator(loginEnabled ? "#login-form" : "#workspace"),
  ).toBeVisible();
  await enterWorkspace(page);
  await page.addStyleTag({
    content: "#notice {visibility:hidden !important;}",
  });
  // 已入帳的歷史／當日批次 fixture，查詢測試不重做整批送出測試。
  await page.evaluate(() =>
    window.__demoTest.run((state, domain) => {
      for (let index = 0; index < 6; index++)
        state.movements.push({
          id: state.nextMovementId++,
          voucherId: "20261014001",
          workspace: "OTC",
          productId: index % 2 ? "O002" : "O001",
          type: "入庫",
          quantity: 1,
          note: `歷史批次 ${index + 1}`,
          filledBy: "Pharmacy.A",
          time: `2026/10/14 09:0${index}`,
          recordedAt: `2026-10-14T01:0${index}:00Z`,
        });
      for (const [voucherId, productId, type, quantity, note] of [
        ["20261015001", "O001", "耗用", -2, "當日出庫"],
        ["20261015002", "O003", "入庫", 2, "當日入庫"],
        [null, "O004", "領用", -1, "未建立批次"],
      ] as const) {
        state.movements.push({
          id: state.nextMovementId++,
          voucherId,
          workspace: "OTC",
          productId,
          type,
          quantity,
          note,
          filledBy: "Pharmacy.B",
          time: "2026/10/15 09:00",
          recordedAt: "2026-10-15T01:00:00Z",
        });
      }
    }),
  );
});
async function openQuery(page: Page, module: string) {
  if (page.viewportSize().width <= 800)
    await page.locator("#menu-toggle").click();
  await page.locator(`#module-nav [data-module="${module}"]`).click();
}

test("各頁批次條件獨立保存，不改動庫存與傳票", async ({ page }) => {
  await openQuery(page, "receipt");
  await page
    .locator('#receipt-movement-filter [name="voucherId"]')
    .fill("20261014001");
  await page.locator('#receipt-movement-filter button[type="submit"]').click();
  await openQuery(page, "issue");
  await expect(
    page.locator('#issue-movement-time-filter [name="voucherId"]'),
  ).toHaveValue("");
  await page
    .locator('#issue-movement-time-filter [name="voucherId"]')
    .fill("20261015001");
  await page
    .locator('#issue-movement-time-filter button[type="submit"]')
    .click();
  await openQuery(page, "overview");
  await expect(
    page.locator('#overview-movement-filter [name="voucherId"]'),
  ).toHaveValue("");
  await openQuery(page, "receipt");
  await expect(
    page.locator('#receipt-movement-filter [name="voucherId"]'),
  ).toHaveValue("20261014001");
  await expect(page.locator("#receipt-movements-table tbody tr")).toHaveCount(
    6,
  );
  expect(
    await page.evaluate(() =>
      window.__demoTest.run((state, domain) => state.movementVouchers.length),
    ),
  ).toBe(0);
  expect(
    await page.evaluate(() =>
      window.__demoTest.run((state, domain) => state.otcProducts[0].stock),
    ),
  ).toBe(240);
  await expect(page.locator("#receipt-movement-filter")).toHaveScreenshot(
    "batch-independent-state.png",
  );
});
