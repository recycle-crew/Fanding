import { test, expect } from "@playwright/test";

test("/disposals 直接進入與重新整理", async ({ page }) => {
  await page.goto("/disposals");
  await expect(
    page.getByRole("heading", { name: "領用／報廢管理", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(
    (url) =>
      url.pathname === "/requisitions" &&
      url.searchParams.get("tab") === "disposal",
  );
  await expect(
    page.getByRole("heading", { name: "領用／報廢管理", exact: true }),
  ).toBeVisible();
});
test("@critical 過期批次報廢、原因驗證與扣帳", async ({ page }, testInfo) => {
  await page.goto("/disposals");
  await page.getByRole("button", { name: "新增報廢單", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await page.getByLabel("來源倉別", { exact: true }).selectOption("備用倉庫");
  await page
    .getByRole("combobox", { name: "經辦人", exact: true })
    .fill("EMP003");
  await page.getByRole("option", { name: /陳藥師/ }).click();
  await page
    .getByRole("combobox", { name: "搜尋品項", exact: true })
    .fill("4711234560008");
  await page.getByRole("option", { name: /隱形眼鏡保養液/ }).click();
  await page.getByLabel("第1筆批次", { exact: true }).selectOption("batch-8-2");
  await page.getByLabel("第1筆數量", { exact: true }).fill("2");
  await page.getByLabel("第1筆報廢原因", { exact: true }).selectOption("其他");
  await page.getByRole("button", { name: "儲存草稿", exact: true }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await page.getByLabel("第1筆報廢原因", { exact: true }).selectOption("過期");
  await page.screenshot({ path: testInfo.outputPath("disposal-form.png") });
  await page.getByRole("button", { name: "儲存草稿", exact: true }).click();
  await dialog.getByRole("button", { name: "確認出庫", exact: true }).click();
  await dialog.getByRole("button", { name: "確認出庫", exact: true }).click();
  await expect(dialog).toContainText("已確認");
  await expect(dialog).toContainText("報廢・A093・-2・異動後 4");
  await page.screenshot({
    path: testInfo.outputPath("disposal-confirmed.png"),
  });
  await dialog.getByRole("button", { name: "關閉", exact: true }).click();
  await expect(page.getByLabel("作業身分（展示）")).toHaveCount(0);
});
test("報廢草稿可刪除、未儲存變更可放棄、查詢無結果", async ({ page }) => {
  await page.goto("/disposals");
  await page.getByRole("button", { name: "新增報廢單", exact: true }).click();
  await page
    .getByRole("combobox", { name: "經辦人", exact: true })
    .fill("EMP003");
  await page.getByRole("option", { name: /陳藥師/ }).click();
  await page.getByRole("button", { name: "取消", exact: true }).click();
  await page.getByRole("button", { name: "放棄變更", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.getByRole("button", { name: "新增報廢單", exact: true }).click();
  await page.getByLabel("來源倉別", { exact: true }).selectOption("備用倉庫");
  await page
    .getByRole("combobox", { name: "經辦人", exact: true })
    .fill("EMP003");
  await page.getByRole("option", { name: /陳藥師/ }).click();
  await page
    .getByRole("combobox", { name: "搜尋品項", exact: true })
    .fill("4711234560008");
  await page.getByRole("option", { name: /隱形眼鏡保養液/ }).click();
  await page.getByLabel("第1筆批次", { exact: true }).selectOption("batch-8-2");
  await page.getByLabel("第1筆報廢原因", { exact: true }).selectOption("過期");
  await page.getByRole("button", { name: "儲存草稿", exact: true }).click();
  await page.getByRole("button", { name: "刪除草稿", exact: true }).click();
  await page.getByRole("button", { name: "確認刪除草稿", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("button", { name: /^查看DSP-/ })).toHaveCount(0);
  await page.getByLabel("關鍵字", { exact: true }).fill("不存在的單據");
  await expect(page.locator(".purchase-status-note")).toContainText("共 0 筆");
  await expect(
    page.getByRole("button", { name: "新增報廢單", exact: true }),
  ).toBeEnabled();
});
