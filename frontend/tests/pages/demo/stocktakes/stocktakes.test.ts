import type { Page, Locator } from "@playwright/test";
import { test, expect, checkPageEntry } from "../../../helpers/test";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);


const axe = require.resolve("axe-core/axe.min.js");

test("盤點作業與核對直接連結及重新整理", { tag: "@critical" }, async ({ page }, info) => {
  await checkPageEntry(page, "/demo/stocktakes/ST1/count", info);
  await checkPageEntry(page, "/demo/stocktakes/ST2/review", info);
});
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
  await page.goto("/demo/stocktakes");
  await expect(
    page.getByRole("heading", { name: "盤點管理", exact: true }),
  ).toBeVisible();
});
const dialog = (page: Page) => page.getByRole("dialog");
test(
  "/demo/stocktakes 直接進入與重新整理",
  { tag: "@critical" },
  async ({ page }, info) => {
    await checkPageEntry(page, "/demo/stocktakes", info);
  },
);
async function openOrder(page: Page,  number = "001") {
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
  await modal.getByRole("checkbox", { name: "王小明", exact: true }).check();
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
  await page.getByLabel("展示身分", { exact: true }).selectOption("王小明");
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
  await page
    .getByRole("button", { name: "本人分區盤點完成", exact: true })
    .click();
  await page
    .getByLabel("展示身分", { exact: true })
    .selectOption("主管（展示）");
  await page.getByRole("button", { name: "關閉盤點", exact: true }).click();
  await checkAll(page);
  await modal
    .getByRole("button", { name: "確認關閉盤點", exact: true })
    .click();
  await expect(page).toHaveURL(/\/review$/);
  await expect(modal).toHaveCount(0);
  await page
    .getByRole("button", { name: "確認差異 OTC0001", exact: true })
    .click();
  await modal.getByRole("spinbutton").fill("-8");
  await checkAll(page);
  await modal
    .getByRole("button", { name: "儲存品項核對", exact: true })
    .click();
  await page.getByRole("button", { name: "確認展示調整", exact: true }).click();
  await checkAll(page);
  await modal
    .getByRole("button", { name: "確認完成展示調整", exact: true })
    .click();
  await expect(page.getByText(/STOCKTAKE_SHORTAGE_OUT/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "作廢盤點單", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "確認差異 OTC0001", exact: true }),
  ).toBeDisabled();
});
test("@critical 員工盲盤、本人紀錄、累加與主管無效原因", async ({ page }) => {
  await page.getByLabel("展示身分", { exact: true }).selectOption("王小明");
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
    .getByLabel("展示身分", { exact: true })
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
  await page
    .getByRole("button", { name: "指派複盤 MED0001", exact: true })
    .click();
  const modal = dialog(page);
  await modal.getByLabel("複盤原因", { exact: true }).fill("差異複查");
  await modal
    .getByRole("button", { name: "建立複盤任務", exact: true })
    .click();
  await page.getByLabel("展示身分", { exact: true }).selectOption("王小明");
  await expect(
    page.getByRole("columnheader", { name: "預期數量", exact: true }),
  ).toHaveCount(0);
  await scan(page, "MED0001", 14);
  await page.getByRole("button", { name: "確認登錄", exact: true }).click();
  await page
    .getByRole("button", { name: "提交第 2 輪複盤", exact: true })
    .click();
  await page
    .getByLabel("展示身分", { exact: true })
    .selectOption("主管（展示）");
  await page
    .getByRole("button", { name: "選擇輪次 MED0001", exact: true })
    .click();
  await modal.getByLabel("最終採用輪次", { exact: true }).selectOption("2");
  await modal.getByLabel("採用輪次原因", { exact: true }).fill("複盤確認");
  await modal.getByRole("button", { name: "採用此輪次", exact: true }).click();
  await expect(
    page.locator("tbody tr:visible").first().locator("td").nth(8),
  ).toHaveText("14");
  await expect(
    page.locator("tbody tr:visible").first().locator("td").nth(9),
  ).toHaveText("-1");
  await page
    .getByRole("button", { name: "確認差異 MED0001", exact: true })
    .click();
  await checkAll(page);
  await modal
    .getByRole("button", { name: "儲存品項核對", exact: true })
    .click();
  await expect(modal.getByRole("alert")).toContainText("批次差異");
  await modal.getByRole("spinbutton").fill("-1");
  await modal
    .getByRole("button", { name: "儲存品項核對", exact: true })
    .click();
  await page.getByRole("button", { name: "確認展示調整", exact: true }).click();
  await checkAll(page);
  await modal
    .getByRole("button", { name: "確認完成展示調整", exact: true })
    .click();
  await expect(page.getByText(/STOCKTAKE_SHORTAGE_OUT/)).toBeVisible();
});
test("@critical 關閉未完成阻擋、作廢原因、搜尋與主管匯出", async ({ page }) => {
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /匯出 Excel/ }).click();
  expect((await download).suggestedFilename()).toMatch(/\.xlsx$/);
  await page
    .getByRole("textbox", { name: "搜尋盤點單", exact: true })
    .fill("NO-RESULT");
  await expect(page.getByText("目前沒有符合的資料")).toBeVisible();
  await page.getByRole("button", { name: "清除", exact: true }).click();
  await openOrder(page);
  await page.getByRole("button", { name: "關閉盤點", exact: true }).click();
  const modal = dialog(page);
  await checkAll(page);
  await modal
    .getByRole("button", { name: "確認關閉盤點", exact: true })
    .click();
  await expect(modal.getByRole("alert")).toContainText("未確認完成");
  await modal.getByRole("button", { name: "取消", exact: true }).click();
  await modal.getByRole("button", { name: "放棄變更", exact: true }).click();
  await page.getByRole("button", { name: "作廢盤點單", exact: true }).click();
  await modal.getByLabel("作廢原因", { exact: true }).fill("重排分工");
  await modal
    .getByRole("button", { name: "確認作廢盤點", exact: true })
    .click();
  await expect(page).toHaveURL(/\/stocktakes$/);
  await page.getByLabel("盤點狀態", { exact: true }).selectOption("已作廢");
  await expect(page.locator("tbody tr:visible")).toHaveCount(2);
});
test("無障礙、未儲存提醒、桌面與手機版面", async ({ page }, testInfo) => {
  async function audit() {
    await page.addScriptTag({ path: axe });
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
  await page.getByLabel("展示身分", { exact: true }).selectOption("王小明");
  await audit();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBeTruthy();
});

