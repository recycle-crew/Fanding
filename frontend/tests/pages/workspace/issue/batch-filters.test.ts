import { test as base, expect } from "@playwright/test";
import { WORKSPACE_LOGIN_ENABLED as loginEnabled } from "../../../../src/constants/workspaceAccess";
import type { Page } from "@playwright/test";

import * as XLSX from "xlsx";
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
  await page.goto("/");
  await expect(
    page.locator(loginEnabled ? "#login-form" : "#workspace"),
  ).toBeVisible();
  await expect(page.locator("#workspace")).toBeVisible();
  await page.addStyleTag({
    content: "#notice {visibility:hidden !important;}",
  });
  // 已入帳的歷史／當日批次 fixture，查詢測試不重做整批送出測試。
  await page.evaluate(() =>
    window.__workspaceTest.run((state, domain) => {
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
for (const module of ["issue"] as Array<keyof typeof queryForms>) {
  test(`${module}: 批次查詢全部料號、跨日、分頁與 XLSX`, async ({ page }) => {
    await openQuery(page, module);
    const form = page.locator(`#${queryForms[module]}`),
      table = page.locator(`#${module}-movements-table`);
    await expect(form.locator("input").first()).toHaveAttribute(
      "name",
      "voucherId",
    );
    const suggestions = await form
      .locator('datalist[id$="-batches"] option')
      .evaluateAll((options) =>
        options.map((option) => (option as HTMLOptionElement).value),
      );
    expect(suggestions).toEqual(["20261015002", "20261015001", "20261014001"]);
    await form.locator('[name="voucherId"]').fill(" 20261014001 ");
    if (module === "overview")
      await expect(form.locator('[name="date"]')).toHaveValue("");
    await form.locator('button[type="submit"]').click();
    await expect(table.locator("tbody tr")).toHaveCount(6);
    await expect(table.locator("tbody tr:visible")).toHaveCount(5);
    await expect(table.locator("tbody")).toContainText("醫用口罩");
    await expect(table.locator("tbody")).toContainText("酒精棉片");
    await expect(table.locator("tbody")).not.toContainText("當日出庫");
    await table.locator("[data-page-next]").click();
    await expect(table.locator("tbody tr:visible")).toHaveCount(1);
    await expect(form.locator("..")).toHaveScreenshot(
      `${module}-batch-query.png`,
    );
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      table.locator("[data-export-excel]").click(),
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
    const batchColumn = rows[0].indexOf("傳票編號");
    expect(rows).toHaveLength(7);
    expect(
      rows.slice(1).every((row) => row[batchColumn] === "20261014001"),
    ).toBe(true);
  });
  test(`${module}: 批次與料號人員日期交集、清除、前綴及找不到`, async ({
    page,
  }) => {
    await openQuery(page, module);
    const form = page.locator(`#${queryForms[module]}`),
      table = page.locator(`#${module}-movements-table`);
    await form.locator('[name="voucherId"]').fill("20261014001");
    await form.locator('[name="materialNumber"]').fill(" o002 ");
    await form.locator('[name="person"]').fill(" pharmacy.a ");
    if (module === "overview")
      await form.locator('[name="date"]').fill("2026-10-14");
    else {
      await form.locator('[name="start"]').fill("2026-10-14T08:59");
      await form.locator('[name="end"]').fill("2026-10-14T09:05");
    }
    await form.locator('button[type="submit"]').click();
    await expect(table.locator("tbody tr")).toHaveCount(3);
    await form.locator('[name="person"]').fill("不存在的人員");
    await form.locator('button[type="submit"]').click();
    await expect(table.locator("td.empty")).toContainText("沒有符合");
    await expect(form.locator("..")).toHaveScreenshot(
      `${module}-batch-intersection-empty.png`,
    );
    await form.locator('button[type="button"]').last().click();
    await expect(form.locator('[name="voucherId"]')).toHaveValue("");
    await expect(form.locator('[name="person"]')).toHaveValue("");
    if (module === "overview") {
      await expect(form.locator('[name="date"]')).toHaveValue("2026-10-15");
      await expect(table.locator("tbody tr")).toHaveCount(3);
    } else await expect(table.locator("tbody tr")).toHaveCount(11);
    await form.locator('[name="voucherId"]').fill("20261015");
    await form.locator('button[type="submit"]').click();
    await expect(table.locator("tbody tr")).toHaveCount(2);
    await expect(table.locator("tbody")).not.toContainText("未建立批次");
    if (module === "issue") {
      await page.locator('[data-movement-view="outbound"]').click();
      await expect(table.locator("tbody tr")).toHaveCount(1);
      await expect(table.locator("tbody")).toContainText("當日出庫");
      await page.locator('[data-movement-view="inbound"]').click();
      await expect(table.locator("tbody tr")).toHaveCount(1);
      await expect(table.locator("tbody")).toContainText("當日入庫");
      await page.locator('[data-movement-view="all"]').click();
    }
    await form.locator('[name="voucherId"]').fill("20260101999");
    await form.locator('button[type="submit"]').click();
    await expect(table.locator("td.empty")).toContainText("沒有符合");
    await expect(form.locator("..")).toHaveScreenshot(
      `${module}-batch-not-found.png`,
    );
  });
}
