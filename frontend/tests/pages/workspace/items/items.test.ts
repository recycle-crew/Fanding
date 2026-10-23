import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

import * as fs from "node:fs/promises";
import * as XLSX from "xlsx";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
  await page.goto("/items");
  await expect(page.locator("#login-form")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "品項與庫存管理", exact: true }),
  ).toBeVisible();
});

for (const group of ["his", "general"]) {
  test(`@critical ${group} 品項必填標示、逐欄漏填阻擋與補齊儲存`, async ({
    page,
  }) => {
    await page.goto(`/items/${group}`);
    await page.getByRole("button", { name: "新增品項", exact: true }).click();
    const modal = page.getByRole("dialog");
    const fields = [
      ["code", "料號", `REQ-${group.toUpperCase()}`],
      ["name", "品名", `必填測試${group}`],
      ["category", "品項分類", group === "his" ? "眼科用藥" : "保健食品"],
      ["unit", "基本單位", "瓶"],
      ["safetyStock", "安全庫存", "0"],
      ["effectiveFrom", "開始使用日期", "2026-10-20"],
    ];
    for (const [key] of fields) {
      const input = page.locator(`#item-${key}`);
      if (["category", "unit"].includes(key)) await input.selectOption("");
      else await input.fill("");
    }
    for (const [key, label, value] of fields) {
      const input = page.locator(`#item-${key}`);
      await expect(input).toHaveAttribute("required", "");
      await expect(modal.locator(`label[for="item-${key}"]`)).toContainText(
        "*",
      );
      await modal
        .getByRole("button", { name: "儲存品項", exact: true })
        .click();
      await expect(modal.getByRole("alert")).toContainText(label);
      await expect(input).toHaveAttribute("aria-invalid", "true");
      if (["category", "unit"].includes(key)) await input.selectOption(value);
      else await input.fill(value);
    }
    await modal.getByRole("button", { name: "儲存品項", exact: true }).click();
    await expect(modal).toBeHidden();
    await page
      .getByRole("textbox", { name: "搜尋品項", exact: true })
      .fill(`REQ-${group.toUpperCase()}`);
    await expect(page.locator(".items-main-table tbody tr")).toHaveCount(1);
    await expect(page.locator(".items-main-table")).toContainText(
      `必填測試${group}`,
    );
  });
}

const table = (page: Page) => page.locator(".items-main-table");
const dialog = (page: Page) => page.locator(".items-modal");

test(
  "品項 Tab 路由支援直接連結、重新整理與歷史導覽",
  { tag: "@critical" },
  async ({ page }) => {
    const his = page.getByRole("tab", { name: "HIS 藥品", exact: true });
    const general = page.getByRole("tab", {
      name: "自費／OTC／其他商品",
      exact: true,
    });
    await expect(page).toHaveURL(/\/items\/his$/);
    await expect(his).toHaveAttribute("aria-selected", "true");
    await general.click();
    await expect(page).toHaveURL(/\/items\/general$/);
    await expect(general).toHaveAttribute("aria-selected", "true");
    await page.goBack();
    await expect(his).toHaveAttribute("aria-selected", "true");
    await page.goForward();
    await expect(general).toHaveAttribute("aria-selected", "true");
    await page.reload();
    await expect(general).toHaveAttribute("aria-selected", "true");
    await expect(table(page)).toContainText("OTC0001");
    await page.goto("/items/his?embed=1");
    await expect(his).toHaveAttribute("aria-selected", "true");
    await general.click();
    await expect(page).toHaveURL(/\/items\/general\?embed=1$/);
  },
);

async function createForm(page: Page, code: string, name: string) {
  await page.getByRole("button", { name: "新增品項", exact: true }).click();
  await page.locator("#item-code").fill(code);
  await page.locator("#item-name").fill(name);
  await page.locator("#item-category").selectOption("眼科用藥");
  await page.locator("#item-unit").selectOption("瓶");
}
async function close(page: Page) {
  await dialog(page).getByRole("button", { name: "關閉視窗" }).click();
}

test("新版雙群組、搜尋、倉別及全倉安全庫存、分頁與排序", async ({ page }) => {
  await expect(table(page).locator("tbody tr")).toHaveCount(6);
  await expect(page.locator(".items-stat")).toHaveCount(4);
  await page
    .getByRole("textbox", { name: "搜尋品項" })
    .fill("Artificial Tears");
  await expect(table(page).locator("tbody tr")).toHaveCount(1);
  await page.locator("#items-filter-warehouse").selectOption("診間倉庫");
  const row = table(page).locator("tbody tr");
  await expect(
    table(page).getByRole("columnheader", { name: "可用庫存" }),
  ).toBeVisible();
  await expect(row.locator("td").nth(3)).toContainText("15 瓶");
  await expect(row.locator("td").nth(3)).toContainText("診間倉庫");
  await expect(row).toContainText("正常"); // 全倉35，不因診間只有15而變成低庫存
  await page.getByRole("button", { name: "清除", exact: true }).click();
  await page.locator("#items-page-size").selectOption("5");
  await expect(table(page).locator("tbody tr")).toHaveCount(5);
  await page.getByRole("button", { name: "下一頁", exact: true }).click();
  await expect(table(page)).toContainText("口服消炎藥");
  const sortByCode = table(page).getByRole("button", {
    name: "料號",
    exact: true,
  });
  const sortByName = table(page).getByRole("button", {
    name: "品名",
    exact: true,
  });
  const desktop = await sortByCode.isVisible();
  await (desktop ? sortByCode : sortByName).click();
  await page.getByRole("button", { name: "上一頁", exact: true }).click();
  if (desktop) {
    await expect(table(page).locator("tbody tr").first()).toContainText(
      "MED0006",
    );
  } else {
    await expect(
      table(page).getByRole("columnheader", { name: "品名", exact: true }),
    ).toHaveAttribute("aria-sort", "ascending");
  }
  await page
    .getByRole("tab", { name: "自費／OTC／其他商品", exact: true })
    .click();
  if (desktop) await expect(table(page)).toContainText("OTC0006");
  else await expect(table(page).locator("tbody tr")).toHaveCount(5);
  await page.getByRole("textbox", { name: "搜尋品項" }).fill("不存在的商品");
  await expect(table(page)).toContainText("找不到符合條件的品項");
});

test("摘要卡切換警示列表並保留搜尋、倉別與其他卡片數字", async ({ page }) => {
  const cards = page.locator(".items-stat");
  const initialCounts = await cards.locator("strong").allTextContents();
  await page
    .getByRole("button", { name: "篩選安全庫存不足", exact: true })
    .click();
  await expect(page.locator("#items-filter-stock")).toHaveValue("安全庫存不足");
  await expect(table(page).locator("tbody tr")).toHaveCount(
    Number(initialCounts[1]),
  );
  await expect(cards.locator("strong")).toHaveText(initialCounts);
  await page
    .getByRole("button", { name: "篩選已過期品項", exact: true })
    .click();
  await expect(page.locator("#items-filter-stock")).toHaveValue("");
  await expect(page.locator("#items-filter-expiry")).toHaveValue("已過期");
  await expect(table(page).locator("tbody tr")).toHaveCount(
    Number(initialCounts[3]),
  );
  await expect(cards.locator("strong")).toHaveText(initialCounts);
  await page.getByRole("button", { name: "篩選品項數", exact: true }).click();
  await expect(table(page).locator("tbody tr")).toHaveCount(6);
  await page
    .getByRole("textbox", { name: "搜尋品項" })
    .fill("Artificial Tears");
  await page.locator("#items-filter-warehouse").selectOption("診間倉庫");
  await page
    .getByRole("button", { name: "篩選即將到期品項", exact: true })
    .click();
  await expect(page.getByRole("textbox", { name: "搜尋品項" })).toHaveValue(
    "Artificial Tears",
  );
  await expect(page.locator("#items-filter-warehouse")).toHaveValue("診間倉庫");
  await expect(
    page.getByRole("button", { name: "篩選即將到期品項", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "篩選品項數", exact: true }).click();
  await expect(table(page).locator("tbody tr")).toHaveCount(1);
});

test("新增、重複料號與條碼、日期驗證及零庫存", async ({ page }) => {
  await createForm(page, "MED0001", "測試品項");
  await dialog(page)
    .getByRole("button", { name: "儲存品項", exact: true })
    .click();
  await expect(dialog(page).getByRole("alert")).toContainText("品項料號已存在");
  await page.locator("#item-code").fill("DEMO-NEW");
  await dialog(page).locator("summary").filter({ hasText: "其他資料" }).click();
  await page.locator("#item-barcode").fill("4711234560000");
  await dialog(page)
    .getByRole("button", { name: "儲存品項", exact: true })
    .click();
  await expect(dialog(page).getByRole("alert")).toContainText("國際條碼已存在");
  await page.locator("#item-barcode").fill("001234567890");
  await dialog(page)
    .locator("summary")
    .filter({ hasText: "價格與使用設定" })
    .click();
  await page.locator("#item-effectiveUntil").fill("2026-10-19");
  await dialog(page)
    .getByRole("button", { name: "儲存品項", exact: true })
    .click();
  await expect(dialog(page).getByRole("alert")).toContainText("不可早於");
  await page.locator("#item-effectiveUntil").fill("");
  await page.locator("#item-safetyStock").fill("0");
  await dialog(page)
    .getByRole("button", { name: "儲存品項", exact: true })
    .click();
  await expect(dialog(page)).toBeHidden();
  await page.getByRole("textbox", { name: "搜尋品項" }).fill("DEMO-NEW");
  await expect(table(page)).toContainText("測試品項");
  await expect(table(page)).toContainText("無庫存");
  await page.getByRole("button", { name: "查看測試品項", exact: true }).click();
  await expect(dialog(page).locator(".items-stock-total")).toContainText("0");
  await dialog(page)
    .getByRole("tab", { name: "庫存異動", exact: true })
    .click();
  await expect(dialog(page)).toContainText("目前沒有符合的資料");
});

test("新增選填區塊收合保留資料，驗證錯誤會展開欄位", async ({ page }) => {
  await createForm(page, "OPTIONAL-NEW", "選填資料測試");
  await expect(dialog(page)).toContainText("初始庫存為 0");
  await expect(page.locator("#item-barcode")).toBeHidden();
  await expect(page.locator("#item-effectiveFrom")).toBeVisible();
  const other = dialog(page).locator("summary").filter({ hasText: "其他資料" });
  await other.click();
  await page.locator("#item-barcode").fill("OPTIONAL-BARCODE");
  await other.click();
  const pricing = dialog(page)
    .locator("summary")
    .filter({ hasText: "價格與使用設定" });
  await pricing.click();
  await page.locator("#item-referenceCost").fill("-1");
  await pricing.click();
  await dialog(page)
    .getByRole("button", { name: "儲存品項", exact: true })
    .click();
  await expect(page.locator("#item-referenceCost")).toBeVisible();
  await expect(page.locator("#item-referenceCost")).toBeFocused();
  await expect(dialog(page).getByRole("alert")).toBeInViewport({ ratio: 1 });
  await dialog(page)
    .locator(".items-modal-scroll")
    .evaluate((element) => {
      element.scrollTop = 0;
    });
  await expect(dialog(page).getByRole("alert")).toBeInViewport({ ratio: 1 });
  await dialog(page).screenshot({
    path: test.info().outputPath("items-error.png"),
  });
  await page.locator("#item-referenceCost").fill("10");
  await other.click();
  await expect(page.locator("#item-barcode")).toHaveValue("OPTIONAL-BARCODE");
  await dialog(page)
    .getByRole("button", { name: "儲存品項", exact: true })
    .click();
  await expect(dialog(page)).toBeHidden();
  await page
    .getByRole("textbox", { name: "搜尋品項" })
    .fill("OPTIONAL-BARCODE");
  await expect(table(page)).toContainText("選填資料測試");
});

test("修改可編輯欄位、鎖定交易設定、成本與庫存不變", async ({ page }) => {
  await page.getByRole("button", { name: "編輯人工淚液", exact: true }).click();
  await expect(page.locator("#item-code")).toHaveAttribute("readonly", "");
  await expect(page.locator("#item-unit")).toBeDisabled();
  await expect(
    dialog(page).getByRole("checkbox", { name: "管理效期" }),
  ).toHaveCount(0);
  await expect(
    dialog(page).getByRole("checkbox", { name: "管理批號" }),
  ).toHaveCount(0);
  await page.locator("#item-name").fill("人工淚液新版");
  await page.locator("#item-safetyStock").fill("35");
  await page.locator("#item-referenceCost").fill("999");
  await dialog(page)
    .getByRole("button", { name: "儲存變更", exact: true })
    .click();
  const row = table(page)
    .locator("tbody tr")
    .filter({ hasText: "人工淚液新版" });
  await expect(row.locator("td").nth(3)).toContainText("35 瓶");
  await expect(row).toContainText("低庫存"); // 等於安全庫存仍低庫存
  await page
    .getByRole("button", { name: "查看人工淚液新版", exact: true })
    .click();
  await expect(dialog(page)).toContainText("110.0000");
  await dialog(page)
    .getByRole("tab", { name: "進貨成本歷史", exact: true })
    .click();
  await expect(dialog(page)).toContainText("100.0000");
  await expect(dialog(page)).toContainText("120.0000");
  await expect(dialog(page).locator("table")).not.toContainText("999");
});

test("未儲存取消提醒、放棄修改與焦點回復", async ({ page }) => {
  await page.getByRole("button", { name: "編輯人工淚液", exact: true }).click();
  await page.locator("#item-name").fill("不要儲存");
  await close(page);
  await expect(dialog(page).getByRole("alert")).toContainText("尚未儲存");
  await dialog(page).getByRole("button", { name: "繼續編輯" }).click();
  await expect(page.locator("#item-name")).toHaveValue("不要儲存");
  await page.locator("#item-name").press("Escape");
  await dialog(page).getByRole("button", { name: "放棄修改" }).click();
  await expect(dialog(page)).toBeHidden();
  await expect(
    page.getByRole("button", { name: "編輯人工淚液", exact: true }),
  ).toBeFocused();
  await expect(table(page)).not.toContainText("不要儲存");
});

test("過期批次排除可用量、成本歷史與異動篩選", async ({ page }) => {
  await page.getByRole("button", { name: "查看人工淚液", exact: true }).click();
  await expect(dialog(page).locator(".items-stock-total")).toContainText("35");
  await expect(dialog(page).locator(".items-stock-total")).toContainText(
    "全部倉庫合計",
  );
  await expect(dialog(page).locator(".items-detail-facts")).not.toHaveAttribute(
    "open",
    "",
  );
  await expect(dialog(page).locator(".items-availability-note")).toContainText(
    "可用數量也為 0",
  );
  const expired = dialog(page)
    .locator("tbody tr")
    .filter({ hasText: "已過期" });
  await expect(expired).toHaveCount(1);
  await expect(expired.locator("td").nth(3)).toContainText("10 瓶");
  await expect(expired.locator("td").nth(2)).toContainText("0 瓶");
  await expect(expired).toContainText("已過期（不可用）");
  await dialog(page).screenshot({
    path: test.info().outputPath("stock-details.png"),
  });
  await dialog(page).locator(".items-detail-facts summary").click();
  await expect(dialog(page).locator(".items-facts")).toContainText(
    "Artificial Tears",
  );
  await dialog(page).locator(".items-detail-facts summary").click();
  await dialog(page)
    .getByRole("tab", { name: "庫存異動", exact: true })
    .click();
  await dialog(page)
    .getByLabel("異動類型", { exact: true })
    .selectOption({ label: "HIS 耗用出庫" });
  await expect(dialog(page).locator("tbody tr")).toHaveCount(3);
  await expect(dialog(page).locator("table")).toContainText("-2");
  await expect(dialog(page).locator("table")).toContainText("HIS 耗用出庫");
  await expect(dialog(page).locator("table")).not.toContainText(
    "HIS_CONSUMPTION_OUT",
  );
  await dialog(page).getByLabel("批號", { exact: true }).fill("A011");
  await expect(dialog(page).locator("tbody tr")).toHaveCount(1);
});

test("庫存明細沿用倉別，跨分頁篩選及效期空資料", async ({ page }) => {
  await page.locator("#items-filter-warehouse").selectOption("診間倉庫");
  await page.getByRole("button", { name: "查看人工淚液", exact: true }).click();
  const scope = dialog(page).getByLabel("查看倉別", { exact: true });
  await expect(scope).toHaveValue("診間倉庫");
  await expect(dialog(page).locator(".items-stock-total")).toContainText("15");
  await expect(dialog(page).locator(".items-stock-total")).toContainText(
    "診間倉庫",
  );
  await expect(dialog(page).locator("tbody tr")).toHaveCount(1);
  await dialog(page)
    .getByLabel("效期狀態", { exact: true })
    .selectOption("已過期");
  await expect(dialog(page).locator("td.empty")).toBeVisible();
  await expect(dialog(page).locator(".items-stock-total")).toContainText("15");
  await dialog(page)
    .getByRole("tab", { name: "進貨成本歷史", exact: true })
    .click();
  await expect(dialog(page).locator("tbody tr")).toHaveCount(1);
  await expect(dialog(page).locator("table")).toContainText("A012");
  await scope.selectOption("主倉庫");
  await expect(dialog(page).locator("tbody tr")).toHaveCount(2);
  await expect(dialog(page).locator(".items-stock-total")).toContainText("20");
  await dialog(page)
    .getByRole("tab", { name: "庫存異動", exact: true })
    .click();
  await expect(dialog(page).locator("tbody tr")).toHaveCount(3);
  await dialog(page)
    .getByRole("tab", { name: "批號庫存", exact: true })
    .click();
  await dialog(page)
    .getByRole("button", { name: "清除篩選", exact: true })
    .click();
  await expect(scope).toHaveValue("");
  await expect(dialog(page).locator("tbody tr")).toHaveCount(3);
  await expect(dialog(page).locator(".items-stock-total")).toContainText("35");
  const batch = dialog(page).locator("tbody tr").filter({ hasText: "A011" });
  await batch.locator("summary").click();
  await expect(batch).toContainText("110.0000");
  await dialog(page)
    .locator(".items-modal-scroll")
    .evaluate((element) => {
      element.scrollTop = 0;
    });
  await dialog(page).screenshot({
    path: test.info().outputPath("stock-filtered.png"),
  });
});

test("透過編輯停用後保留庫存及歷史，可重新啟用", async ({ page }) => {
  await expect(table(page).getByRole("switch")).toHaveCount(0);
  await expect(
    table(page).getByRole("columnheader", { name: "啟用", exact: true }),
  ).toHaveCount(0);
  await expect(table(page).locator("thead th").nth(1)).toHaveText("健保碼");
  await page.getByRole("button", { name: "編輯人工淚液", exact: true }).click();
  await dialog(page)
    .getByRole("checkbox", { name: "啟用品項", exact: true })
    .uncheck();
  await expect(dialog(page)).toContainText("此品項仍有庫存");
  await dialog(page).getByRole("button", { name: "儲存變更" }).click();
  await expect(table(page)).not.toContainText("人工淚液");
  await page.locator("#items-filter-active").selectOption("inactive");
  await expect(table(page)).toContainText("人工淚液");
  await page.getByRole("button", { name: "查看人工淚液", exact: true }).click();
  await expect(dialog(page).locator(".items-stock-total")).toContainText("35");
  await expect(dialog(page).locator("tbody tr")).toHaveCount(3);
  await close(page);
  await page.getByRole("button", { name: "編輯人工淚液", exact: true }).click();
  await dialog(page)
    .getByRole("checkbox", { name: "啟用品項", exact: true })
    .check();
  const checkbox = dialog(page).getByRole("checkbox", {
    name: "啟用品項",
    exact: true,
  });
  const offset = await checkbox.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const icon = element.querySelector("svg")!.getBoundingClientRect();
    return {
      x: Math.abs(box.x + box.width / 2 - icon.x - icon.width / 2),
      y: Math.abs(box.y + box.height / 2 - icon.y - icon.height / 2),
    };
  });
  expect(offset.x).toBeLessThanOrEqual(1);
  expect(offset.y).toBeLessThanOrEqual(1);
  await dialog(page).screenshot({
    path: test.info().outputPath("item-enabled.png"),
  });
  await dialog(page).getByRole("button", { name: "儲存變更" }).click();
  await page.locator("#items-filter-active").selectOption("active");
  await expect(table(page)).toContainText("人工淚液");
});

test("Excel 匯出全部分頁、保留條碼文字及數值型別", async ({ page }) => {
  await page.locator("#items-page-size").selectOption("5");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "匯出 Excel", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
  const buffer = await fs.readFile(await download.path());
  const workbook = XLSX.read(buffer.toString("base64"), { type: "base64" });
  const data = XLSX.utils.sheet_to_json<
    Record<string, string | number | boolean>
  >(workbook.Sheets[workbook.SheetNames[0]]);
  expect(data).toHaveLength(6);
  expect(data[0]["國際條碼"]).toBe("4711234560000");
  expect(data[0]["庫存數量"]).toBe(35);
  expect(data[0]["建議售價"]).toBe(180);
});

test("新舊入口並存及桌面／手機基本版面", async ({ page }, testInfo) => {
  await expect(page.locator(".items-page")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("items-list.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "新增品項", exact: true }).click();
  await expect(
    dialog(page).getByRole("button", { name: "儲存品項", exact: true }),
  ).toBeInViewport();
  await page.screenshot({
    path: testInfo.outputPath("items-editor.png"),
    animations: "disabled",
  });
  await close(page);
  const mobile = testInfo.project.name === "mobile";
  if (mobile)
    await page
      .getByRole("button", { name: /功能選單|開啟選單|顯示選單/ })
      .click();
  await page
    .getByRole("button", { name: "藥品查詢與修改", exact: true })
    .click();
  await expect(page).toHaveURL(/\/his/);
  if (mobile)
    await page
      .getByRole("button", { name: /功能選單|開啟選單|顯示選單/ })
      .click();
  await page.getByRole("button", { name: "品項資料維護", exact: true }).click();
  await expect(page).toHaveURL(/\/products/);
});

test("/items 直接進入與重新整理", { tag: "@critical" }, async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
  await page.goto("/items");
  await expect(page.locator("#workspace")).toBeVisible();
  await expect(
    page.locator("#workspace").getByRole("heading").first(),
  ).not.toBeEmpty();
  await expect(page).toHaveURL((url) => url.pathname === "/items/his");
  const entryURL = page.url();
  await page.reload();
  await expect(page).toHaveURL(entryURL);
  await expect(page.locator("#workspace").first()).toBeVisible();
});
