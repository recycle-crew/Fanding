import type { Page, Locator } from "@playwright/test";
import { test, expect } from "../../../helpers/test";
import { checkPageEntry } from "../../../helpers/test";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const axe = require.resolve("axe-core/axe.min.js");
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
  await page.goto("/demo/pos");
  await expect(
    page.getByRole("heading", { name: "POS 銷售收銀", exact: true }),
  ).toBeVisible();
});
async function scan(page: Page, code: string) {
  const input = page.getByRole("textbox", {
    name: "掃碼／搜尋商品",
    exact: true,
  });
  await input.fill(code);
  await input.press("Enter");
}
async function checkout(page: Page,  { medicine = false } = {}) {
  await page.getByRole("button", { name: "前往結帳", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("實收金額", { exact: true }).fill("10000");
  await dialog
    .getByRole("checkbox", {
      name: "已確認銷售主體具備該品項及單據資格（展示）",
      exact: true,
    })
    .check();
  if (medicine)
    await dialog
      .getByRole("checkbox", {
        name: "已由專業人員確認藥品銷售（展示）",
        exact: true,
      })
      .check();
  await dialog
    .getByRole("button", { name: "確認完成結帳", exact: true })
    .click();
  await expect(
    dialog.getByRole("heading", { name: "銷售明細與交易憑證", exact: true }),
  ).toBeVisible();
  return dialog;
}
test("@critical 掃碼合併、禁止品項、無庫存、搜尋與清空", async ({ page }) => {
  await scan(page, "OTC0001");
  await scan(page, "OTC0001");
  await expect(page.getByLabel("葉黃素膠囊數量", { exact: true })).toHaveValue(
    "2",
  );
  await expect(
    page.getByRole("textbox", { name: "掃碼／搜尋商品", exact: true }),
  ).toBeFocused();
  await scan(page, "MED0003");
  await expect(
    page.getByRole("status").filter({ hasText: "未開放 POS" }),
  ).toBeVisible();
  await scan(page, "MED0005");
  await expect(
    page.getByRole("status").filter({ hasText: "無可用庫存" }),
  ).toBeVisible();
  await scan(page, "no-result");
  await scan(page, "OTC0003");
  await expect(
    page.getByRole("status").filter({ hasText: "批次已過期" }),
  ).toBeVisible();
  await scan(page, "no-result");
  await expect(page.getByText("查無符合商品。", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "清空", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "確認清空", exact: true })
    .click();
  await expect(page.getByText("購物車（0 項）", { exact: true })).toBeVisible();
});
test("@critical 折扣、多批次結帳、歷史與部分退貨待退款／確認退款", async ({
  page,
}) => {
  await page.getByLabel("展示角色", { exact: true }).selectOption("manager");
  await scan(page, "OTC0001");
  await page.getByLabel("葉黃素膠囊數量", { exact: true }).fill("4");
  await page.getByLabel("葉黃素膠囊單品折扣", { exact: true }).fill("10");
  await page.getByLabel("整單折扣金額", { exact: true }).fill("3.01");
  const dialog = await checkout(page);
  await expect(dialog).toContainText("整單分攤 $3.01");
  await expect(dialog).toContainText("A081-B");
  await dialog.getByRole("button", { name: "銷售退貨", exact: true }).click();
  await dialog.getByLabel("葉黃素膠囊本次退貨數量", { exact: true }).fill("5");
  await dialog.getByLabel("退貨原因", { exact: true }).fill("客戶退回");
  await dialog
    .getByRole("checkbox", {
      name: "已收到實體退貨，確認不可售且不增加可用庫存（展示）",
      exact: true,
    })
    .check();
  await dialog
    .getByRole("button", { name: "建立退貨與待退款紀錄", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await dialog.getByLabel("葉黃素膠囊本次退貨數量", { exact: true }).fill("1");
  await dialog
    .getByRole("button", { name: "建立退貨與待退款紀錄", exact: true })
    .click();
  await expect(dialog).toContainText("部分退貨");
  await expect(dialog).toContainText("尚未實際退款");
  await dialog.getByRole("button", { name: /^確認退款 REF-/ }).click();
  await dialog
    .getByRole("button", { name: "確認退款完成", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText("確認實際退款");
  await dialog
    .getByRole("checkbox", {
      name: "已由財務確認實際退款成功（展示）",
      exact: true,
    })
    .check();
  await dialog
    .getByRole("button", { name: "確認退款完成", exact: true })
    .click();
  await expect(dialog).toContainText("已退款");
  await expect(
    dialog.getByRole("button", { name: /^確認退款 REF-/ }),
  ).toHaveCount(0);
});
test("@critical 付款確認、藥品專業確認與安全重試", async ({ page }) => {
  await scan(page, "MED0001");
  await page.getByRole("button", { name: "前往結帳", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("實收金額", { exact: true }).fill("0");
  await dialog
    .getByRole("button", { name: "確認完成結帳", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await dialog.getByLabel("付款方式", { exact: true }).selectOption("信用卡");
  await dialog
    .getByRole("checkbox", {
      name: "已確認銷售主體具備該品項及單據資格（展示）",
      exact: true,
    })
    .check();
  await dialog
    .getByRole("button", { name: "確認完成結帳", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText("外部付款");
  await dialog
    .getByRole("checkbox", { name: "已確認外部付款成功（展示）", exact: true })
    .check();
  await dialog
    .getByRole("button", { name: "確認完成結帳", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText("專業人員確認");
  await dialog
    .getByRole("checkbox", {
      name: "已由專業人員確認藥品銷售（展示）",
      exact: true,
    })
    .check();
  await dialog.getByText("展示失敗與安全重試", { exact: true }).click();
  await dialog
    .getByRole("checkbox", {
      name: "模擬外部已收款、本地提交失敗一次",
      exact: true,
    })
    .check();
  await dialog
    .getByRole("button", { name: "確認完成結帳", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText("勿重刷或重收");
  await dialog
    .getByRole("button", { name: "以相同交易識別碼重試", exact: true })
    .click();
  await expect(dialog).toContainText("信用卡");
  await expect(
    dialog.getByRole("heading", { name: "銷售明細與交易憑證", exact: true }),
  ).toBeVisible();
});
test("@critical 作廢與退款分離、紀錄篩選匯出", async ({ page }) => {
  await page.getByLabel("展示角色", { exact: true }).selectOption("manager");
  await scan(page, "OTC0001");
  const dialog = await checkout(page);
  await dialog.getByRole("button", { name: "作廢交易", exact: true }).click();
  await dialog.getByLabel("作廢原因", { exact: true }).fill("重複輸入");
  await dialog
    .getByRole("button", { name: "確認作廢並建立待退款", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText("未交付確認");
  await dialog
    .getByRole("checkbox", {
      name: "確認商品未交付，符合錯誤交易作廢條件（展示）",
      exact: true,
    })
    .check();
  await dialog
    .getByRole("button", { name: "確認作廢並建立待退款", exact: true })
    .click();
  await expect(dialog).toContainText("待退款");
  await expect(
    dialog.getByRole("button", { name: "作廢交易", exact: true }),
  ).toBeDisabled();
  await dialog.getByRole("button", { name: "關閉", exact: true }).click();
  await page.getByRole("button", { name: "銷售紀錄", exact: true }).click();
  await page.getByLabel("銷售狀態", { exact: true }).selectOption("作廢");
  await expect(page.locator("tbody tr:visible")).toHaveCount(2);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /匯出 Excel/ }).click();
  expect((await download).suggestedFilename()).toMatch(/\.xlsx$/);
});
test("無障礙、取消保留購物車與桌面／手機畫面", async ({ page }, testInfo) => {
  async function audit() {
    await page.addScriptTag({ path: axe });
    expect(
      await page.evaluate(
        async () =>
          (
            await window.axe.run(
              document.querySelector('[role="dialog"]') ||
                document.querySelector(".pos-page"),
              {
                runOnly: {
                  type: "tag",
                  values: ["wcag2a", "wcag2aa", "wcag21aa"],
                },
              },
            )
          ).violations,
      ),
    ).toEqual([]);
  }
  await audit();
  await page.screenshot({ path: testInfo.outputPath("pos-list.png") });
  await scan(page, "OTC0001");
  await page.getByRole("button", { name: "前往結帳", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await audit();
  await expect(
    dialog.getByRole("button", { name: "確認完成結帳", exact: true }),
  ).toBeInViewport();
  await dialog.getByLabel("銷售備註", { exact: true }).fill("尚未儲存");
  await dialog.getByRole("button", { name: "取消", exact: true }).click();
  await expect(dialog).toContainText("尚有未儲存變更");
  await dialog.getByRole("button", { name: "繼續編輯", exact: true }).click();
  await expect(dialog.getByLabel("銷售備註", { exact: true })).toHaveValue(
    "尚未儲存",
  );
  await page.keyboard.press("Escape");
  await dialog.getByRole("button", { name: "放棄變更", exact: true }).click();
  await expect(page.getByText("購物車（1 項）", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBeTruthy();
});


test(
  "/demo/pos 直接進入與重新整理",
  { tag: "@critical" },
  async ({ page }, info) => {
    await checkPageEntry(page, "/demo/pos", info);
  },
);
