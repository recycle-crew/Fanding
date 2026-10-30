import { test, expect } from "@playwright/test";

test("@critical 單位管理驗證、新增、停用與刪除", async ({ page }) => {
  await page.goto("/base-data");
  await page.getByRole("tab", { name: "單位管理", exact: true }).click();
  await page.getByRole("button", { name: "新增單位", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "儲存", exact: true }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await dialog.getByLabel("單位名稱").fill("瓶");
  await dialog.getByRole("button", { name: "儲存", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("已存在");
  await dialog.getByLabel("單位名稱").fill("測試支");
  await dialog.getByRole("button", { name: "儲存", exact: true }).click();
  await expect(dialog).toBeHidden();
  await page
    .getByRole("textbox", { name: "搜尋單位", exact: true })
    .fill("測試支");
  await page.getByRole("button", { name: "編輯測試支", exact: true }).click();
  await dialog.getByRole("switch", { name: "表單啟用狀態" }).click();
  await dialog.getByRole("button", { name: "儲存", exact: true }).click();
  await expect(
    page.getByRole("row").filter({ hasText: "測試支" }),
  ).toContainText("停用");
  await page.getByRole("button", { name: "編輯測試支", exact: true }).click();
  await dialog.getByRole("button", { name: "刪除此單位", exact: true }).click();
  await dialog.getByRole("button", { name: "確認刪除", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "編輯測試支", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("textbox", { name: "搜尋單位", exact: true }).fill("瓶");
  await page.getByRole("button", { name: "編輯瓶", exact: true }).click();
  await expect(
    dialog.getByText("此資料已被引用，無法刪除", { exact: false }),
  ).toBeVisible();
});

for (const module of ["items", "consumptions"] as const) {
  test(`@critical 新增單位即提供 ${module} 下拉選項`, async ({ page }) => {
    await page.goto("/base-data");
    await page.getByRole("tab", { name: "單位管理", exact: true }).click();
    await page.getByRole("button", { name: "新增單位", exact: true }).click();
    await page.getByRole("dialog").getByLabel("單位名稱").fill("共用測試支");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "儲存", exact: true })
      .click();
    const menu = page.getByRole("button", { name: "☰ 功能選單", exact: true });
    if (await menu.isVisible()) await menu.click();
    await page.locator(`[data-module="${module}"]`).click();
    if (module === "consumptions") {
      await page
        .getByRole("tab", { name: "HIS 藥品對照", exact: true })
        .click();
      await page.getByRole("button", { name: "新增對照", exact: true }).click();
      await page
        .getByLabel("HIS 單位", { exact: true })
        .selectOption("共用測試支");
      await expect(page.getByLabel("HIS 單位", { exact: true })).toHaveValue(
        "共用測試支",
      );
      return;
    }
    await page.getByRole("button", { name: "新增品項", exact: true }).click();
    await expect(
      page
        .locator("#item-unit")
        .getByRole("option", { name: "共用測試支", exact: true }),
    ).toHaveCount(1);
    await page.locator("#item-unit").selectOption("共用測試支");
    await expect(page.locator("#item-unit")).toHaveValue("共用測試支");
  });
}
