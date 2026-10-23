import axe from "axe-core";
import { test as base, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

import * as fs from "node:fs/promises";
import * as XLSX from "xlsx";

const test = base.extend<{ runtimeErrors: void }>({
  runtimeErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await use();
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});
const modal = (page: Page) => page.locator(".purchase-modal");
const list = (page: Page) => page.locator(".purchase-main-table");
async function action(page: Page, number: string, name: string) {
  await page
    .getByRole("textbox", { name: "搜尋進貨單", exact: true })
    .fill(number);
  await page
    .getByRole("button", { name: `更多作業 ${number}`, exact: true })
    .click();
  await page.getByRole("menuitem", { name, exact: true }).click();
}
async function finish(page: Page) {
  await modal(page)
    .getByRole("button", { name: "確認送出", exact: true })
    .click();
  await expect(modal(page)).toBeHidden();
}
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
  await page.goto("/purchases");
  await expect(
    page.getByRole("heading", { name: "進貨管理", exact: true }),
  ).toBeVisible();
});

test(
  "進貨查詢、狀態篩選、分頁、排序與 Excel 全分頁",
  { tag: "@critical" },
  async ({ page }) => {
    await expect(list(page).locator("tbody tr:visible")).toHaveCount(5);
    await page.getByRole("button", { name: "下一頁", exact: true }).click();
    await expect(list(page).locator("tbody tr:visible")).toHaveCount(4);
    await page.getByRole("tab", { name: /^待核對/ }).click();
    await expect(list(page).locator("tbody tr:visible")).toHaveCount(3);
    await page.getByRole("tab", { name: /^已結帳/ }).click();
    await expect(list(page).locator("tbody tr:visible")).toHaveCount(5);
    await page.locator("#purchase-filter-returns").selectOption("全部退貨");
    await expect(list(page).locator("tbody tr:visible")).toHaveCount(1);
    await page.getByRole("button", { name: "清除", exact: true }).click();
    await page.getByRole("button", { name: "收貨日期", exact: true }).click();
    await expect(list(page).locator("tbody tr:visible").first()).toContainText(
      "PO20261012001",
    );
    const downloadPromise = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "匯出 Excel (.xlsx)", exact: true })
      .click();
    const download = await downloadPromise;
    const buffer = await fs.readFile(await download.path());
    const workbook = XLSX.read(buffer.toString("base64"), { type: "base64" });
    const rows = XLSX.utils.sheet_to_json<
      Record<string, string | number | boolean>
    >(workbook.Sheets[workbook.SheetNames[0]]);
    expect(rows).toHaveLength(9);
    expect(typeof rows[0]["原始進貨金額"]).toBe("number");
    expect(rows[0]).not.toHaveProperty("操作");
    await page
      .getByRole("textbox", { name: "搜尋進貨單", exact: true })
      .fill("查無這筆單據");
    await expect(list(page)).toContainText("目前沒有符合的資料");
  },
);

test(
  "新增進貨、掃碼與快照、不連動模組一庫存",
  { tag: "@critical" },
  async ({ page }) => {
    await page.getByRole("button", { name: "新增進貨單", exact: true }).click();
    await modal(page)
      .getByRole("button", { name: "確認入庫", exact: true })
      .click();
    await expect(modal(page).getByRole("alert")).toBeVisible();
    await page.locator("#purchase-supplier").selectOption("明康醫藥有限公司");
    await page.locator("#purchase-warehouse").selectOption("主倉庫");
    await page.locator("#purchase-item-search").fill("MED0001");
    await page.locator("#purchase-item-search").press("Enter");
    await page
      .getByRole("textbox", { name: "第1筆批號", exact: true })
      .fill("DEMO-001");
    await page
      .getByRole("textbox", { name: "第1筆批號", exact: true })
      .press("Tab");
    await page.getByLabel("第1筆效期", { exact: true }).fill("2027-10-20");
    await page.getByLabel("第1筆數量", { exact: true }).fill("3");
    await page.getByLabel("第1筆單位成本", { exact: true }).fill("123.4567");
    await modal(page)
      .getByRole("button", { name: "確認入庫", exact: true })
      .click();
    await expect(modal(page)).toContainText("確認本次操作");
    await finish(page);
    await expect(list(page)).toContainText("PO20261020010");
    await expect(list(page)).toContainText("370.37");
    await action(page, "PO20261020010", "查看進貨明細");
    await expect(modal(page)).toContainText("123.4567");
    await expect(modal(page)).toContainText("DEMO-001");
    await modal(page)
      .getByRole("button", { name: "關閉進貨視窗", exact: true })
      .click();
    const mobile = await page.locator("#menu-toggle").isVisible();
    if (mobile) await page.locator("#menu-toggle").click();
    await page
      .getByRole("button", { name: "品項與庫存管理（新版）", exact: true })
      .click();
    await expect(
      page
        .locator(".items-main-table tbody tr")
        .filter({ hasText: "人工淚液" })
        .locator("td")
        .nth(3),
    ).toContainText("35 瓶");
  },
);

test(
  "必填提示在送出前可見，只有倉別與日期時指出缺少供應商",
  { tag: "@critical" },
  async ({ page }) => {
    await page.getByRole("button", { name: "新增進貨單", exact: true }).click();
    await expect(
      modal(page).getByText(
        "必填：供應商、入庫倉別、收貨日期，以及至少一筆進貨商品。",
        { exact: false },
      ),
    ).toBeVisible();
    await expect(
      modal(page).getByRole("heading", {
        name: "進貨商品（必填，至少加入一筆）",
      }),
    ).toBeVisible();
    await expect(
      modal(page).getByText("必填：至少加入一筆進貨商品。", { exact: false }),
    ).toBeVisible();
    await page.locator("#purchase-warehouse").selectOption("展示倉");
    await modal(page)
      .getByRole("button", { name: "確認入庫", exact: true })
      .click();
    const alert = modal(page).getByRole("alert");
    await expect(alert).toContainText("供應商");
    await expect(alert).toBeVisible();
    await expect(alert).toBeFocused();
    await expect(page.locator("#purchase-supplier")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(
      modal(page).getByRole("button", { name: "確認送出", exact: true }),
    ).toHaveCount(0);
    await expect(list(page)).not.toContainText("PO20261020010");
  },
);

test(
  "表頭必填逐項阻擋，商品漏填有提示，補齊後才建立單據",
  { tag: "@critical" },
  async ({ page }) => {
    await page.getByRole("button", { name: "新增進貨單", exact: true }).click();
    const submit = modal(page).getByRole("button", {
      name: "確認入庫",
      exact: true,
    });
    await page.locator("#purchase-supplier").selectOption("明康醫藥有限公司");
    await submit.click();
    await expect(modal(page).getByRole("alert")).toContainText("入庫倉別");
    await expect(modal(page).getByRole("alert")).toBeInViewport({ ratio: 1 });
    await modal(page)
      .locator(".items-modal-scroll")
      .evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });
    await expect(modal(page).getByRole("alert")).toBeInViewport({ ratio: 1 });
    await modal(page).screenshot({
      path: test.info().outputPath("purchase-error.png"),
    });
    await page.locator("#purchase-warehouse").selectOption("主倉庫");
    await page.locator("#purchase-date").fill("");
    await submit.click();
    await expect(modal(page).getByRole("alert")).toContainText("收貨日期");
    await page.locator("#purchase-date").fill("2026-10-20");
    await submit.click();
    await expect(modal(page).getByRole("alert")).toContainText(
      "請至少加入一筆進貨商品",
    );
    await expect(page.locator("#purchase-item-search")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(list(page)).not.toContainText("PO20261020010");
    await page.locator("#purchase-item-search").fill("MED0001");
    await page.locator("#purchase-item-search").press("Enter");
    const row = modal(page).locator(".purchase-lines-table tbody tr").first();
    for (const column of [2, 3, 4, 6]) {
      await expect(row.locator("td").nth(column)).toContainText("必填");
    }
    await submit.click();
    await expect(modal(page).getByRole("alert")).toContainText("第1筆批號");
    await page.getByLabel("第1筆批號", { exact: true }).fill("REQUIRED-001");
    await submit.click();
    await expect(modal(page).getByRole("alert")).toContainText("第1筆效期");
    await page.getByLabel("第1筆效期", { exact: true }).fill("2027-10-20");
    for (const [label, invalid, valid] of [
      ["第1筆數量", "0", "2"],
      ["第1筆單位成本", "-1", "0"],
    ]) {
      await page.getByLabel(label, { exact: true }).fill(invalid);
      await submit.click();
      await expect(modal(page).getByRole("alert")).toContainText(label);
      await expect(
        modal(page).getByRole("button", { name: "確認送出", exact: true }),
      ).toHaveCount(0);
      await expect(list(page)).not.toContainText("PO20261020010");
      await page.getByLabel(label, { exact: true }).fill(valid);
    }
    await expect(page.locator("#purchase-supplier")).toHaveValue(
      "明康醫藥有限公司",
    );
    await expect(page.locator("#purchase-warehouse")).toHaveValue("主倉庫");
    await submit.click();
    await expect(modal(page)).toContainText("確認本次操作");
    await expect(list(page)).not.toContainText("PO20261020010");
    await finish(page);
    await expect(list(page)).toContainText("PO20261020010");
    await action(page, "PO20261020010", "查看進貨明細");
    await expect(modal(page)).toContainText("REQUIRED-001");
  },
);

test("核對差異原因及已結帳入口限制", async ({ page }) => {
  await action(page, "PO20261020009", "核對結帳");
  await page.locator("#settlement-tax").selectOption("應稅");
  await page.locator("#settlement-amount").fill("1900");
  await modal(page)
    .getByRole("button", { name: "核對並結帳", exact: true })
    .click();
  await expect(modal(page).getByRole("alert")).toBeVisible();
  await page.locator("#settlement-difference").fill("發票折扣差異");
  await page.locator("#settlement-invoice").fill("AB12345678");
  await modal(page)
    .getByRole("button", { name: "核對並結帳", exact: true })
    .click();
  await finish(page);
  await expect(list(page).locator("tbody tr:visible")).toContainText("已結帳");
  await expect(list(page)).toContainText("2000.00");
  await page
    .getByRole("button", { name: "更多作業 PO20261020009", exact: true })
    .click();
  await expect(
    page.getByRole("menuitem", { name: "進貨沖銷", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("menuitem", { name: "結帳後更正", exact: true }),
  ).toBeEnabled();
});

test("部分退貨、實體確認、上限與二次確認", async ({ page }) => {
  await action(page, "PO20261019008", "進貨退貨");
  await page.locator("#operation-reason").fill("包裝破損");
  await page.locator("#operation-resolution").selectOption("退款");
  await page.getByRole("checkbox", { name: "選擇散瞳劑", exact: true }).check();
  await page.getByLabel("散瞳劑本次數量", { exact: true }).fill("16");
  await page.locator("#operation-physical").check();
  await modal(page)
    .getByRole("button", { name: "檢查並退貨", exact: true })
    .click();
  await expect(modal(page).getByRole("alert")).toContainText("超過");
  await page.getByLabel("散瞳劑本次數量", { exact: true }).fill("2");
  await modal(page)
    .getByRole("button", { name: "檢查並退貨", exact: true })
    .click();
  await expect(modal(page)).toContainText("確認本次操作");
  await modal(page)
    .getByRole("button", { name: "返回檢查", exact: true })
    .click();
  await expect(page.getByLabel("散瞳劑本次數量", { exact: true })).toHaveValue(
    "2",
  );
  await modal(page)
    .getByRole("button", { name: "檢查並退貨", exact: true })
    .click();
  await finish(page);
  await action(page, "PO20261019008", "查看進貨明細");
  await page.getByRole("tab", { name: "異動及更正歷史", exact: true }).click();
  await expect(modal(page)).toContainText("包裝破損");
  await expect(modal(page)).toContainText("帳務待處理");
  await expect(modal(page)).toContainText("原成本處理金額");
});

test("沖銷與退貨不可重複處理、可追溯量不足阻擋", async ({ page }) => {
  await action(page, "PO20261020009", "進貨沖銷");
  await page.locator("#operation-reason").fill("數量登錄錯誤");
  await page
    .getByRole("checkbox", { name: "選擇人工淚液", exact: true })
    .check();
  await page.getByLabel("人工淚液本次數量", { exact: true }).fill("20");
  await modal(page)
    .getByRole("button", { name: "檢查並沖銷", exact: true })
    .click();
  await finish(page);
  await action(page, "PO20261020009", "進貨退貨");
  await page.locator("#operation-reason").fill("重複處理");
  await page.locator("#operation-resolution").selectOption("待確認");
  await page
    .getByRole("checkbox", { name: "選擇人工淚液", exact: true })
    .check();
  await page.getByLabel("人工淚液本次數量", { exact: true }).fill("1");
  await page.locator("#operation-physical").check();
  await modal(page)
    .getByRole("button", { name: "檢查並退貨", exact: true })
    .click();
  await expect(modal(page).getByRole("alert")).toContainText("超過");
  await modal(page)
    .getByRole("button", { name: "關閉進貨視窗", exact: true })
    .click();
  await modal(page)
    .getByRole("button", { name: "放棄修改", exact: true })
    .click();
  await action(page, "PO20261013002", "進貨退貨");
  await page.locator("#operation-reason").fill("庫存已有耗用");
  await page.locator("#operation-resolution").selectOption("退款");
  await page.getByRole("checkbox", { name: "選擇散瞳劑", exact: true }).check();
  await page.getByLabel("散瞳劑本次數量", { exact: true }).fill("3");
  await page.locator("#operation-physical").check();
  await modal(page)
    .getByRole("button", { name: "檢查並退貨", exact: true })
    .click();
  await expect(modal(page).getByRole("alert")).toContainText(
    "可追溯剩餘量不足",
  );
});

test("純金額更正保留核對金額、帳務結果另存", async ({ page }) => {
  await action(page, "PO20261018007", "結帳後更正");
  await page.locator("#operation-type").selectOption("發票金額更正");
  await page.locator("#operation-reason").fill("核對金額修正");
  await page.locator("#operation-resolution").selectOption("折讓");
  await page.locator("#operation-amount").fill("-50");
  await modal(page)
    .getByRole("button", { name: "檢查並更正", exact: true })
    .click();
  await finish(page);
  await action(page, "PO20261018007", "查看進貨明細");
  await page.getByRole("tab", { name: "核對結帳", exact: true }).click();
  await expect(modal(page)).toContainText("NT$ 9,200.00");
  await expect(modal(page)).toContainText("NT$ 9,050.00");
  await page.getByRole("tab", { name: "異動及更正歷史", exact: true }).click();
  await page.getByRole("button", { name: /完成帳務處理 PC20261020/ }).click();
  await page.locator("#resolution-amount").fill("45");
  await page.locator("#resolution-reference").fill("CN-TEST-001");
  await modal(page)
    .getByRole("button", { name: "確認帳務處理完成", exact: true })
    .click();
  await finish(page);
  await action(page, "PO20261018007", "查看進貨明細");
  await page.getByRole("tab", { name: "異動及更正歷史", exact: true }).click();
  await expect(modal(page)).toContainText("CN-TEST-001");
  await expect(modal(page)).toContainText("NT$ 45.00");
  await expect(modal(page)).toContainText("NT$ -50.00");
});

test("未儲存提醒、鍵盤與版面", async ({ page }, testInfo) => {
  await page.getByRole("button", { name: "新增進貨單", exact: true }).click();
  await expect(
    modal(page).getByRole("heading", { name: "新增進貨單", exact: true }),
  ).toBeFocused();
  await page.locator("#purchase-remark").fill("不儲存");
  await page.keyboard.press("Escape");
  await expect(
    modal(page).getByRole("button", { name: "繼續編輯", exact: true }),
  ).toBeFocused();
  await modal(page)
    .getByRole("button", { name: "繼續編輯", exact: true })
    .click();
  await expect(page.locator("#purchase-remark")).toHaveValue("不儲存");
  await page.screenshot({
    path: testInfo.outputPath("purchases-new.png"),
    animations: "disabled",
  });
  await modal(page)
    .getByRole("button", { name: "關閉進貨視窗", exact: true })
    .click();
  await modal(page)
    .getByRole("button", { name: "放棄修改", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("purchases-list.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("tab", { name: /^全部/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: /^待核對/ })).toBeFocused();
});

test("數量、成本、品項與批號更正均保留原始明細", async ({ page }) => {
  for (const type of ["數量更正", "成本更正", "品項更正", "批號更正"]) {
    await page.goto("/purchases");
    await action(page, "PO20261019008", "結帳後更正");
    await page.locator("#operation-type").selectOption(type);
    await page.locator("#operation-reason").fill(`測試${type}`);
    await page.locator("#operation-resolution").selectOption("待確認");
    await page
      .getByRole("checkbox", { name: "選擇散瞳劑", exact: true })
      .check();
    if (type === "成本更正")
      await page.getByLabel("散瞳劑新單位成本", { exact: true }).fill("150");
    else
      await page
        .getByLabel("散瞳劑本次數量", { exact: true })
        .fill(type === "數量更正" ? "-1" : "1");
    if (type === "品項更正")
      await page.locator("#operation-replacement").selectOption("item-1");
    if (["品項更正", "批號更正"].includes(type)) {
      await page.locator("#operation-batch").fill("CORRECT-BATCH");
      await page.locator("#operation-expiry").fill("2027-10-20");
    }
    await modal(page)
      .getByRole("button", { name: "檢查並更正", exact: true })
      .click();
    await finish(page);
    await action(page, "PO20261019008", "查看進貨明細");
    await expect(modal(page)).toContainText("100.0000");
    await page
      .getByRole("tab", { name: "異動及更正歷史", exact: true })
      .click();
    await expect(modal(page)).toContainText(`測試${type}`);
    if (type === "成本更正")
      await expect(modal(page)).toContainText("150.0000");
    if (["品項更正", "批號更正"].includes(type))
      await expect(modal(page)).toContainText("CORRECT-BATCH");
    await modal(page)
      .getByRole("button", { name: "關閉進貨視窗", exact: true })
      .click();
  }
});

test("a11y 進貨列表、選單及所有主要視窗", async ({ page }) => {
  async function audit() {
    await page.addScriptTag({ content: axe.source });
    const errors = await page.evaluate(async () => {
      const result = await window.axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
        },
      });
      return result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      }));
    });
    expect(errors).toEqual([]);
  }
  await audit();
  await page.getByRole("button", { name: "新增進貨單", exact: true }).click();
  await audit();
  await modal(page)
    .getByRole("button", { name: "關閉進貨視窗", exact: true })
    .click();
  for (const name of ["查看進貨明細", "核對結帳", "進貨沖銷", "進貨退貨"]) {
    await action(page, "PO20261020009", name);
    await audit();
    await modal(page)
      .getByRole("button", { name: "關閉進貨視窗", exact: true })
      .click();
  }
  await action(page, "PO20261018007", "結帳後更正");
  await audit();
});

test(
  "/purchases 直接進入與重新整理",
  { tag: "@critical" },
  async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
    await page.goto("/purchases");
    await expect(page.locator("#workspace")).toBeVisible();
    await expect(
      page.locator("#workspace").getByRole("heading").first(),
    ).not.toBeEmpty();
    await expect(page).toHaveURL((url) => url.pathname === "/purchases");
    const entryURL = page.url();
    await page.reload();
    await expect(page).toHaveURL(entryURL);
    await expect(page.locator("#workspace").first()).toBeVisible();
  },
);
