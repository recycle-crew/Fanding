import type { Page, Locator } from "@playwright/test";
import {
  test,
  expect,
  enterWorkspace,
  loginEnabled,
} from "../../../helpers/test";
import { checkPageEntry } from "../../../helpers/test";
import * as fs from "node:fs/promises";
import XLSX from "../../../helpers/xlsx";



test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
  await page.goto("/demo/items");
  await expect(page.locator("#login-form")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "品項與庫存管理", exact: true }),
  ).toBeVisible();
});

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
    await expect(page).toHaveURL(/\/demo\/items\/his$/);
    await expect(his).toHaveAttribute("aria-selected", "true");
    await general.click();
    await expect(page).toHaveURL(/\/demo\/items\/general$/);
    await expect(general).toHaveAttribute("aria-selected", "true");
    await page.goBack();
    await expect(his).toHaveAttribute("aria-selected", "true");
    await page.goForward();
    await expect(general).toHaveAttribute("aria-selected", "true");
    await page.reload();
    await expect(general).toHaveAttribute("aria-selected", "true");
    await expect(table(page)).toContainText("OTC0001");
    await page.goto("/demo/items/his?embed=1");
    await expect(his).toHaveAttribute("aria-selected", "true");
    await general.click();
    await expect(page).toHaveURL(/\/demo\/items\/general\?embed=1$/);
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
  await expect(page.locator(".items-stat.cyan")).toContainText("107 瓶／32 盒");
  await page
    .getByRole("textbox", { name: "搜尋品項" })
    .fill("Artificial Tears");
  await expect(table(page).locator("tbody tr")).toHaveCount(1);
  await page.locator("#items-filter-warehouse").selectOption("診間倉庫");
  const row = table(page).locator("tbody tr");
  await expect(row.locator("td").nth(6)).toHaveText("15");
  await expect(row).toContainText("正常"); // 全倉35，不因診間只有15而變成低庫存
  await page.getByRole("button", { name: "清除", exact: true }).click();
  await page.locator("#items-page-size").selectOption("5");
  await expect(table(page).locator("tbody tr")).toHaveCount(5);
  await page.getByRole("button", { name: "下一頁", exact: true }).click();
  await expect(table(page)).toContainText("口服消炎藥");
  await table(page).getByRole("button", { name: "料號", exact: true }).click();
  await page.getByRole("button", { name: "上一頁", exact: true }).click();
  await expect(table(page).locator("tbody tr").first()).toContainText(
    "MED0006",
  );
  await page
    .getByRole("tab", { name: "自費／OTC／其他商品", exact: true })
    .click();
  await expect(table(page)).toContainText("OTC0006");
  await page.getByRole("textbox", { name: "搜尋品項" }).fill("不存在的商品");
  await expect(table(page)).toContainText("找不到符合條件的品項");
});

test("新增、重複料號與條碼、日期驗證及零庫存", async ({ page }) => {
  await createForm(page, "MED0001", "測試品項");
  await dialog(page)
    .getByRole("button", { name: "儲存品項", exact: true })
    .click();
  await expect(dialog(page).getByRole("alert")).toContainText("品項料號已存在");
  await page.locator("#item-code").fill("DEMO-NEW");
  await page.locator("#item-barcode").fill("4711234560000");
  await dialog(page)
    .getByRole("button", { name: "儲存品項", exact: true })
    .click();
  await expect(dialog(page).getByRole("alert")).toContainText("國際條碼已存在");
  await page.locator("#item-barcode").fill("001234567890");
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

test("修改可編輯欄位、鎖定交易設定、成本與庫存不變", async ({ page }) => {
  await page.getByRole("button", { name: "編輯人工淚液", exact: true }).click();
  await expect(page.locator("#item-code")).toHaveAttribute("readonly", "");
  await expect(page.locator("#item-unit")).toBeDisabled();
  await expect(
    dialog(page).getByRole("checkbox", { name: "管理效期" }),
  ).toBeDisabled();
  await page.locator("#item-name").fill("人工淚液新版");
  await page.locator("#item-safetyStock").fill("35");
  await page.locator("#item-referenceCost").fill("999");
  await dialog(page)
    .getByRole("button", { name: "儲存變更", exact: true })
    .click();
  const row = table(page)
    .locator("tbody tr")
    .filter({ hasText: "人工淚液新版" });
  await expect(row.locator("td").nth(6)).toHaveText("35");
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
  const expired = dialog(page)
    .locator("tbody tr")
    .filter({ hasText: "已過期" });
  await expect(expired).toHaveCount(1);
  await expect(expired.locator("td").nth(3)).toHaveText("10");
  await expect(expired.locator("td").nth(4)).toHaveText("0");
  await dialog(page)
    .getByRole("tab", { name: "庫存異動", exact: true })
    .click();
  await dialog(page)
    .getByLabel("異動類型", { exact: true })
    .selectOption("HIS_CONSUMPTION_OUT");
  await expect(dialog(page).locator("tbody tr")).toHaveCount(3);
  await expect(dialog(page).locator("table")).toContainText("-2");
  await dialog(page).getByLabel("批號", { exact: true }).fill("A011");
  await expect(dialog(page).locator("tbody tr")).toHaveCount(1);
});

test("停用確認後保留庫存及歷史，可重新啟用", async ({ page }) => {
  await page
    .getByRole("switch", { name: "啟用品項：人工淚液", exact: true })
    .click();
  await expect(dialog(page)).toContainText("此品項仍有庫存");
  await dialog(page).getByRole("button", { name: "確認停用" }).click();
  await expect(table(page)).not.toContainText("人工淚液");
  await page.locator("#items-filter-active").selectOption("inactive");
  await expect(table(page)).toContainText("人工淚液");
  await page.getByRole("button", { name: "查看人工淚液", exact: true }).click();
  await expect(dialog(page).locator(".items-stock-total")).toContainText("35");
  await expect(dialog(page).locator("tbody tr")).toHaveCount(3);
  await close(page);
  await page
    .getByRole("switch", { name: "啟用品項：人工淚液", exact: true })
    .click();
  await dialog(page).getByRole("button", { name: "確認啟用" }).click();
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
const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
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
  await expect(page).toHaveURL(/\/demo\/his/);
  if (mobile)
    await page
      .getByRole("button", { name: /功能選單|開啟選單|顯示選單/ })
      .click();
  await page.getByRole("button", { name: "品項資料維護", exact: true }).click();
  await expect(page).toHaveURL(/\/demo\/products/);
});


test(
  "/demo/items 直接進入與重新整理",
  { tag: "@critical" },
  async ({ page }, info) => {
    await checkPageEntry(page, "/demo/items", info);
  },
);
