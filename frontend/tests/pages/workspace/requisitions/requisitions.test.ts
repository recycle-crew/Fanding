import { test, expect, type Page } from "@playwright/test";

async function navigate(page: Page, module: string) {
  const menu = page.getByRole("button", { name: "☰ 功能選單", exact: true });
  if (await menu.isVisible()) await menu.click();
  await page.locator(`[data-module="${module}"]`).click();
}
async function releaseMainWarehouse(page: Page) {
  await page.goto("/stocktakes/ST1/count");
  await page.getByRole("button", { name: "作廢盤點單", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("作廢原因", { exact: true })
    .fill("測試領用前結束盤點");
  await dialog
    .getByRole("button", { name: "確認作廢盤點", exact: true })
    .click();
  await expect(dialog).toBeHidden();
  await navigate(page, "stocktakes");
  await page
    .getByRole("row")
    .filter({ hasText: "差異核對流程範例" })
    .getByRole("button")
    .click();
  await page.getByRole("button", { name: "作廢盤點單", exact: true }).click();
  await dialog
    .getByLabel("作廢原因", { exact: true })
    .fill("測試領用前結束待核對盤點");
  await dialog
    .getByRole("button", { name: "確認作廢盤點", exact: true })
    .click();
  await expect(dialog).toBeHidden();
  await navigate(page, "requisitions");
}
async function fillDraft(page: Page) {
  await page.getByRole("button", { name: "新增領用單", exact: true }).click();
  await page.getByLabel("來源倉別", { exact: true }).selectOption("主倉庫");
  await page
    .getByRole("combobox", { name: "領用人", exact: true })
    .fill("EMP002");
  await page.getByRole("option", { name: /李護理師/ }).click();
  await page.getByLabel("部門／用途", { exact: true }).fill("護理作業");
  await page
    .getByRole("combobox", { name: "搜尋品項", exact: true })
    .fill("GLS0001");
  await page.getByRole("option", { name: /隱形眼鏡保養液/ }).click();
  await page.getByLabel("第1筆數量", { exact: true }).fill("2");
}
test("/requisitions 直接進入與重新整理", async ({ page }) => {
  await page.goto("/requisitions");
  await expect(
    page.getByRole("heading", { name: "領用／報廢管理", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL((url) => url.pathname === "/requisitions");
  await expect(
    page.getByRole("heading", { name: "領用／報廢管理", exact: true }),
  ).toBeVisible();
});

test("@critical 搜尋人員及品項、鍵盤選取、無結果、儲存後回填", async ({
  page,
}, testInfo) => {
  await page.goto("/requisitions");
  await expect(page.getByLabel("作業身分（展示）")).toHaveCount(0);
  await page.getByRole("button", { name: "新增領用單", exact: true }).click();
  await expect(page.getByText("依效期自動分配", { exact: true })).toHaveCount(
    0,
  );
  await page.getByLabel("來源倉別", { exact: true }).selectOption("主倉庫");
  const person = page.getByRole("combobox", { name: "領用人", exact: true });
  await person.fill("護理部");
  await expect(page.getByRole("option", { name: /李護理師/ })).toBeVisible();
  await person.press("ArrowDown");
  await page.screenshot({ path: testInfo.outputPath("personnel-search.png") });
  await person.press("Escape");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(person).toHaveAttribute("aria-expanded", "false");
  await person.fill("EMP002");
  await person.press("Enter");
  await expect(person).toHaveValue("李護理師");
  await page.getByLabel("部門／用途", { exact: true }).fill("護理作業");
  const search = page.getByRole("combobox", { name: "搜尋品項", exact: true });
  await search.fill("不存在的品項");
  await expect(
    page.getByText("此倉別沒有符合的可用品項", { exact: true }),
  ).toBeVisible();
  await search.fill("隱形眼鏡");
  await page.getByRole("option", { name: /隱形眼鏡保養液/ }).click();
  await expect(page.locator(".items-editor-section")).toHaveCount(1);
  await page.getByRole("button", { name: "移除第1筆", exact: true }).click();
  await search.fill("4711234560008");
  await search.press("Enter");
  await expect(page.locator(".items-editor-section")).toContainText("GLS0001");
  await person.fill("未登錄人員");
  await page.getByRole("button", { name: "儲存草稿", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "選擇有效人員",
  );
  await person.fill("EMP002");
  await person.press("Enter");
  await page.getByRole("button", { name: "儲存草稿", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("李護理師");
  await page.getByRole("button", { name: "編輯草稿", exact: true }).click();
  await expect(person).toHaveValue("李護理師");
  await expect(page.locator(".items-editor-section")).toContainText(
    "隱形眼鏡保養液",
  );
});
test("@critical 同一路由分頁切換、重新整理及上一頁保留類型", async ({
  page,
}, testInfo) => {
  await page.goto("/requisitions?embed=1");
  await expect(page.locator('[data-module="requisitions"]')).toHaveCount(1);
  await expect(page.locator('[data-module="disposals"]')).toHaveCount(0);
  const requisitionTab = page.getByRole("tab", { name: "領用", exact: true });
  const disposalTab = page.getByRole("tab", { name: "報廢", exact: true });
  await expect(requisitionTab).toHaveAttribute("aria-selected", "true");
  await disposalTab.click();
  await expect(page).toHaveURL(
    (url) =>
      url.pathname === "/requisitions" &&
      url.searchParams.get("tab") === "disposal" &&
      url.searchParams.get("embed") === "1",
  );
  await expect(disposalTab).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("button", { name: "新增報廢單", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(disposalTab).toHaveAttribute("aria-selected", "true");
  await page.screenshot({
    path: testInfo.outputPath("inventory-document-tabs.png"),
    fullPage: true,
  });
  await requisitionTab.click();
  await expect(
    page.getByRole("button", { name: "新增領用單", exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(disposalTab).toHaveAttribute("aria-selected", "true");
});

test("@critical 領用草稿、確認扣庫及跨模組庫存", async ({ page }, testInfo) => {
  await releaseMainWarehouse(page);
  await fillDraft(page);
  await page.getByRole("button", { name: "儲存草稿", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("草稿");
  await dialog.getByRole("button", { name: "確認出庫", exact: true }).click();
  await expect(dialog).toContainText("隱形眼鏡保養液");
  await dialog.getByRole("button", { name: "確認出庫", exact: true }).click();
  await expect(dialog).toContainText("已確認");
  await expect(dialog).toContainText("領用・A091・-2・異動後 30");
  await expect(dialog.getByRole("button", { name: "編輯草稿" })).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("requisition-confirmed.png"),
  });
  await dialog.getByRole("button", { name: "關閉", exact: true }).click();
  await page.getByRole("tab", { name: "報廢", exact: true }).click();
  await expect(page.getByRole("button", { name: /^查看REQ-/ })).toHaveCount(0);
  await page.getByRole("tab", { name: "領用", exact: true }).click();
  await expect(page.getByRole("button", { name: /^查看REQ-/ })).toHaveCount(1);
  await navigate(page, "items");
  await page.getByRole("tab", { name: "眼鏡", exact: true }).click();
  await page
    .getByRole("button", { name: "查看隱形眼鏡保養液", exact: true })
    .click();
  await page.getByRole("tab", { name: "庫存異動", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: "REQ-" })).toContainText(
    "-2",
  );
  await page.getByRole("button", { name: "關閉視窗", exact: true }).click();
  await navigate(page, "requisitions");
  await expect(page.getByLabel("作業身分（展示）")).toHaveCount(0);
});
test("@critical 盤點期間阻擋確認、草稿取消保護", async ({ page }) => {
  await page.goto("/requisitions");
  await fillDraft(page);
  const dialog = page.getByRole("dialog");
  await page.getByRole("button", { name: "取消", exact: true }).click();
  await expect(dialog).toContainText("尚有未儲存變更");
  await page.getByRole("button", { name: "繼續編輯", exact: true }).click();
  await page.getByRole("button", { name: "儲存草稿", exact: true }).click();
  await dialog.getByRole("button", { name: "確認出庫", exact: true }).click();
  await dialog.getByRole("button", { name: "確認出庫", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("盤點");
  await dialog.getByRole("button", { name: "返回單據", exact: true }).click();
  await dialog.getByRole("button", { name: "關閉", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "新增領用單", exact: true }),
  ).toBeEnabled();
});
