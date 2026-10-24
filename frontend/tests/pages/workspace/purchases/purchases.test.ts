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
    .getByRole("button", {
      name: /^(確認送出|確認核對|確認入庫|確認沖銷|確認退貨)$/,
    })
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

test("批號效期選填、同商品批次與固定暫計金額", async ({ page }, testInfo) => {
  await page.getByRole("button", { name: "新增進貨單", exact: true }).click();
  await expect(page.locator("#purchase-related-return")).toHaveCount(0);
  await page.locator("#purchase-supplier").selectOption("明康醫藥有限公司");
  await page.locator("#purchase-warehouse").selectOption("主倉庫");
  await page.locator("#purchase-item-search").fill("MED0001");
  await page.locator("#purchase-item-search").press("Enter");
  await expect(page.locator("#purchase-item-search")).toBeFocused();
  await modal(page)
    .getByRole("button", { name: "填寫這筆", exact: true })
    .click();
  await expect(page.getByLabel("第1筆批號", { exact: true })).toBeFocused();
  await page.getByLabel("第1筆批號", { exact: true }).fill("ORIGINAL");
  await page.getByLabel("第1筆效期", { exact: true }).fill("2027-10-20");
  await page.getByLabel("第1筆數量", { exact: true }).fill("3");
  await page.getByLabel("第1筆單位成本", { exact: true }).fill("12.5");
  await modal(page)
    .getByRole("button", { name: "新增第1筆人工淚液的同商品批次", exact: true })
    .click();
  await expect(page.getByLabel("第2筆批號", { exact: true })).toBeFocused();
  await expect(page.getByLabel("第2筆批號", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("第2筆效期", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("第2筆數量", { exact: true })).toHaveValue("1");
  await expect(page.getByLabel("第2筆單位成本", { exact: true })).toHaveValue(
    "12.5",
  );
  const total = modal(page).locator(".purchase-draft-total");
  await expect(total).toContainText("共 2 筆");
  await expect(total).toContainText("NT$ 50.00");
  await page.getByLabel("第2筆數量", { exact: true }).fill("");
  await expect(total).toContainText("1 筆數量或成本待補齊");
  await expect(total).toContainText("NT$ 37.50");
  await page.getByLabel("第2筆數量", { exact: true }).fill("1");
  await modal(page)
    .locator(".items-modal-scroll")
    .evaluate((element) => {
      element.scrollTop = 0;
    });
  await expect(total).toBeInViewport({ ratio: 1 });
  await modal(page).screenshot({
    path: testInfo.outputPath("purchase-draft-summary.png"),
  });
  await modal(page)
    .getByRole("button", { name: "下一步：確認內容", exact: true })
    .click();
  await expect(
    modal(page).getByRole("button", { name: "確認入庫", exact: true }),
  ).toBeVisible();
  await finish(page);
  await action(page, "PO20261020010", "查看進貨明細");
  const rows = modal(page).locator(".purchase-detail-lines tbody tr");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(1).locator("td").nth(1)).toContainText("—");
});

test("新增商品欄位、手機卡片與收合備註", async ({ page }, testInfo) => {
  await page.getByRole("button", { name: "新增進貨單", exact: true }).click();
  for (const code of ["MED0001", "MED0002"]) {
    await page.locator("#purchase-item-search").fill(code);
    await page.locator("#purchase-item-search").press("Enter");
  }
  const rows = modal(page).locator(".purchase-lines-table tbody tr");
  const row = rows.first();
  await expect(row.locator("td")).toHaveCount(7);
  await expect(page.getByLabel("第1筆批號", { exact: true })).toBeEnabled();
  await expect(page.getByLabel("第1筆效期", { exact: true })).toBeEnabled();
  await page.getByLabel("第1筆批號", { exact: true }).fill("CLINIC-001");
  await page.getByLabel("第1筆效期", { exact: true }).fill("2027-10-20");
  await page.getByLabel("第1筆數量", { exact: true }).fill("3");
  await page.getByLabel("第1筆單位成本", { exact: true }).fill("123.4567");
  await expect(row.locator("td").nth(5)).toContainText("NT$ 370.37");
  await expect(page.getByLabel("第1筆數量", { exact: true })).toHaveCSS(
    "font-size",
    "16px",
  );
  await expect(page.getByLabel("第1筆備註", { exact: true })).toBeHidden();
  await row.locator("summary").click();
  await page.getByLabel("第1筆備註", { exact: true }).fill("分批進貨");
  await row.locator("summary").click();
  await page
    .getByRole("button", { name: "移除第2筆散瞳劑", exact: true })
    .click();
  await expect(rows).toHaveCount(1);
  await row.scrollIntoViewIfNeeded();
  if (testInfo.project.name === "mobile") {
    expect(
      await modal(page)
        .locator(".purchase-new-lines")
        .evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
    ).toBe(true);
    await expect(page.getByLabel("第1筆批號", { exact: true })).toBeInViewport({
      ratio: 1,
    });
    await expect(
      page.getByLabel("第1筆單位成本", { exact: true }),
    ).toBeInViewport({ ratio: 1 });
  }
  await modal(page).screenshot({
    path: testInfo.outputPath("new-purchase-line.png"),
  });
  if (testInfo.project.name === "mobile") {
    await page.setViewportSize({ width: 320, height: 844 });
    expect(
      await modal(page)
        .locator(".purchase-new-lines")
        .evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
    ).toBe(true);
  }
  await row.locator("summary").click();
  await expect(page.getByLabel("第1筆備註", { exact: true })).toHaveValue(
    "分批進貨",
  );
});

test("診所核對預設免稅、中文錯誤定位與備註收合", async ({ page }, testInfo) => {
  await action(page, "PO20261020009", "核對單據");
  await expect(page.locator("#settlement-tax")).toHaveValue("免稅");
  await page.locator("#settlement-tax").selectOption("應稅");
  await page.locator("#settlement-tax").selectOption("免稅");
  await expect(page.locator("#settlement-remark")).toBeHidden();
  const notes = modal(page).locator(".purchase-optional-fields summary");
  await notes.click();
  await page.locator("#settlement-remark").fill("診所進貨核對備註");
  await notes.click();
  await expect(notes).toContainText("已填寫");
  await page.locator("#settlement-invoice-date").fill("");
  await modal(page)
    .getByRole("button", { name: "下一步：確認內容", exact: true })
    .click();
  await expect(modal(page).getByRole("alert")).toHaveText("請填寫發票日期。");
  await expect(modal(page).getByRole("alert")).toBeInViewport({ ratio: 1 });
  await expect(page.locator("#settlement-invoice-date")).toBeFocused();
  await modal(page).screenshot({
    path: testInfo.outputPath("settlement-chinese-error.png"),
  });
  await page.locator("#settlement-invoice-date").fill("2026-10-20");
  await page.locator("#settlement-amount").fill("-1");
  await modal(page)
    .getByRole("button", { name: "下一步：確認內容", exact: true })
    .click();
  await expect(modal(page).getByRole("alert")).toHaveText(
    "實際核對金額不可小於 0。",
  );
  await expect(page.locator("#settlement-amount")).toBeFocused();
  await page.locator("#settlement-amount").fill("2000");
  await notes.click();
  await expect(page.locator("#settlement-remark")).toHaveValue(
    "診所進貨核對備註",
  );
  await modal(page)
    .getByRole("button", { name: "下一步：確認內容", exact: true })
    .click();
  await finish(page);
  await action(page, "PO20261020009", "查看進貨明細");
  await modal(page).getByRole("tab", { name: "核對資訊", exact: true }).click();
  await expect(modal(page)).toContainText("免稅");
  await expect(modal(page)).toContainText("診所進貨核對備註");
});

test("核對差額即時更新、無效金額及二次確認", async ({ page }, testInfo) => {
  await action(page, "PO20261020009", "核對單據");
  const amount = page.locator("#settlement-amount");
  const comparison = modal(page).locator(".purchase-settlement-amounts");
  await expect(comparison).toContainText("金額一致");
  await expect(page.locator("#settlement-difference")).toHaveCount(0);
  await amount.fill("");
  await expect(comparison).toContainText("請輸入有效金額");
  await expect(page.locator("#settlement-difference")).toHaveCount(0);
  await amount.fill("-1");
  await expect(comparison).toContainText("請輸入有效金額");
  await amount.fill("1900");
  await expect(comparison).toContainText("低於應核對參考金額");
  await expect(comparison).toContainText("NT$ -100.00");
  await expect(page.locator("#settlement-difference")).toHaveAttribute(
    "required",
    "",
  );
  await expect(page.locator("#settlement-difference")).toBeInViewport({
    ratio: 1,
  });
  await page.locator("#settlement-difference").fill("折扣");
  await modal(page).screenshot({
    path: testInfo.outputPath("settlement-edit.png"),
  });
  await amount.fill("2100");
  await expect(comparison).toContainText("高於應核對參考金額");
  await amount.fill("2000");
  await expect(comparison).toContainText("金額一致");
  await page.locator("#settlement-tax").selectOption("應稅");
  await modal(page)
    .getByRole("button", { name: "下一步：確認內容", exact: true })
    .click();
  await expect(
    modal(page).getByRole("button", { name: "確認核對", exact: true }),
  ).toBeVisible();
  await modal(page)
    .getByRole("button", { name: "返回檢查", exact: true })
    .click();
  await expect(amount).toHaveValue("2000");
  await modal(page)
    .getByRole("button", { name: "下一步：確認內容", exact: true })
    .click();
  await finish(page);
  await expect(list(page)).toContainText("核對完成");
});

test("明細摘要、手機商品卡片與直接核對入口", async ({ page }, testInfo) => {
  await action(page, "PO20261020009", "查看進貨明細");
  await expect(modal(page).locator(".purchase-order-summary")).toContainText(
    "待核對",
  );
  await expect(modal(page).locator(".purchase-order-summary")).toContainText(
    "明康醫藥有限公司",
  );
  await expect(modal(page).locator(".purchase-order-summary")).toContainText(
    "NT$ 2,000.00",
  );
  const row = modal(page).locator(".purchase-detail-lines tbody tr").first();
  await expect(row).toContainText("人工淚液");
  await expect(row.locator("td").nth(2)).toContainText("20 瓶");
  await expect(row.locator("td").nth(4)).toContainText("NT$ 2,000.00");
  await expect(
    modal(page).getByRole("navigation", { name: "表格分頁", exact: true }),
  ).toHaveCount(0);
  await expect(
    modal(page).getByRole("button", {
      name: "匯出 Excel (.xlsx)",
      exact: true,
    }),
  ).toBeVisible();
  if (testInfo.project.name === "mobile") {
    await expect(row.locator("td").nth(4)).toBeInViewport({ ratio: 1 });
  }
  await modal(page).screenshot({
    path: testInfo.outputPath("purchase-detail-cards.png"),
  });
  await modal(page).getByRole("tab", { name: "核對資訊", exact: true }).click();
  await modal(page)
    .getByRole("button", { name: "前往核對", exact: true })
    .click();
  await expect(
    modal(page).getByRole("heading", { name: "進貨單核對", exact: true }),
  ).toBeVisible();
  await expect(modal(page)).toContainText("PO20261020009");
  await expect(page.locator("#settlement-amount")).toHaveValue("2000");
});

test("預設最近一個月、進階篩選及清除日期", async ({ page }, testInfo) => {
  await expect(page.locator("#purchase-filter-start")).toHaveValue(
    "2026-09-20",
  );
  await expect(page.locator("#purchase-filter-end")).toHaveValue("2026-10-20");
  await expect(page.locator("#purchase-filter-warehouse")).toBeHidden();
  await page.locator(".purchase-advanced-filters summary").click();
  await page.locator("#purchase-filter-warehouse").selectOption("診間倉庫");
  await expect(list(page).locator("tbody tr:visible")).toHaveCount(3);
  await page.locator(".purchase-advanced-filters summary").click();
  await expect(
    page.locator(".purchase-advanced-filters summary"),
  ).toContainText("已套用 1 項");
  await page.getByRole("button", { name: "清除", exact: true }).click();
  await expect(page.locator("#purchase-filter-start")).toHaveValue("");
  await expect(page.locator("#purchase-filter-end")).toHaveValue("");
  await page.getByRole("button", { name: "最近一個月", exact: true }).click();
  await expect(page.locator("#purchase-filter-start")).toHaveValue(
    "2026-09-20",
  );
  const header = list(page).locator("thead th").first();
  await expect(header).toHaveCSS("color", "rgb(17, 17, 17)");
  await expect(header).toHaveCSS("font-weight", "700");
  if (testInfo.project.name === "desktop") {
    const inset = await header.evaluate(
      (element) =>
        element.getBoundingClientRect().left -
        element.closest(".purchase-list-card")!.getBoundingClientRect().left,
    );
    expect(inset).toBeLessThanOrEqual(2);
  }
  await page.screenshot({
    path: testInfo.outputPath("purchase-updated.png"),
    fullPage: true,
  });
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
    await page.getByRole("tab", { name: /^核對完成/ }).click();
    await expect(list(page).locator("tbody tr:visible")).toHaveCount(5);
    await page.locator(".purchase-advanced-filters summary").click();
    await page.locator("#purchase-filter-returns").selectOption("全部退貨");
    await expect(list(page).locator("tbody tr:visible")).toHaveCount(1);
    await page.getByRole("button", { name: "清除", exact: true }).click();
    const mobileSort = page.locator("#purchase-mobile-sort");
    if (await mobileSort.isVisible()) await mobileSort.selectOption("date-asc");
    else
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
      .getByRole("button", { name: "下一步：確認內容", exact: true })
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
      .getByRole("button", { name: "下一步：確認內容", exact: true })
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
      modal(page).getByText("選擇供應商與倉別，再加入進貨商品。", {
        exact: false,
      }),
    ).toBeVisible();
    await expect(
      modal(page).getByRole("heading", {
        name: "進貨商品（必填，至少加入一筆）",
      }),
    ).toBeVisible();
    await expect(
      modal(page).getByText("尚未加入商品，請先搜尋並加入。", { exact: false }),
    ).toBeVisible();
    await page.locator("#purchase-warehouse").selectOption("展示倉");
    await modal(page)
      .getByRole("button", { name: "下一步：確認內容", exact: true })
      .click();
    const alert = modal(page).getByRole("alert");
    await expect(alert).toContainText("供應商");
    await expect(alert).toBeVisible();
    await expect(page.locator("#purchase-supplier")).toBeFocused();
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
      name: "下一步：確認內容",
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
    for (const column of [3, 4]) {
      await expect(row.locator("td").nth(column)).toContainText("必填");
    }
    for (const column of [1, 2])
      await expect(row.locator("td").nth(column)).toContainText("選填");
    await expect(
      page.getByLabel("第1筆批號", { exact: true }),
    ).not.toHaveAttribute("required", "");
    await expect(
      page.getByLabel("第1筆效期", { exact: true }),
    ).not.toHaveAttribute("required", "");
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
    await expect(
      modal(page)
        .locator(".purchase-detail-lines tbody tr")
        .first()
        .locator("td")
        .nth(1),
    ).toContainText("—");
  },
);

test("核對差異原因及已核對入口限制", async ({ page }) => {
  await action(page, "PO20261020009", "核對單據");
  await page.locator("#settlement-tax").selectOption("應稅");
  await page.locator("#settlement-amount").fill("1900");
  await modal(page)
    .getByRole("button", { name: "下一步：確認內容", exact: true })
    .click();
  await expect(modal(page).getByRole("alert")).toBeVisible();
  await page.locator("#settlement-difference").fill("發票折扣差異");
  await page.locator("#settlement-invoice").fill("AB12345678");
  await modal(page)
    .getByRole("button", { name: "下一步：確認內容", exact: true })
    .click();
  await finish(page);
  await expect(list(page).locator("tbody tr:visible")).toContainText(
    "核對完成",
  );
  await expect(list(page)).toContainText("2000.00");
  await page
    .getByRole("button", { name: "更多作業 PO20261020009", exact: true })
    .click();
  await expect(
    page.getByRole("menuitem", { name: "進貨沖銷", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("menuitem", { name: "核對後更正", exact: true }),
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
    .getByRole("button", { name: "下一步：確認退貨", exact: true })
    .click();
  await expect(modal(page).getByRole("alert")).toContainText("超過");
  await page.getByLabel("散瞳劑本次數量", { exact: true }).fill("2");
  await modal(page)
    .getByRole("button", { name: "下一步：確認退貨", exact: true })
    .click();
  await expect(modal(page)).toContainText("確認本次操作");
  await modal(page)
    .getByRole("button", { name: "返回檢查", exact: true })
    .click();
  await expect(page.getByLabel("散瞳劑本次數量", { exact: true })).toHaveValue(
    "2",
  );
  await modal(page)
    .getByRole("button", { name: "下一步：確認退貨", exact: true })
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
    .getByRole("button", { name: "下一步：確認沖銷", exact: true })
    .click();
  await finish(page);
  const row = page.getByRole("row").filter({ hasText: "PO20261020009" });
  await expect(row).toContainText("全部沖銷");
  await row.getByRole("button", { name: /作業/ }).click();
  for (const name of ["核對單據", "進貨沖銷", "進貨退貨", "核對後更正"]) {
    await expect(
      page.getByRole("menuitem", { name, exact: true }),
    ).toBeDisabled();
  }
  await page.keyboard.press("Escape");
  await action(page, "PO20261013002", "進貨退貨");
  await page.locator("#operation-reason").fill("庫存已有耗用");
  await page.locator("#operation-resolution").selectOption("退款");
  await page.getByRole("checkbox", { name: "選擇散瞳劑", exact: true }).check();
  await page.getByLabel("散瞳劑本次數量", { exact: true }).fill("3");
  await page.locator("#operation-physical").check();
  await modal(page)
    .getByRole("button", { name: "下一步：確認退貨", exact: true })
    .click();
  await expect(modal(page).getByRole("alert")).toContainText(
    "可追溯剩餘量不足",
  );
});

test("純金額更正保留核對金額、帳務結果另存", async ({ page }) => {
  await action(page, "PO20261018007", "核對後更正");
  await page.locator("#operation-type").selectOption("發票金額更正");
  await page.locator("#operation-reason").fill("核對金額修正");
  await page.locator("#operation-resolution").selectOption("折讓");
  await page.locator("#operation-amount").fill("-50");
  await modal(page)
    .getByRole("button", { name: "檢查並更正", exact: true })
    .click();
  await finish(page);
  await action(page, "PO20261018007", "查看進貨明細");
  await page.getByRole("tab", { name: "核對資訊", exact: true }).click();
  await expect(modal(page)).toContainText("NT$ 9,200.00");
  await expect(modal(page)).toContainText("NT$ 9,050.00");
  await expect(
    modal(page).locator(".purchase-amount-comparison"),
  ).toContainText("NT$ -150.00");
  await modal(page).screenshot({
    path: test.info().outputPath("settlement-comparison.png"),
  });
  await page.getByRole("tab", { name: "異動及更正歷史", exact: true }).click();
  const latest = modal(page).locator(".purchase-history article").first();
  await expect(latest).toContainText("PC20261020");
  await expect(
    latest.getByText("原因：核對金額修正", { exact: true }),
  ).toBeHidden();
  await latest.locator("summary").click();
  await expect(
    latest.getByText("原因：核對金額修正", { exact: true }),
  ).toBeVisible();
  await modal(page).screenshot({
    path: test.info().outputPath("purchase-history-latest.png"),
  });
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

test("部分沖銷後核對預填淨額並保留原始金額", async ({ page }) => {
  await action(page, "PO20261020009", "進貨沖銷");
  await page.locator("#operation-reason").fill("部分登錄錯誤");
  await page
    .getByRole("checkbox", { name: "選擇人工淚液", exact: true })
    .check();
  await page.getByLabel("人工淚液本次數量", { exact: true }).fill("3");
  await modal(page)
    .getByRole("button", { name: "下一步：確認沖銷", exact: true })
    .click();
  await finish(page);
  await expect(
    page.getByRole("row").filter({ hasText: "PO20261020009" }),
  ).toContainText("部分沖銷");
  await action(page, "PO20261020009", "核對單據");
  await expect(page.locator("#settlement-amount")).toHaveValue("1700");
  const breakdown = modal(page).locator('[aria-label="核對金額組成"]');
  await expect(breakdown).toContainText("NT$ 2,000.00");
  await expect(breakdown).toContainText("NT$ 300.00");
  await expect(breakdown).toContainText("NT$ 1,700.00");
  await expect(page.locator("#settlement-difference")).toHaveCount(0);
  await modal(page).screenshot({
    path: test.info().outputPath("reconciliation-breakdown.png"),
  });
});

test("連續掃碼自動加入並攔截掃描器 Enter", async ({ page }) => {
  await page.getByRole("button", { name: "新增進貨單", exact: true }).click();
  const search = page.locator("#purchase-item-search");
  const rows = modal(page).locator(".purchase-lines-table tbody tr");
  await expect(search).toBeFocused();
  await page.keyboard.type("4711234560000");
  await expect(rows).toHaveCount(1);
  await expect(search).toHaveValue("");
  await expect(search).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.type("4711234560001");
  await page.keyboard.press("Enter");
  // 等待自動加入的計時器，確認尾碼 Enter 不會重複新增。
  await page.waitForTimeout(250);
  await expect(rows).toHaveCount(2);
  await expect(search).toBeFocused();
  await page.keyboard.type("4711234560000");
  await expect(rows).toHaveCount(3);
  await search.fill("471123456");
  await search.press("Enter");
  await expect(modal(page)).toContainText("找到多筆商品，請選擇正確品項。");
  await expect(rows).toHaveCount(3);
  await search.fill("9999999999999");
  await search.press("Enter");
  await expect(modal(page)).toContainText(
    "找不到對應商品，請確認條碼或改用搜尋。",
  );
  await expect(rows).toHaveCount(3);
  await expect(page.locator("#purchase-supplier")).toBeVisible();
});

test("未儲存提醒、鍵盤與版面", async ({ page }, testInfo) => {
  await page.getByRole("button", { name: "新增進貨單", exact: true }).click();
  await expect(page.locator("#purchase-item-search")).toBeFocused();
  await expect(page.locator("#purchase-remark")).toBeHidden();
  await modal(page).locator(".purchase-optional-fields summary").click();
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

for (const type of ["數量更正", "成本更正", "品項更正", "批號更正"]) {
  test(`${type}保留原始明細`, async ({ page }) => {
    await page.goto("/purchases");
    await action(page, "PO20261019008", "核對後更正");
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
  });
}

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
  for (const name of ["查看進貨明細", "核對單據", "進貨沖銷", "進貨退貨"]) {
    await action(page, "PO20261020009", name);
    await audit();
    await modal(page)
      .getByRole("button", { name: "關閉進貨視窗", exact: true })
      .click();
  }
  await action(page, "PO20261018007", "核對後更正");
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

test("待處理帳務集中入口與處理完成後移出", async ({ page }) => {
  await page.getByRole("tab", { name: /^待處理帳務/ }).click();
  const row = page.getByRole("row").filter({ hasText: "PO20261019008" });
  await row.getByRole("button", { name: /待處理帳務/ }).click();
  const section = modal(page).getByRole("region", { name: "待處理帳務" });
  await section.getByRole("button", { name: /^處理帳務/ }).click();
  await page.locator("#resolution-type").selectOption("退款");
  await page.locator("#resolution-amount").fill("500");
  await page.locator("#resolution-reference").fill("REF-TEST-001");
  await modal(page)
    .getByRole("button", { name: "確認帳務處理完成", exact: true })
    .click();
  await finish(page);
  await expect(row).toHaveCount(0);
});

test("沖銷五欄、數量帶入、固定摘要及手機卡片", async ({ page }, testInfo) => {
  await action(page, "PO20261020009", "進貨沖銷");
  await expect(
    modal(page).getByText("原核對紀錄", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("#operation-remark")).toBeHidden();
  const table = modal(page).locator(".purchase-reversal-lines");
  await expect(table.locator("thead th")).toHaveCount(5);
  await expect(table.locator("tbody td").first()).toHaveCSS(
    "font-size",
    "16px",
  );
  await page.locator("#operation-reason").fill("登錄重複");
  await table.getByRole("button", { name: "全選可沖銷商品" }).click();
  await expect(table.getByText("可沖銷 1 項 · 已選 1 項")).toBeVisible();
  const itemCheckbox = table.getByRole("checkbox", {
    name: "選擇人工淚液",
    exact: true,
  });
  await expect(itemCheckbox).toBeChecked();
  await table.getByRole("button", { name: "清除選取" }).click();
  await expect(itemCheckbox).not.toBeChecked();
  await page
    .getByRole("checkbox", { name: "選擇人工淚液", exact: true })
    .check();
  const qty = page.getByLabel("人工淚液本次數量", { exact: true });
  await expect(qty).toBeFocused();
  await page
    .getByRole("button", { name: "帶入人工淚液可沖銷量", exact: true })
    .click();
  await expect(qty).toHaveValue("20");
  await expect(qty).toHaveAttribute("max", "20");
  const total = modal(page).locator(".purchase-draft-total");
  await expect(total).toContainText("NT$ 2,000.00");
  await qty.fill("21");
  await expect(total).toContainText("數量待確認");
  await qty.fill("3");
  await expect(total).toContainText("NT$ 300.00");
  await expect(total).toBeInViewport({ ratio: 1 });
  await page.setViewportSize({ width: 390, height: 844 });
  await qty.scrollIntoViewIfNeeded();
  expect(
    await table.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true);
  await modal(page).screenshot({
    path: testInfo.outputPath("reversal-mobile.png"),
  });
  await modal(page)
    .getByRole("button", { name: "下一步：確認沖銷", exact: true })
    .click();
  await expect(modal(page)).toContainText("本次為部分沖銷");
  await expect(modal(page)).toContainText("人工淚液／批號 B0010");
  await expect(modal(page)).toContainText("3 瓶");
  await expect(
    modal(page).getByRole("button", { name: "確認沖銷", exact: true }),
  ).toBeVisible();
  await finish(page);
});
