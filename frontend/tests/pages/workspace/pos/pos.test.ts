import axe from "axe-core";
import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
  await page.goto("/pos");
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
async function checkout(page: Page) {
  await page.getByRole("button", { name: "前往結帳", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "確認完成結帳", exact: true })
    .click();
  await expect(
    dialog.getByRole("heading", { name: "銷售明細與交易憑證", exact: true }),
  ).toBeVisible();
  return dialog;
}
test("@critical 精簡結帳，非現金付款直接完成", async ({ page }) => {
  await scan(page, "OTC0001");
  await page.getByRole("button", { name: "前往結帳", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const submit = dialog.getByRole("button", {
    name: "確認完成結帳",
    exact: true,
  });
  await expect(dialog.getByRole("region", { name: "結帳金額" })).toContainText(
    "$355",
  );
  await expect(dialog.getByLabel("實收金額", { exact: true })).toHaveCount(0);
  await expect(dialog.getByText(/找零|展示失敗|折扣分攤/)).toHaveCount(0);
  await dialog.getByLabel("付款方式", { exact: true }).selectOption("刷卡");
  await expect(
    dialog.getByRole("checkbox", { name: /外部付款成功/ }),
  ).toHaveCount(0);
  await submit.click();
  await expect(
    dialog.getByRole("heading", { name: "銷售明細與交易憑證", exact: true }),
  ).toBeVisible();
  await expect(dialog).toContainText("葉黃素膠囊");
});

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
    page.getByRole("status").filter({ hasText: "無可用庫存" }),
  ).toBeVisible();
  await scan(page, "no-result");
  await expect(
    page.getByRole("status").filter({ hasText: "查無符合商品" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "清空", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "確認清空", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "銷售明細 0 項", exact: true }),
  ).toBeVisible();
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
  await expect(
    dialog
      .getByRole("table", { name: "已售商品明細", exact: true })
      .locator('[data-label="整單分攤"]'),
  ).toContainText("$3.01");
  await expect(dialog.getByText("批次與效期", { exact: true })).toHaveCount(0);
  await dialog.getByRole("button", { name: "銷售退貨", exact: true }).click();
  await dialog.getByLabel("葉黃素膠囊本次退貨數量", { exact: true }).fill("5");
  await dialog.getByLabel("退貨原因", { exact: true }).fill("客戶退回");
  await dialog
    .getByRole("checkbox", {
      name: "已收到實體退貨，確認不可售且不增加可用庫存（展示）",
      exact: true,
    })
    .check();
  await dialog.getByRole("button", { name: "建立退貨單", exact: true }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await dialog.getByLabel("葉黃素膠囊本次退貨數量", { exact: true }).fill("1");
  await dialog.getByRole("button", { name: "建立退貨單", exact: true }).click();
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
test("@critical 藥品刷卡結帳無需額外付款或專業確認勾選", async ({ page }) => {
  await scan(page, "MED0001");
  await page.getByRole("button", { name: "前往結帳", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("付款方式", { exact: true }).selectOption("刷卡");
  await expect(
    dialog.getByRole("checkbox", { name: /外部付款成功|專業人員確認藥品銷售/ }),
  ).toHaveCount(0);
  await dialog
    .getByRole("button", { name: "確認完成結帳", exact: true })
    .click();
  await expect(
    dialog.getByRole("heading", { name: "銷售明細與交易憑證", exact: true }),
  ).toBeVisible();
  await expect(dialog).toContainText("刷卡");
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
  await page.getByRole("tab", { name: "銷售紀錄", exact: true }).click();
  await page.getByLabel("銷售狀態", { exact: true }).selectOption("作廢");
  await expect(page.locator("tbody tr:visible")).toHaveCount(2);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /匯出 Excel/ }).click();
  expect((await download).suggestedFilename()).toMatch(/\.xlsx$/);
});
test("無障礙、取消保留購物車與桌面／手機畫面", async ({ page }, testInfo) => {
  async function audit() {
    await page.addScriptTag({ content: axe.source });
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
  await page.screenshot({ path: testInfo.outputPath("pos-checkout.png") });
  await expect(
    dialog.getByRole("button", { name: "確認完成結帳", exact: true }),
  ).toBeInViewport();
  await dialog.getByText("備註（選填）", { exact: true }).click();
  await dialog.getByLabel("銷售備註", { exact: true }).fill("尚未儲存");
  await dialog.getByRole("button", { name: "取消", exact: true }).click();
  await expect(dialog).toContainText("尚有未儲存變更");
  await dialog.getByRole("button", { name: "繼續編輯", exact: true }).click();
  await expect(dialog.getByLabel("銷售備註", { exact: true })).toHaveValue(
    "尚未儲存",
  );
  await page.keyboard.press("Escape");
  await dialog.getByRole("button", { name: "放棄變更", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "銷售明細 1 項", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBeTruthy();
});

test("/pos 直接進入與重新整理", { tag: "@critical" }, async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
  await page.goto("/pos");
  await expect(page.locator("#workspace")).toBeVisible();
  await expect(
    page.locator("#workspace").getByRole("heading").first(),
  ).not.toBeEmpty();
  await expect(page).toHaveURL((url) => url.pathname === "/pos");
  const entryURL = page.url();
  await page.reload();
  await expect(page).toHaveURL(entryURL);
  await expect(page.locator("#workspace").first()).toBeVisible();
});

test("@critical 表格式收銀、連續挑選商品與數量 Enter 接續掃碼", async ({
  page,
}, testInfo) => {
  await page.getByRole("button", { name: "挑選商品", exact: true }).click();
  const picker = page.getByRole("dialog");
  await expect(
    picker.getByRole("heading", { name: "挑選商品", exact: true }),
  ).toBeVisible();
  await picker
    .getByRole("button", { name: "加入葉黃素膠囊", exact: true })
    .click();
  await picker
    .getByRole("button", { name: "加入葉黃素膠囊", exact: true })
    .click();
  await picker
    .getByRole("button", { name: "加入隱形眼鏡保養液", exact: true })
    .click();
  await expect(picker).toContainText("本單已選 2 盒");
  await picker.getByRole("button", { name: "完成選品", exact: true }).click();
  const table = page.getByRole("table", { name: "銷售明細", exact: true });
  await expect(table.locator("tbody tr")).toHaveCount(2);
  if (testInfo.project.name === "desktop") {
    const lines = await page.locator(".pos-lines-wrap").boundingBox();
    const sheet = await page
      .getByRole("region", { name: "銷售單", exact: true })
      .boundingBox();
    const summary = await page
      .getByRole("region", { name: "結帳摘要", exact: true })
      .boundingBox();
    expect(lines!.height).toBeGreaterThan(400);
    expect(summary!.x).toBeGreaterThanOrEqual(sheet!.x + sheet!.width);
  }
  await expect(table.locator('[data-recent="true"]')).toContainText(
    "隱形眼鏡保養液",
  );
  const quantity = page.getByLabel("葉黃素膠囊數量", { exact: true });
  await expect(quantity).toHaveValue("2");
  await quantity.fill("3");
  await quantity.press("Enter");
  await expect(
    page.getByLabel("掃碼／搜尋商品", { exact: true }),
  ).toBeFocused();
  await expect(
    page.getByLabel("葉黃素膠囊成交單價", { exact: true }),
  ).toHaveAttribute("readonly", "");
  await page.getByLabel("展示角色", { exact: true }).selectOption("manager");
  await expect(table.getByText("批次與效期", { exact: true })).toHaveCount(0);
  await page.getByLabel("葉黃素膠囊單品折扣", { exact: true }).fill("5");
  await page.screenshot({
    path: testInfo.outputPath("pos-register.png"),
    fullPage: true,
  });
  if (testInfo.project.name === "desktop") {
    for (const width of [1024, 768, 320]) {
      await page.setViewportSize({ width, height: 900 });
      if (width === 320) {
        expect(
          (await page
            .getByLabel("整單折扣金額", { exact: true })
            .boundingBox())!.width,
        ).toBeGreaterThan(100);
        expect(
          (await page.locator(".pos-settlement .pos-amount").boundingBox())!
            .width,
        ).toBeGreaterThan(100);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
      ).toBeTruthy();
      await page.screenshot({
        path: testInfo.outputPath(`pos-register-${width}.png`),
        fullPage: true,
      });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBeTruthy();
  await page
    .getByRole("button", { name: "移除隱形眼鏡保養液", exact: true })
    .click();
  await expect(table.locator("tbody tr")).toHaveCount(1);
  await scan(page, "OTC");
  await expect(
    picker.getByRole("heading", { name: "挑選商品", exact: true }),
  ).toBeVisible();
  await picker.getByLabel("搜尋可選商品", { exact: true }).fill("no-result");
  await expect(
    picker.getByText("查無符合商品。", { exact: true }),
  ).toBeVisible();
  await picker.getByRole("button", { name: "完成選品", exact: true }).click();
  await expect(quantity).toHaveValue("3");
});

test("@critical 查單及返回保留購物車、顧客、折扣與主管角色", async ({
  page,
}, testInfo) => {
  await page.getByLabel("展示角色", { exact: true }).selectOption("manager");
  await scan(page, "OTC0001");
  await page.getByLabel("葉黃素膠囊數量", { exact: true }).fill("2");
  await page.getByLabel("整單折扣金額", { exact: true }).fill("10");
  await page.getByLabel("顧客", { exact: true }).selectOption("C001");
  const shortcuts = page.getByLabel("快速結帳", { exact: true });
  if (testInfo.project.name === "mobile") {
    await expect(
      shortcuts.getByRole("button", { name: "結帳", exact: true }),
    ).toBeInViewport();
    await shortcuts.getByRole("button", { name: "結帳", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("付款方式", { exact: true }).selectOption("刷卡");
    await expect(dialog.getByText(/找零/)).toHaveCount(0);
    await dialog.getByRole("button", { name: "取消", exact: true }).click();
    await dialog.getByRole("button", { name: "放棄變更", exact: true }).click();
  }
  const nav = page.getByRole("tablist", { name: "銷售工作區" });
  await nav.getByRole("tab", { name: "銷售紀錄", exact: true }).click();
  await expect(page).toHaveURL(/\/sales/);
  await expect(
    nav.getByRole("tab", { name: "銷售紀錄", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("tabpanel", { name: "銷售紀錄", exact: true }),
  ).toBeVisible();
  await expect(
    nav.getByRole("tab", { name: "銷售紀錄", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(
    nav.getByRole("tab", { name: "收銀（1 項未結帳）", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(
    nav.getByRole("tab", { name: "銷售紀錄", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "待退款（目前日期區間）", exact: true })
    .click();
  await expect(page.locator("tbody tr:visible")).toHaveCount(2);
  await nav
    .getByRole("tab", { name: "收銀（1 項未結帳）", exact: true })
    .click();
  await expect(page.getByLabel("葉黃素膠囊數量", { exact: true })).toHaveValue(
    "2",
  );
  await expect(page.getByLabel("整單折扣金額", { exact: true })).toHaveValue(
    "10",
  );
  await expect(page.getByLabel("顧客", { exact: true })).toHaveValue("C001");
  await expect(page.getByLabel("展示角色", { exact: true })).toHaveValue(
    "manager",
  );
  await nav.getByRole("tab", { name: "銷售紀錄", exact: true }).click();
  await expect(page.getByLabel("退款狀態", { exact: true })).toHaveValue(
    "待處理",
  );
  await page.screenshot({
    path: testInfo.outputPath("sales-refund-filter.png"),
    fullPage: true,
  });
});

test("@critical 無需 Enter 自動加入、避免重複成交與櫃檯折扣", async ({
  page,
}) => {
  const scanInput = page.getByLabel("掃碼／搜尋商品", { exact: true });
  await scanInput.fill("OTC000");
  await expect(
    page.getByRole("table", { name: "銷售明細" }).locator("tbody tr"),
  ).toContainText("尚未加入商品");
  await scanInput.fill("OTC0001");
  const quantity = page.getByLabel("葉黃素膠囊數量", { exact: true });
  await expect(quantity).toHaveValue("1");
  await expect(scanInput).toHaveValue("");
  await scanInput.press("Enter");
  await expect(quantity).toHaveValue("1");
  await scanInput.fill("OTC0001");
  await expect(quantity).toHaveValue("2");
  await expect(
    page.locator(".items-toast").filter({ hasText: "本單數量 2" }),
  ).toBeVisible();
  await expect(page.getByText("批次與效期", { exact: true })).toHaveCount(0);
  const discount = page.getByLabel("葉黃素膠囊單品折扣", { exact: true });
  await expect(discount).toBeEditable();
  await discount.fill("10");
  await page.getByLabel("整單折扣金額", { exact: true }).fill("5");
  await page.getByRole("button", { name: "前往結帳", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("region", { name: "結帳金額" })).toContainText(
    "$695",
  );
  await expect(dialog.getByText(/出庫批次/)).toHaveCount(0);
  await dialog
    .getByRole("button", { name: "確認完成結帳", exact: true })
    .click();
  await expect(
    dialog.getByRole("heading", { name: "銷售明細與交易憑證", exact: true }),
  ).toBeVisible();
  await expect(
    dialog.locator(".sale-detail-totals > div").filter({ hasText: "原成交" }),
  ).toContainText("$695");
});
