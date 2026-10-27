import axe from "axe-core";
import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

test("@critical 盤點必填標示與範圍漏選阻擋、補齊建立", async ({ page }) => {
  await page.getByRole("button", { name: "新增盤點單", exact: true }).click();
  const modal = page.getByRole("dialog");
  const submit = modal.getByRole("button", { name: "建立盤點單", exact: true });
  await expect(modal.getByText("指派盤點人員")).toHaveCount(0);
  await expect(
    modal.getByRole("heading", { name: "2. 盤點範圍" }),
  ).toBeVisible();
  await submit.click();
  await expect(modal.getByRole("alert")).toContainText("盤點名稱");
  await modal.getByLabel("盤點名稱", { exact: true }).fill("必填盤點測試");
  await modal.getByLabel("盤點日期", { exact: true }).fill("");
  await submit.click();
  await expect(modal.getByRole("alert")).toContainText("盤點日期");
  await modal.getByLabel("盤點日期", { exact: true }).fill("2026-10-20");
  await submit.click();
  await expect(modal.getByRole("alert")).toContainText("至少選擇一項盤點品項");
  await expect(page).toHaveURL(/\/stocktakes$/);
  const available = modal.getByLabel("可選盤點品項");
  await expect(
    available.getByRole("checkbox", { name: /MED0005/ }),
  ).toHaveCount(0);
  await modal.getByLabel("搜尋盤點範圍", { exact: true }).fill("MED0005");
  await expect(
    modal
      .getByLabel("此倉無庫存紀錄的搜尋結果")
      .getByRole("checkbox", { name: /MED0005/ }),
  ).toBeDisabled();
  await modal.getByLabel("搜尋盤點範圍", { exact: true }).fill("OTC0001");
  await expect(
    available.getByRole("checkbox", { name: /OTC0001/ }),
  ).toBeEnabled();
  await modal
    .getByRole("checkbox", { name: "OTC0001 葉黃素膠囊（盒）", exact: true })
    .check();
  await expect(modal.getByLabel("已選盤點品項")).toContainText("葉黃素膠囊");
  await expect(modal.getByRole("status")).toContainText("預計盤點 1 項");
  await submit.click();
  await expect(modal).toBeHidden();
  await expect(page).toHaveURL(/\/stocktakes\/[^/]+\/count$/);
  await expect(
    page.getByText("必填盤點測試", { exact: false }).first(),
  ).toBeVisible();
});

test("切換倉別清除已選品項，並預覽全盤範圍", async ({ page }, testInfo) => {
  await page.getByRole("button", { name: "新增盤點單", exact: true }).click();
  const modal = dialog(page);
  await modal
    .getByRole("checkbox", { name: "OTC0001 葉黃素膠囊（盒）", exact: true })
    .check();
  await expect(modal.getByLabel("已選盤點品項")).toContainText("葉黃素膠囊");
  await page.screenshot({
    path: testInfo.outputPath("new-stocktake-modal.png"),
    fullPage: true,
  });
  await modal.getByLabel("盤點倉別", { exact: true }).selectOption("診間倉庫");
  await expect(modal.getByLabel("已選盤點品項")).toContainText("尚未選擇品項");
  await expect(modal.getByRole("status")).toContainText("預計盤點 0 項");
  await modal.getByLabel("搜尋盤點範圍", { exact: true }).fill("OTC0001");
  await expect(
    modal
      .getByLabel("此倉無庫存紀錄的搜尋結果")
      .getByRole("checkbox", { name: /OTC0001/ }),
  ).toBeDisabled();
  await page.screenshot({
    path: testInfo.outputPath("unavailable-stocktake-item.png"),
    fullPage: true,
  });
  await modal.getByLabel("盤點類型", { exact: true }).selectOption("全盤");
  await expect(
    modal.getByText(/診間倉庫目前有 \d+ 項商品有庫存紀錄/),
  ).toBeVisible();
  await expect(modal.getByRole("status")).toContainText("全盤");
});

test(
  "盤點作業與核對直接連結及重新整理",
  { tag: "@critical" },
  async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
    await page.goto("/stocktakes/ST1/count");
    await expect(page.locator("#workspace")).toBeVisible();
    await expect(
      page.locator("#workspace").getByRole("heading").first(),
    ).not.toBeEmpty();
    await expect(page).toHaveURL(
      (url) => url.pathname === "/stocktakes/ST1/count",
    );
    const entryURL = page.url();
    await page.reload();
    await expect(page).toHaveURL(entryURL);
    await expect(page.locator("#workspace").first()).toBeVisible();
    await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
    await page.goto("/stocktakes/ST2/review");
    await expect(page.locator("#workspace")).toBeVisible();
    await expect(
      page.locator("#workspace").getByRole("heading").first(),
    ).not.toBeEmpty();
    await expect(page).toHaveURL(
      (url) => url.pathname === "/stocktakes/ST2/review",
    );
    const entryURL2 = page.url();
    await page.reload();
    await expect(page).toHaveURL(entryURL2);
    await expect(page.locator("#workspace").first()).toBeVisible();
  },
);
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
  await page.goto("/stocktakes");
  await expect(
    page.getByRole("heading", { name: "盤點管理", exact: true }),
  ).toBeVisible();
});
const dialog = (page: Page) => page.getByRole("dialog");
test(
  "/stocktakes 直接進入與重新整理",
  { tag: "@critical" },
  async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
    await page.goto("/stocktakes");
    await expect(page.locator("#workspace")).toBeVisible();
    await expect(
      page.locator("#workspace").getByRole("heading").first(),
    ).not.toBeEmpty();
    await expect(page).toHaveURL((url) => url.pathname === "/stocktakes");
    const entryURL3 = page.url();
    await page.reload();
    await expect(page).toHaveURL(entryURL3);
    await expect(page.locator("#workspace").first()).toBeVisible();
  },
);
async function openOrder(page: Page, number = "001") {
  await page
    .getByRole("button", { name: `開啟盤點 ST20261020-${number}`, exact: true })
    .click();
}
async function checkAll(page: Page) {
  const checks = dialog(page).getByRole("checkbox");
  for (let index = 0; index < (await checks.count()); index++)
    await checks.nth(index).check();
}
async function scan(page: Page, code: string, quantity: number) {
  const input = page.getByRole("textbox", {
    name: "掃碼／搜尋盤點商品",
    exact: true,
  });
  await input.fill(code);
  await input.press("Enter");
  await page.getByLabel("本次盤點數量", { exact: true }).fill(String(quantity));
}
test("@critical 建立、衝突阻擋、明確零值、關閉核對與完成鎖定", async ({
  page,
}) => {
  await page.getByRole("button", { name: "新增盤點單", exact: true }).click();
  const modal = dialog(page);
  await modal.getByLabel("盤點名稱", { exact: true }).fill("展示零庫存盤點");
  await modal
    .getByRole("checkbox", { name: "MED0001 人工淚液（瓶）", exact: true })
    .check();
  await modal.getByRole("button", { name: "建立盤點單", exact: true }).click();
  await expect(modal.getByRole("alert")).toContainText("已有盤點");
  await modal
    .getByRole("checkbox", { name: "MED0001 人工淚液（瓶）", exact: true })
    .uncheck();
  await modal
    .getByRole("checkbox", { name: "OTC0001 葉黃素膠囊（盒）", exact: true })
    .check();
  await modal.getByRole("button", { name: "建立盤點單", exact: true }).click();
  await expect(modal).toBeHidden();
  await expect(page).toHaveURL(/\/stocktakes\/[^/]+\/count$/);
  await page.getByLabel("預覽角色", { exact: true }).selectOption("王小明");
  const input = page.getByRole("textbox", {
    name: "掃碼／搜尋盤點商品",
    exact: true,
  });
  await input.fill("OTC0001");
  await input.press("Enter");
  await page
    .getByRole("checkbox", {
      name: "已現場確認此品項實盤為零（明確零值紀錄）",
      exact: true,
    })
    .check();
  await page.getByRole("button", { name: "確認登錄", exact: true }).click();
  await expect(page.getByText("確認為零", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "輸入人員" }),
  ).toBeVisible();
  await expect(page.locator("tbody")).toContainText("王小明");
  await page
    .getByLabel("預覽角色", { exact: true })
    .selectOption("主管（展示）");
  await page
    .getByRole("button", { name: "結束初盤，送交核對", exact: true })
    .click();
  await checkAll(page);
  await modal
    .getByRole("button", { name: "確認結束初盤", exact: true })
    .click();
  await expect(page).toHaveURL(/\/review$/);
  await expect(modal).toHaveCount(0);
  await page.getByRole("button", { name: "確認品項", exact: true }).click();
  await modal.getByRole("spinbutton").fill("-8");
  await checkAll(page);
  await modal
    .getByRole("button", { name: "儲存品項核對", exact: true })
    .click();
  await page.getByRole("button", { name: "確認盤點結果", exact: true }).click();
  await checkAll(page);
  await modal
    .getByRole("button", { name: "確認盤點結果", exact: true })
    .click();
  await expect(page.getByText(/STOCKTAKE_SHORTAGE_OUT/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "作廢盤點單", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "確認品項", exact: true }),
  ).toHaveCount(0);
});
test("@critical 員工盲盤、本人紀錄、累加與主管無效原因", async ({ page }) => {
  await page.getByLabel("預覽角色", { exact: true }).selectOption("王小明");
  await expect(
    page.getByRole("button", { name: "新增盤點單", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: /匯出 Excel/ })).toHaveCount(0);
  await openOrder(page);
  await expect(
    page.getByRole("columnheader", { name: "預期數量", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("tbody")).not.toContainText("李護理師");
  await expect(
    page.getByRole("columnheader", { name: "批號", exact: true }),
  ).toHaveCount(0);
  await scan(page, "MED0003", 2);
  await page.getByRole("button", { name: "確認登錄", exact: true }).click();
  await scan(page, "MED0003", 3);
  await page.getByRole("button", { name: "確認登錄", exact: true }).click();
  await expect(page.getByText(/本人各輪累計/)).toContainText(
    "抗生素眼藥水 第 1 輪 5 瓶",
  );
  await page
    .getByLabel("預覽角色", { exact: true })
    .selectOption("主管（展示）");
  await page.getByRole("button", { name: /^標記無效 COUNTST1-1$/ }).click();
  const modal = dialog(page);
  await modal.getByLabel("無效原因", { exact: true }).fill("數字誤植");
  await modal
    .getByRole("button", { name: "確認標記無效", exact: true })
    .click();
  await expect(page.locator("tbody")).toContainText("無效：數字誤植");
});
test("@critical 複盤獨立輪次、主管採用、批次確認與調整", async ({ page }) => {
  await openOrder(page, "002");
  await page.getByRole("button", { name: "發起複盤", exact: true }).click();
  const modal = dialog(page);
  await modal.getByLabel("複盤原因", { exact: true }).fill("差異複查");
  await modal
    .getByRole("button", { name: "建立複盤任務", exact: true })
    .click();
  await page.getByLabel("預覽角色", { exact: true }).selectOption("王小明");
  await expect(
    page.getByRole("columnheader", { name: "預期數量", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "提交第 2 輪複盤", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "開始第 1 次複盤", exact: true })
    .click();
  await page.getByLabel("本次盤點數量", { exact: true }).fill("14");
  await page.getByRole("button", { name: "確認登錄", exact: true }).click();
  await page
    .getByRole("button", { name: "提交第 2 輪複盤", exact: true })
    .click();
  await page
    .getByLabel("預覽角色", { exact: true })
    .selectOption("主管（展示）");
  await page
    .getByRole("button", { name: "比較與採用結果", exact: true })
    .click();
  await expect(modal.getByLabel("各次盤點結果比較")).toContainText("王小明");
  await expect(modal.getByLabel("採用結果", { exact: true })).toHaveValue("2");
  await modal.getByLabel("採用原因", { exact: true }).fill("複盤確認");
  await modal
    .getByRole("button", { name: "確認採用結果", exact: true })
    .click();
  const reviewItem =
    test.info().project.name === "mobile"
      ? page.locator(".stocktake-review-item").first()
      : page.locator(".stocktake-review-table tbody tr:visible").first();
  await expect(reviewItem).toContainText("14");
  await expect(reviewItem).toContainText("-1 盤虧");
  await page.getByRole("button", { name: "確認品項", exact: true }).click();
  await checkAll(page);
  await modal
    .getByRole("button", { name: "儲存品項核對", exact: true })
    .click();
  await expect(modal.getByRole("alert")).toContainText("批次差異");
  await modal.getByRole("spinbutton").fill("-1");
  await expect(modal.getByRole("status")).toContainText("已分配完成");
  await modal
    .getByRole("button", { name: "儲存品項核對", exact: true })
    .click();
  await page.getByRole("button", { name: "確認盤點結果", exact: true }).click();
  await checkAll(page);
  await modal
    .getByRole("button", { name: "確認盤點結果", exact: true })
    .click();
  await expect(page.getByText(/STOCKTAKE_SHORTAGE_OUT/)).toBeVisible();
});
test("@critical 未盤品項阻擋關閉、作廢原因、搜尋與主管匯出", async ({
  page,
}) => {
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /匯出 Excel/ }).click();
  expect((await download).suggestedFilename()).toMatch(/\.xlsx$/);
  await page
    .getByRole("textbox", { name: "搜尋盤點單", exact: true })
    .fill("NO-RESULT");
  await expect(page.getByText("目前沒有符合的資料")).toBeVisible();
  await page.getByRole("button", { name: "清除", exact: true }).click();
  await openOrder(page);
  await page
    .getByRole("button", { name: "結束初盤，送交核對", exact: true })
    .click();
  const modal = dialog(page);
  await checkAll(page);
  await modal
    .getByRole("button", { name: "確認結束初盤", exact: true })
    .click();
  await expect(modal.getByRole("alert")).toContainText("未盤點品項");
  await modal.getByRole("button", { name: "取消", exact: true }).click();
  await modal.getByRole("button", { name: "放棄變更", exact: true }).click();
  await page.getByRole("button", { name: "作廢盤點單", exact: true }).click();
  await modal.getByLabel("作廢原因", { exact: true }).fill("重排分工");
  await modal
    .getByRole("button", { name: "確認作廢盤點", exact: true })
    .click();
  await expect(page).toHaveURL(/\/stocktakes$/);
  await page.getByRole("tab", { name: /已作廢（/ }).click();
  await expect(page.locator("tbody tr:visible")).toHaveCount(2);
});
test("無障礙、未儲存提醒、桌面與手機版面", async ({ page }, testInfo) => {
  async function audit() {
    await page.addScriptTag({ content: axe.source });
    expect(
      await page.evaluate(
        async () =>
          (
            await window.axe.run(
              document.querySelector('[role="dialog"]') ||
                document.querySelector(".stocktakes-page"),
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
  await page.screenshot({ path: testInfo.outputPath("stocktakes-list.png") });
  await page.getByRole("button", { name: "新增盤點單", exact: true }).click();
  const modal = dialog(page);
  await audit();
  await expect(
    modal.getByRole("button", { name: "建立盤點單", exact: true }),
  ).toBeInViewport();
  await modal.getByLabel("盤點名稱", { exact: true }).fill("未儲存");
  await page.keyboard.press("Escape");
  await expect(modal).toContainText("尚有未儲存變更");
  await modal.getByRole("button", { name: "放棄變更", exact: true }).click();
  await openOrder(page, "002");
  await audit();
  await page.screenshot({ path: testInfo.outputPath("stocktakes-review.png") });
  await page.getByLabel("預覽角色", { exact: true }).selectOption("王小明");
  await audit();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBeTruthy();
});

test("新版盤點流程與核對篩選", async ({ page }, testInfo) => {
  await page.goto("/stocktakes/ST1/count");
  await expect(page.getByLabel("盤點流程與進度")).toContainText(
    "盤點人員清點品項",
  );
  await expect(page.getByText("人員分工與進度")).toHaveCount(0);
  await page.getByLabel("預覽角色", { exact: true }).selectOption("王小明");
  await expect(
    page.getByRole("textbox", { name: "掃碼／搜尋盤點商品" }),
  ).toBeEnabled();
  await page.goto("/stocktakes/ST2/review");
  await page
    .getByLabel("預覽角色", { exact: true })
    .selectOption({ label: "主管（展示）" });
  const summary = page.getByLabel("核對待辦摘要");
  await expect(
    summary.getByRole("button", { name: "待核對 1 項" }),
  ).toBeVisible();
  await expect(page.getByLabel("核對篩選", { exact: true })).toHaveValue(
    "unconfirmed",
  );
  await expect(
    page.getByRole("button", { name: "確認盤點結果", exact: true }),
  ).toBeDisabled();
  await expect(page.locator("#stocktake-review-blockers")).toContainText(
    "1 項尚未確認品項結果",
  );
  await expect(
    page.getByRole("status").filter({ hasText: "符合" }),
  ).toContainText("符合 1／1 項");
  await expect(
    page.getByRole("button", { name: "確認品項", exact: true }).first(),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("stocktake-review-active.png"),
    fullPage: true,
  });
  if (test.info().project.name === "mobile") {
    await expect(page.locator(".stocktake-review-cards")).toBeVisible();
    await expect(
      page.locator(".stocktake-review-table .table-wrap"),
    ).toBeHidden();
  }
  await page.getByLabel("核對篩選", { exact: true }).selectOption("variance");
  await expect(
    page.getByRole("status").filter({ hasText: "符合" }),
  ).toContainText("符合 1／1 項");
  await expect(
    page.getByRole("button", { name: "主管差異核對", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel("盤點流程與進度")).toHaveCount(0);
  await expect(
    page
      .getByLabel("核對篩選", { exact: true })
      .locator('option[value="uncounted"]'),
  ).toHaveCount(0);
  await page.getByLabel("核對篩選", { exact: true }).selectOption("gain");
  await expect(
    page.getByRole("status").filter({ hasText: "符合" }),
  ).toContainText("符合 0／1 項");
  await page.goto("/stocktakes/ST3/review");
  await expect(page.getByLabel("盤點結果摘要")).toContainText("相符 1 項");
  await page.screenshot({
    path: `./.artifacts/stocktake-preview-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test("完整核對範例可搜尋品項並比較初盤與複盤", async ({ page }, testInfo) => {
  await page.goto("/stocktakes/ST5/review");
  await expect(
    page.getByRole("heading", { name: "差異核對流程範例" }),
  ).toBeVisible();
  await expect(page.getByLabel("核對待辦摘要")).toContainText("待複盤");
  await page.getByLabel("搜尋品項", { exact: true }).fill("MED0004");
  await expect(
    page.getByRole("status").filter({ hasText: "符合" }),
  ).toContainText("符合 1／4 項");
  await page
    .getByRole("button", { name: "比較與採用結果", exact: true })
    .click();
  const modal = dialog(page);
  await expect(
    modal.getByLabel("各次盤點結果比較").locator("article"),
  ).toHaveCount(2);
  await expect(modal.getByLabel("各次盤點結果比較")).toContainText(
    "初盤（目前採用）",
  );
  await expect(modal.getByLabel("採用結果", { exact: true })).toHaveValue("2");
  await page.screenshot({
    path: testInfo.outputPath("stocktake-result-comparison.png"),
    fullPage: true,
  });
});

test("盤點主介面狀態頁籤、搜尋與清除", async ({ page }) => {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual((page.viewportSize()?.width || 0) + 1);
  const tabs = page.getByRole("tablist", { name: "盤點狀態", exact: true });
  await expect(
    tabs.getByRole("tab", { name: "全部（5）", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await tabs.getByRole("tab", { name: "待核對（2）", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "開啟盤點 ST20261020-002", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "開啟盤點 ST20261020-001", exact: true }),
  ).toHaveCount(0);
  await expect(
    tabs.getByRole("tab", { name: "盤點中（1）", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "搜尋盤點單", exact: true })
    .fill("不存在的單號");
  await expect(page.getByText("目前沒有符合的資料")).toBeVisible();
  await page.getByRole("button", { name: "清除", exact: true }).click();
  await expect(
    tabs.getByRole("tab", { name: "全部（5）", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("textbox", { name: "搜尋盤點單", exact: true }),
  ).toHaveValue("");
  await tabs.getByRole("tab", { name: "全部（5）", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    tabs.getByRole("tab", { name: "盤點中（1）", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.getByRole("button", { name: "清除", exact: true }).click();
  await page.screenshot({
    path: `./.artifacts/stocktake-home-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test("主列表依盤點階段呈現進度與下一步", async ({ page }) => {
  const rows = page.getByRole("table").first().locator("tbody tr");
  await expect(rows.first()).toContainText("ST20261020-002");
  const counting = rows.filter({ hasText: "ST20261020-001" });
  await expect(counting).toContainText("已登錄 2／3 項");
  await expect(counting).toContainText("尚有 1 項未登錄");
  await expect(rows.filter({ hasText: "ST20261020-002" })).toContainText(
    "已核對 0／1 項",
  );
  await expect(rows.filter({ hasText: "ST20261020-003" })).toContainText(
    "查看結果",
  );
  await expect(rows.filter({ hasText: "ST20261020-004" })).toContainText(
    "查看作廢紀錄",
  );
  await page.getByLabel("預覽角色", { exact: true }).selectOption("王小明");
  await expect(
    page.getByRole("columnheader", { name: "我的進度", exact: true }),
  ).toBeVisible();
  await expect(counting).toContainText("本人已登錄 2 項");
  await expect(counting).not.toContainText("李護理師");
  await expect(
    page.getByRole("columnheader", { name: "下一步", exact: true }),
  ).toHaveCount(1);
});
