import type { Page, Locator } from "@playwright/test";
import {
  test,
  expect,
  enterWorkspace,
  loginEnabled,
} from "../../../helpers/test";
import XLSX from "../../../helpers/xlsx";
import * as fs from "node:fs";

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
});
async function openVoucherPage(page: Page, direction: string) {
  if (page.viewportSize().width <= 800)
    await page.locator("#menu-toggle").click();
  await page.locator(`#module-nav [data-module="${direction}"]`).click();
}
async function addVoucherLine(page: Page, barcode: string, quantity: number,  note = "測試傳票") {
  await page.locator("#barcode").fill(barcode);
  await page.locator("#barcode").press("Enter");
  await page.locator('#movement-form [name="quantity"]').fill(String(quantity));
  await page.locator('#movement-form [name="note"]').fill(note);
  await page.locator('#movement-form button[type="submit"]').click();
}
for (const direction of ["receipt", "issue"]) {
  test(`${direction}: 多筆明細整批送出、取消確認、鎖定及不重複異動`, async ({
    page,
  }) => {
    await openVoucherPage(page, direction);
    await page.locator('[data-action="create-voucher"]').click();
    await expect(page.locator("#movement-voucher")).toHaveValue("20261015001");
    await expect(page.locator('[data-action="submit-voucher"]')).toBeDisabled();
    await addVoucherLine(page, "9902000000001", 3);
    await addVoucherLine(page, "9902000000002", 2);
    expect(
      await page.evaluate(() =>
        window.__demoTest.run((state, domain) =>
          state.otcProducts.slice(0, 2).map((product) => product.stock),
        ),
      ),
    ).toEqual([240, 80]);
    expect(
      await page.evaluate(() =>
        window.__demoTest.run((state, domain) => state.movements.length),
      ),
    ).toBe(2);
    await expect(page.locator(".voucher-section")).toHaveScreenshot(
      `${direction}-voucher-draft.png`,
    );
    await page.locator('[data-action="submit-voucher"]').click();
    await expect(page.locator("#confirmation")).toHaveScreenshot(
      `${direction}-voucher-confirm.png`,
    );
    await page.locator('#confirmation button[value="cancel"]').click();
    expect(
      await page.evaluate(() =>
        window.__demoTest.run((state, domain) => state.movements.length),
      ),
    ).toBe(2);
    await page.locator('[data-action="submit-voucher"]').click();
    await page.locator('#confirmation button[value="confirm"]').click();
    await expect(page.locator(".voucher-section")).toContainText(
      "已送出・鎖定",
    );
    expect(
      await page.evaluate(() =>
        window.__demoTest.run((state, domain) =>
          state.otcProducts.slice(0, 2).map((product) => product.stock),
        ),
      ),
    ).toEqual(direction === "receipt" ? [243, 82] : [237, 78]);
    expect(
      await page.evaluate(() =>
        window.__demoTest.run((state, domain) =>
          state.movements.slice(2).map((movement) => movement.voucherId),
        ),
      ),
    ).toEqual(["20261015001", "20261015001"]);
    await expect(page.locator("[data-remove-voucher-line]")).toHaveCount(0);
    await page.locator("#barcode").fill("9902000000001");
    await page.locator("#barcode").press("Enter");
    await expect(page.locator("#movement-form")).toHaveCount(0);
    await expect(page.locator(".voucher-section")).toHaveScreenshot(
      `${direction}-voucher-locked.png`,
    );
    expect(
      await page.evaluate(() =>
        window.__demoTest.run((state, domain) => {
          try {
            domain.submitMovementVoucher(state, state.movementVouchers[0]);
            return false;
          } catch {
            return state.movements.length === 4;
          }
        }),
      ),
    ).toBe(true);
  });
}
test("傳票每日共用流水號、取消不回收、跨日編號固定及重新查閱", async ({
  page,
}) => {
  await openVoucherPage(page, "receipt");
  await page.locator('[data-action="create-voucher"]').click();
  await page.locator('[data-action="cancel-voucher"]').click();
  await page.locator('#confirmation button[value="confirm"]').click();
  await expect(page.locator(".voucher-section")).toContainText("已取消・鎖定");
  await openVoucherPage(page, "issue");
  await page.locator('[data-action="create-voucher"]').click();
  await expect(page.locator("#movement-voucher")).toHaveValue("20261015002");
  await page.clock.setFixedTime(new Date("2026-10-15T16:01:00Z"));
  await addVoucherLine(page, "9902000000001", 1);
  await page.locator('[data-action="submit-voucher"]').click();
  await page.locator('#confirmation button[value="confirm"]').click();
  await expect(page.locator("#movement-voucher")).toHaveValue("20261015002");
  await page.locator('[data-action="create-voucher"]').click();
  await expect(page.locator("#movement-voucher")).toHaveValue("20261016001");
  await page.locator("#movement-voucher").selectOption("20261015002");
  await expect(page.locator(".voucher-section")).toContainText("已送出・鎖定");
  await expect(page.locator(".voucher-section")).toHaveScreenshot(
    "voucher-midnight-history.png",
  );
});
test("三碼流水號 999 上限提示，不建立四碼或重複編號", async ({ page }) => {
  await openVoucherPage(page, "receipt");
  await page.evaluate(() =>
    window.__demoTest.run((state, domain) => {
      for (let index = 0; index < 998; index++) {
        const voucher = domain.createMovementVoucher(state, "receipt");
        voucher.cancelledAt = voucher.createdAt;
      }
      state.selectedMovementVoucherIds.receipt = null;
      undefined;
    }),
  );
  await page.locator('[data-action="create-voucher"]').click();
  await expect(page.locator("#movement-voucher")).toHaveValue("20261015999");
  await page.locator('[data-action="cancel-voucher"]').click();
  await page.locator('#confirmation button[value="confirm"]').click();
  await page.locator('[data-action="create-voucher"]').click();
  await expect(page.locator("#voucher-error")).toContainText("999");
  expect(
    await page.evaluate(() =>
      window.__demoTest.run((state, domain) => state.movementVouchers.length),
    ),
  ).toBe(999);
  await expect(page.locator(".voucher-section")).toHaveScreenshot(
    "voucher-sequence-exhausted.png",
  );
});
test("出庫送出時重新核對庫存，任何不足皆整批不異動", async ({ page }) => {
  await openVoucherPage(page, "issue");
  await addVoucherLine(page, "9902000000001", 3);
  await addVoucherLine(page, "9902000000002", 2);
  await page.evaluate(() =>
    window.__demoTest.run((state, domain) => {
      state.otcProducts[1].stock = 1;
    }),
  );
  await page.locator('[data-action="submit-voucher"]').click();
  await page.locator('#confirmation button[value="confirm"]').click();
  await expect(page.locator("#voucher-error")).toContainText("O002 庫存不足");
  expect(
    await page.evaluate(() =>
      window.__demoTest.run((state, domain) => state.otcProducts[0].stock),
    ),
  ).toBe(240);
  expect(
    await page.evaluate(() =>
      window.__demoTest.run((state, domain) => state.movements.length),
    ),
  ).toBe(2);
  await expect(page.locator(".voucher-section")).toHaveScreenshot(
    "voucher-atomic-failure.png",
  );
  await page.locator('[data-remove-voucher-line="1"]').click();
  await page.locator('[data-action="submit-voucher"]').click();
  await page.locator('#confirmation button[value="confirm"]').click();
  await expect(page.locator(".voucher-section")).toContainText("已送出");
  expect(
    await page.evaluate(() =>
      window.__demoTest.run((state, domain) => state.otcProducts[0].stock),
    ),
  ).toBe(237);
});
test("重複料號累計數量、移除與取消草稿不異動庫存", async ({ page }) => {
  await openVoucherPage(page, "issue");
  await addVoucherLine(page, "9902000000001", 200);
  await addVoucherLine(page, "9902000000001", 41);
  await expect(page.locator("#movement-error")).toContainText("本傳票已填 200");
  await expect(page.locator("#content > .panel").first()).toHaveScreenshot(
    "voucher-duplicate-quantity.png",
  );
  await page.locator('[data-action="cancel-scan"]').click();
  await page.locator('[data-remove-voucher-line="0"]').click();
  await expect(page.locator('[data-action="submit-voucher"]')).toBeDisabled();
  await page.locator('[data-action="cancel-voucher"]').click();
  await page.locator('#confirmation button[value="confirm"]').click();
  expect(
    await page.evaluate(() =>
      window.__demoTest.run((state, domain) => state.otcProducts[0].stock),
    ),
  ).toBe(240);
  expect(
    await page.evaluate(() =>
      window.__demoTest.run((state, domain) => state.movements.length),
    ),
  ).toBe(2);
});
test("送出重新驗證停用品項與明細數量", async ({ page }) => {
  await openVoucherPage(page, "receipt");
  await addVoucherLine(page, "9902000000001", 1);
  await page.evaluate(() =>
    window.__demoTest.run((state, domain) => {
      state.otcProducts[0].status = "停用";
    }),
  );
  await page.locator('[data-action="submit-voucher"]').click();
  await page.locator('#confirmation button[value="confirm"]').click();
  await expect(page.locator("#voucher-error")).toContainText("未啟用");
  await page.evaluate(() =>
    window.__demoTest.run((state, domain) => {
      state.otcProducts[0].status = "啟用";
      state.movementVouchers[0].lines[0].quantity = 0;
    }),
  );
  await page.locator('[data-action="submit-voucher"]').click();
  await page.locator('#confirmation button[value="confirm"]').click();
  await expect(page.locator("#voucher-error")).toContainText("整數");
  expect(
    await page.evaluate(() =>
      window.__demoTest.run((state, domain) => state.otcProducts[0].stock),
    ),
  ).toBe(240);
  await expect(page.locator(".voucher-section")).toHaveScreenshot(
    "voucher-invalid-line.png",
  );
});
test("傳票明細分頁與 XLSX 匯出所有明細，異動匯出保留傳票編號", async ({
  page,
}) => {
  
  
  await openVoucherPage(page, "receipt");
  for (let index = 0; index < 6; index++)
    await addVoucherLine(page, "9902000000001", 1, `傳票明細 ${index + 1}`);
  await expect(page.locator(".voucher-section [data-page-next]")).toBeEnabled();
  await page.locator(".voucher-section [data-page-next]").click();
  await expect(page.locator(".voucher-section tbody tr:visible")).toHaveCount(
    1,
  );
  await expect(page.locator(".voucher-section")).toHaveScreenshot(
    "voucher-second-page.png",
  );
  const [detailDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.locator(".voucher-section [data-export-excel]").click(),
  ]);
  const details = XLSX.read(fs.readFileSync(await detailDownload.path()), {
    type: "buffer",
  });
  const detailRows = XLSX.utils.sheet_to_json(
    details.Sheets[details.SheetNames[0]],
    {
      header: 1,
    },
  );
  expect(detailRows).toHaveLength(7);
  expect(detailRows[6]).toContain("傳票明細 6");
  expect(detailRows[0]).not.toContain("操作");
  await page.locator('[data-action="submit-voucher"]').click();
  await page.locator('#confirmation button[value="confirm"]').click();
  const [movementDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#receipt-movements-table [data-export-excel]").click(),
  ]);
  const movementsWorkbook = XLSX.read(
    fs.readFileSync(await movementDownload.path()),
    {
      type: "buffer",
    },
  );
  const rows = XLSX.utils.sheet_to_json(
    movementsWorkbook.Sheets[movementsWorkbook.SheetNames[0]],
    {
      header: 1,
    },
  );
  const voucherColumn = rows[0].indexOf("傳票編號");
  expect(voucherColumn).toBeGreaterThanOrEqual(0);
  expect(
    rows.slice(1).filter((row) => row[voucherColumn] === "20261015001"),
  ).toHaveLength(6);
});
