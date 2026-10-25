import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import fs from "node:fs/promises";
import * as XLSX from "xlsx";
import axe from "axe-core";

async function salesAction(page: Page, number: string, action: string) {
  await page
    .getByRole("button", { name: `銷售作業 ${number}`, exact: true })
    .click();
  await page.getByRole("menuitem", { name: action, exact: true }).click();
}

test("@critical 列表部分退貨、可售回庫、確認退款與剩餘全退", async ({
  page,
}, testInfo) => {
  await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
  await page.goto("/sales");
  await page.getByLabel("展示角色", { exact: true }).selectOption("manager");
  const number = "SO20261020-0001";
  await salesAction(page, number, "銷售退貨");
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "銷售退貨", exact: true }),
  ).toBeVisible();
  const quantity = dialog.getByLabel("葉黃素膠囊本次退貨數量", { exact: true });
  await quantity.fill("3");
  await dialog
    .getByLabel("退貨原因", { exact: true })
    .fill("顧客退回未使用商品");
  await dialog
    .getByRole("button", { name: "建立退貨與待退款紀錄", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await quantity.fill("1");
  await dialog
    .getByLabel("商品處理方式", { exact: true })
    .selectOption("可售回庫");
  await dialog
    .getByRole("button", { name: "建立退貨與待退款紀錄", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText("實體退貨");
  await dialog
    .getByRole("checkbox", {
      name: "已收到退貨，確認商品狀態可售並回庫（展示）",
      exact: true,
    })
    .check();
  await expect(dialog.getByText(/原出庫批次/)).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("sales-return.png") });
  await dialog
    .getByRole("button", { name: "建立退貨與待退款紀錄", exact: true })
    .click();
  await expect(dialog).toContainText("部分退貨");
  await expect(dialog).toContainText("待退款 $340");
  await dialog.getByRole("button", { name: "關閉", exact: true }).click();
  await salesAction(page, number, "確認退款");
  await dialog
    .getByRole("checkbox", {
      name: "已由財務確認實際退款成功（展示）",
      exact: true,
    })
    .check();
  await dialog
    .getByRole("button", { name: "確認退款完成", exact: true })
    .click();
  await expect(dialog).toContainText("已實際退款 $340");
  await dialog.getByRole("button", { name: "關閉", exact: true }).click();
  await salesAction(page, number, "銷售退貨");
  await dialog
    .getByRole("button", { name: "全部可退數量", exact: true })
    .click();
  await expect(quantity).toHaveValue("1");
  await dialog.getByLabel("退貨原因", { exact: true }).fill("退回剩餘商品");
  await dialog
    .getByRole("checkbox", {
      name: "已收到實體退貨，確認不可售且不增加可用庫存（展示）",
      exact: true,
    })
    .check();
  await dialog
    .getByRole("button", { name: "建立退貨與待退款紀錄", exact: true })
    .click();
  await expect(dialog).toContainText("全部退貨");
  await dialog.getByRole("button", { name: "關閉", exact: true }).click();
  await page
    .getByRole("button", { name: `銷售作業 ${number}`, exact: true })
    .click();
  await expect(
    page.getByRole("menuitem", { name: /^銷售退貨/ }),
  ).toHaveAttribute("aria-disabled", "true");
  await expect(
    page.getByRole("menuitem", { name: /^作廢交易/ }),
  ).toHaveAttribute("aria-disabled", "true");
});

test("@critical 列表作廢、取消保留交易與待退款處理", async ({
  page,
}, testInfo) => {
  await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
  await page.goto("/sales");
  await page.getByLabel("展示角色", { exact: true }).selectOption("manager");
  const number = "SO20261020-0005";
  const row = page.locator("tbody tr:visible").filter({ hasText: number });
  const dialog = page.getByRole("dialog");
  await salesAction(page, number, "作廢交易");
  await dialog
    .getByLabel("作廢原因", { exact: true })
    .fill("尚未送出的作廢原因");
  await dialog.getByRole("button", { name: "取消", exact: true }).click();
  await dialog.getByRole("button", { name: "繼續編輯", exact: true }).click();
  await expect(dialog.getByLabel("作廢原因", { exact: true })).toHaveValue(
    "尚未送出的作廢原因",
  );
  await dialog.getByRole("button", { name: "取消", exact: true }).click();
  await dialog.getByRole("button", { name: "放棄變更", exact: true }).click();
  await expect(row).toContainText("完成");
  await salesAction(page, number, "作廢交易");
  await dialog
    .getByLabel("作廢原因", { exact: true })
    .fill("重複結帳，商品未交付");
  await dialog
    .getByRole("button", { name: "確認作廢並建立待退款", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText("未交付");
  await dialog
    .getByRole("checkbox", {
      name: "確認商品未交付，符合錯誤交易作廢條件（展示）",
      exact: true,
    })
    .check();
  await page.screenshot({ path: testInfo.outputPath("sales-void.png") });
  await dialog
    .getByRole("button", { name: "確認作廢並建立待退款", exact: true })
    .click();
  await expect(dialog).toContainText("作廢紀錄");
  await dialog.getByRole("button", { name: "關閉", exact: true }).click();
  await expect(row).toContainText("作廢");
  await expect(row).toContainText("待退 $680");
  await page
    .getByRole("button", { name: `銷售作業 ${number}`, exact: true })
    .click();
  await expect(
    page.getByRole("menuitem", { name: /^銷售退貨/ }),
  ).toHaveAttribute("aria-disabled", "true");
  await expect(
    page.getByRole("menuitem", { name: /^作廢交易/ }),
  ).toHaveAttribute("aria-disabled", "true");
  await page.getByRole("menuitem", { name: "確認退款", exact: true }).click();
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
  await dialog.getByRole("button", { name: "關閉", exact: true }).click();
  await expect(row).toContainText("已退款");
});

test("@critical 退貨作廢權限與非現金退款參考號碼", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
  await page.goto("/sales");
  await page
    .getByRole("button", { name: "銷售作業 SO20261020-0001", exact: true })
    .click();
  await expect(
    page.getByRole("menuitem", { name: /^銷售退貨/ }),
  ).toHaveAttribute("aria-disabled", "true");
  await expect(
    page.getByRole("menuitem", { name: /^作廢交易/ }),
  ).toHaveAttribute("aria-disabled", "true");
  await page.keyboard.press("Escape");
  await page.getByLabel("展示角色", { exact: true }).selectOption("manager");
  await salesAction(page, "SO20261020-0004", "確認退款");
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "確認退款完成", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText("退款參考號碼");
  await dialog
    .getByLabel("退款參考號碼", { exact: true })
    .fill("REF-20261020-04");
  await dialog
    .getByRole("checkbox", {
      name: "已由財務確認實際退款成功（展示）",
      exact: true,
    })
    .check();
  await dialog
    .getByRole("button", { name: "確認退款完成", exact: true })
    .click();
  await expect(dialog).toContainText("REF-20261020-04");
  await expect(
    dialog.getByRole("button", { name: /^確認退款 REF-/ }),
  ).toHaveCount(0);
});

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

test("@critical 共用列表排序、分頁、進階篩選與明細", async ({
  page,
}, testInfo) => {
  await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
  await page.goto("/sales?embed=1");
  const list = page.getByRole("region", {
    name: "銷售紀錄列表，可左右捲動",
    exact: true,
  });
  await expect(list.locator("tbody tr:visible")).toHaveCount(5);
  await page.getByRole("button", { name: "下一頁", exact: true }).click();
  await expect(list.locator("tbody tr:visible")).toHaveCount(3);
  if (testInfo.project.name === "mobile") {
    await page
      .getByLabel("日期／金額排序", { exact: true })
      .selectOption("oldest");
  } else {
    await page.getByRole("button", { name: "銷售日期", exact: true }).click();
    await expect(
      list.getByRole("columnheader", { name: "銷售日期", exact: true }),
    ).toHaveAttribute("aria-sort", "ascending");
  }
  await expect(list.locator("tbody tr:visible")).toHaveCount(5);
  await expect(list.locator("tbody tr:visible").first()).toContainText(
    "SO20261020-0008",
  );
  if (testInfo.project.name === "mobile") {
    await page
      .getByLabel("日期／金額排序", { exact: true })
      .selectOption("amount-high");
  } else {
    await page
      .getByRole("button", { name: "原始成交金額", exact: true })
      .click();
    await expect(
      list.getByRole("columnheader", { name: "原始成交金額", exact: true }),
    ).toHaveAttribute("aria-sort", "descending");
  }
  await page
    .getByRole("button", { name: "待退款（目前日期區間）", exact: true })
    .click();
  await expect(list.locator("tbody tr:visible")).toHaveCount(2);
  await expect(page.locator(".sales-summary")).toContainText("待退款 2 筆");
  await page.getByText("更多篩選", { exact: true }).click();
  await page.getByLabel("付款方式", { exact: true }).selectOption("信用卡");
  await page.getByLabel("收銀人員", { exact: true }).selectOption("王小明");
  await expect(list.locator("tbody tr:visible")).toHaveCount(1);
  await list
    .getByRole("button", { name: "查看銷售 SO20261020-0002", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("部分退貨");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "關閉", exact: true })
    .click();
  await expect(page.getByLabel("付款方式", { exact: true })).toHaveValue(
    "信用卡",
  );
  await page.getByRole("button", { name: "重設篩選", exact: true }).click();
  await expect(page).toHaveURL(/embed=1/);
  await expect(list.locator("tbody tr:visible")).toHaveCount(5);
  await page.screenshot({
    path: testInfo.outputPath("sales-list.png"),
    fullPage: true,
  });
  if (testInfo.project.name === "desktop") {
    for (const width of [768, 320]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
      ).toBeTruthy();
      await page.screenshot({
        path: testInfo.outputPath(`sales-list-${width}.png`),
        fullPage: true,
      });
    }
  }
  await page.addScriptTag({ content: axe.source });
  expect(
    await page.evaluate(
      async () =>
        (
          await window.axe.run(document.querySelector(".sales-list"), {
            runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
          })
        ).violations,
    ),
  ).toEqual([]);
  await page.getByLabel("搜尋銷售紀錄", { exact: true }).fill("查無此筆銷售");
  await expect(list).toContainText("目前沒有符合的資料");
});

test("@critical 銷售紀錄匯出包含所有分頁與數值金額", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
  await page.goto("/sales");
  const downloading = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "匯出 Excel (.xlsx)", exact: true })
    .click();
  const buffer = await fs.readFile(await (await downloading).path());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(
    workbook.Sheets[workbook.SheetNames[0]],
  );
  expect(rows).toHaveLength(8);
  expect(rows[0]["銷售單號"]).toBe("SO20261020-0001");
  expect(typeof rows[0]["原始成交金額"]).toBe("number");
  expect(rows[0]).not.toHaveProperty("操作");
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
