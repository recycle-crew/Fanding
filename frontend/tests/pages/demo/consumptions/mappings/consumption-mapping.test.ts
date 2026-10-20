import { test, expect, checkPageEntry } from "../../../../helpers/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/demo/consumptions");
  await expect(
    page.getByRole("heading", { name: "藥品耗用查詢", exact: true }),
  ).toBeVisible();
});
test("@critical 對照驗證、歷史快照、未儲存提醒、異常重試防重複", async ({
  page,
}) => {
  await page.getByRole("tab", { name: "HIS 藥品對照", exact: true }).click();
  await page.getByRole("button", { name: "新增對照", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("HIS 藥品代碼", { exact: true }).fill("HIS001");
  await dialog.getByLabel("HIS 藥品名稱", { exact: true }).fill("測試藥品");
  await dialog.getByLabel("HIS 單位", { exact: true }).fill("瓶");
  await dialog
    .getByLabel("本系統藥品", { exact: true })
    .selectOption({ label: "MED0001 人工淚液（瓶）" });
  await dialog.getByRole("button", { name: "儲存對照", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("不可重複");
  await dialog.getByLabel("HIS 藥品代碼", { exact: true }).fill("HIS-NEW");
  await dialog.getByLabel("換算比例", { exact: true }).fill("0");
  await dialog.getByRole("button", { name: "儲存對照", exact: true }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await dialog.getByLabel("換算比例", { exact: true }).fill("1");
  await dialog.getByRole("button", { name: "取消", exact: true }).click();
  await expect(dialog).toContainText("尚有未儲存變更");
  await dialog.getByRole("button", { name: "繼續編輯" }).click();
  await dialog.getByRole("button", { name: "儲存對照", exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole("tab", { name: "同步異常", exact: true }).click();
  await page
    .getByRole("button", { name: "查看異常 RX-ERROR-1", exact: true })
    .click();
  await dialog.getByRole("button", { name: "重新處理", exact: true }).click();
  await expect(dialog).toContainText("已解決");
  await expect(
    dialog.getByRole("button", { name: "重新處理", exact: true }),
  ).toBeDisabled();
  await dialog.getByRole("button", { name: "關閉視窗" }).click();
  await page.getByRole("tab", { name: "藥品耗用查詢", exact: true }).click();
  await page.getByRole("textbox", { name: "搜尋耗用資料" }).fill("RX-ERROR-1");
  await expect(page.locator("tbody tr:visible")).toHaveCount(1);
  await expect(page.locator("tbody tr:visible")).toContainText("人工淚液");
  await page.getByRole("tab", { name: "HIS 藥品對照", exact: true }).click();
  await page
    .getByRole("button", { name: "編輯對照 HIS001", exact: true })
    .click();
  await dialog.getByLabel("換算比例", { exact: true }).fill("7");
  await dialog.getByRole("button", { name: "儲存對照", exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole("tab", { name: "藥品耗用查詢", exact: true }).click();
  await page
    .getByRole("button", { name: "查看人工淚液耗用明細", exact: true })
    .click();
  await expect(dialog).toContainText("× 比例 1");
  await expect(dialog).not.toContainText("× 比例 7");
});

test(
  "/demo/consumptions/mappings 直接進入與重新整理",
  { tag: "@critical" },
  async ({ page }, info) => {
    await checkPageEntry(page, "/demo/consumptions/mappings", info);
  },
);
