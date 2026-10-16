const { test, expect } = require("../test-api.cjs");
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-15T04:00:00Z"));
  await page.goto("/demo");
  await expect(page.locator("#login-form")).toBeVisible();
  await page.addStyleTag({ content: "#notice{visibility:hidden!important}" });
});
async function login(page, privileged = false) {
  if (privileged)
    await page.locator("#demo-permission").selectOption("privileged");
  await page.locator("#login-form button[type=submit]").click();
  await expect(page.locator("#workspace")).toBeVisible();
}
async function navigate(page, module) {
  if (page.viewportSize().width <= 800)
    await page.locator("#menu-toggle").click();
  await page.locator(`[data-module="${module}"]`).click();
}
test("React 登入必填、忘記密碼與返回", async ({ page }) => {
  await page.locator("#login-form [name=account]").fill("");
  await page.locator("#login-form button[type=submit]").click();
  await expect(page.locator("#workspace")).toBeHidden();
  await page.locator("#login-form [name=account]").fill("demo.user");
  await page.locator("#forgot-password").click();
  await expect(page.locator("#recovery-form [name=account]")).toBeFocused();
  await page.locator("#recovery-form [name=email]").fill("user@example.test");
  await page.locator("#recovery-form button[type=submit]").click();
  await expect(page.locator("#recovery-result")).toContainText(
    "本次未查詢帳號",
  );
  await expect(page.locator("#password-recovery")).toHaveScreenshot(
    "react-recovery.png",
  );
  await page.locator("#back-to-login").click();
  await login(page);
  await expect(page.locator("#account-label")).toContainText("demo.user");
});
test("React 廠商新增、重複代碼、權限與修改歷程", async ({ page }) => {
  await login(page);
  await navigate(page, "vendors");
  await page.locator("[data-action=add]").click();
  await page.locator("#editor [name=code]").fill("V001");
  await page.locator("#editor [name=name]").fill("React 測試廠商");
  await page.locator("#editor [name=phone]").fill("02-0000-1234");
  await page.locator("#editor-form button[type=submit]").click();
  await expect(page.locator("#editor-error")).toContainText("已存在");
  await expect(page.locator("#editor")).toHaveScreenshot(
    "react-vendor-duplicate.png",
  );
  await page.locator("#editor [name=code]").fill("REACT01");
  await page.locator("#editor-form button[type=submit]").click();
  await expect(page.locator("#editor")).toBeHidden();
  await page.locator("#search").fill("REACT01");
  await page.locator("#search").press("Escape");
  await page.locator("#list-table [data-action=edit]").click();
  await expect(page.locator("#editor [name=name]")).toHaveAttribute(
    "readonly",
    "",
  );
  await page.locator("#editor [name=name]").click();
  await expect(page.locator("#readonly-notice")).toBeVisible();
  await page.locator("#readonly-notice button").click();
  await page.locator("#editor [name=contact]").fill("測試聯絡人");
  await page.locator("#editor-form button[type=submit]").click();
  await expect(
    page.locator("[data-pagination-key=data-changes-vendors]"),
  ).toContainText("測試聯絡人");
});
test("React 高權限編輯、取消與刪除保護", async ({ page }) => {
  await login(page, true);
  await navigate(page, "vendors");
  await page.locator("[data-action=edit][data-id=V001]").click();
  await page.locator("#editor [name=name]").fill("修改後測試廠商");
  await page.locator("#editor-form button[type=submit]").click();
  await expect(
    page.locator("[data-pagination-key=data-changes-vendors]"),
  ).toContainText("高權限修改");
  await page.locator("[data-action=delete][data-id=V001]").click();
  await expect(page.locator("#confirmation")).toBeHidden();
  const warningStyle = await page.addStyleTag({
    content: "#notice{visibility:visible!important}",
  });
  await expect(page.locator("#notice")).toContainText("已被品項引用");
  await expect(page.locator("#notice")).toBeVisible();
  await expect(page.locator("#notice")).toHaveScreenshot(
    "react-vendor-in-use-warning.png",
  );
  await warningStyle.evaluate((element) => element.remove());
  await page.locator("[data-action=delete][data-id=V005]").click();
  await expect(page.locator("#confirmation")).toBeVisible();
  await page.locator("#confirmation button[value=cancel]").click();
  await expect(
    page.locator("[data-action=delete][data-id=V005]"),
  ).toBeVisible();
  await page.locator("[data-action=delete][data-id=V005]").click();
  await page.locator("#confirmation button[value=confirm]").click();
  await expect(page.locator("[data-action=delete][data-id=V005]")).toHaveCount(
    0,
  );
  await expect(page.locator("#content")).toHaveScreenshot(
    "react-vendor-changes.png",
  );
});
test("React 領用新增、庫存不足、刪除回復及查無資料", async ({ page }) => {
  await login(page);
  await navigate(page, "requisitions");
  await page.locator("[data-action=add]").click();
  await page.locator("#editor [name=productId]").selectOption("O001");
  await page.locator("#editor [name=person]").fill("React 測試領用人");
  await page.locator("#editor [name=quantity]").fill("999");
  await page.locator("#editor-form button[type=submit]").click();
  await expect(page.locator("#editor-error")).toContainText("庫存不足");
  await page.locator("#editor [name=quantity]").fill("2");
  await page.locator("#editor-form button[type=submit]").click();
  await page.locator("#search").fill("React 測試領用人");
  await expect(page.locator("#list-table tbody tr:visible")).toHaveCount(1);
  await page.locator("#list-table [data-action=delete]").click();
  await page.locator("#confirmation button[value=confirm]").click();
  await expect(page.locator("#list-table")).toContainText("目前沒有符合的資料");
  await expect(page.locator("#content")).toHaveScreenshot(
    "react-requisition-empty.png",
  );
});
test("React 盤點草稿、路由保護、鎖定與歷史更正", async ({ page }) => {
  await login(page, true);
  await navigate(page, "stocktake");
  await page.locator("[data-action=start-batch]").click();
  await page.locator("#barcode").fill("9902000000001");
  await page.locator("#barcode").press("Enter");
  await page.locator("[data-action=edit-count]").click();
  await page.locator("#editor [name=actual]").fill("238");
  await page.goBack();
  await expect(page.locator("#editor")).toBeVisible();
  await expect(page).toHaveURL(/\/demo\/stocktake\/current$/);
  const warningStyle = await page.addStyleTag({
    content: "#notice{visibility:visible!important}",
  });
  await expect(page.locator("#notice")).toContainText("請先儲存");
  await expect(page.locator("#notice")).toBeVisible();
  await expect(page.locator("#notice")).toHaveScreenshot(
    "react-route-guard-warning.png",
  );
  await warningStyle.evaluate((element) => element.remove());
  await page.locator("#editor-form button[type=submit]").click();
  await page.locator("[data-confirm-count]").check();
  await page.locator("[data-action=submit-batch]").click();
  await page.locator("#confirmation button[value=cancel]").click();
  await expect(page.locator("[data-action=edit-count]")).toBeVisible();
  await page.locator("[data-action=submit-batch]").click();
  await page.locator("#confirmation button[value=confirm]").click();
  await navigate(page, "stocktake-history");
  await expect(page.locator("#stocktake-batch")).toHaveValue("ST0006");
  await expect(
    page.locator("[data-pagination-key=stocktake-ST0006]"),
  ).toContainText("已送出");
  await page.locator("[data-action=correct-count]").click();
  await page.locator("#editor [name=actual]").fill("237");
  await page.locator("#editor [name=correctionReason]").fill("重新核對");
  await page.locator("#editor-form button[type=submit]").click();
  await expect(
    page.locator("[data-pagination-key=batch-corrections-ST0006]"),
  ).toContainText("重新核對");
  await expect(page.locator("#content")).toHaveScreenshot(
    "react-stocktake-corrected.png",
  );
});
test("React 盤點路由直接開啟與上一頁", async ({ page }) => {
  await page.goto("/demo/stocktake/history");
  await login(page);
  await expect(page.locator("#content h2")).toHaveText("歷史盤點紀錄");
  await navigate(page, "stocktake");
  await expect(page).toHaveURL(/\/demo\/stocktake\/current$/);
  await page.goBack();
  await expect(page.locator("#content h2")).toHaveText("歷史盤點紀錄");
});

test("React HIS 高權限回寫展示不修改庫存", async ({ page }) => {
  await login(page, true);
  await navigate(page, "his");
  const row = page.locator("#list-table tbody tr").first();
  await expect(row).toContainText("1200");
  await row.locator("[data-action=edit]").click();
  await page.locator("#editor [name=name]").fill("示例藥品 React");
  await page.locator("#editor-form button[type=submit]").click();
  await expect(row).toContainText("示例藥品 React");
  await expect(row).toContainText("1200");
  await expect(
    page.locator("[data-pagination-key=data-changes-his]"),
  ).toContainText("示例藥品 A");
  await expect(page.locator("#content")).toHaveScreenshot(
    "react-his-changed.png",
  );
});

test("React Excel 載入錯誤可重試，空結果仍可匯出", async ({ page }) => {
  await login(page);
  await navigate(page, "vendors");
  await page.route("**/vendor/xlsx-0.20.3.mini.min.js", (route) =>
    route.abort(),
  );
  const controls = page.locator("#list-table .table-pagination");
  await controls.locator("[data-export-excel]").click();
  await expect(controls.locator(".export-status")).toContainText("匯出失敗");
  await expect(controls.locator("[data-export-excel]")).toBeEnabled();
  await expect(controls).toHaveScreenshot("react-export-retry.png");
  await page.unroute("**/vendor/xlsx-0.20.3.mini.min.js");
  await page.locator("#search").fill("不會存在的廠商");
  await expect(page.locator("#list-table")).toContainText("目前沒有符合的資料");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    controls.locator("[data-export-excel]").click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
  await expect(controls.locator(".export-status")).toContainText("共 0 筆");
});

test("React 盤點未完成不能結束，移除後可取消或結束批次", async ({ page }) => {
  await login(page);
  await navigate(page, "stocktake");
  await page.locator("[data-action=start-batch]").click();
  await page.locator("#barcode").fill("9902000000001");
  await page.locator("#barcode").press("Enter");
  await page.locator("[data-action=end-batch]").click();
  await expect(page.locator("#confirmation")).toBeHidden();
  await expect(
    page.locator("[data-pagination-key=batch-operations-ST0006]"),
  ).toContainText("結束批次遭拒");
  await page.locator("[data-action=remove-count]").click();
  await expect(
    page.locator("[data-pagination-key=stocktake-ST0006]"),
  ).toContainText("目前沒有符合的資料");
  await page.locator("[data-action=end-batch]").click();
  await page.locator("#confirmation button[value=cancel]").click();
  await expect(page.locator("[data-action=end-batch]")).toBeVisible();
  await page.locator("[data-action=end-batch]").click();
  await page.locator("#confirmation button[value=confirm]").click();
  await navigate(page, "stocktake-history");
  await expect(page.locator("#stocktake-batch")).toHaveValue("ST0006");
  await expect(
    page.locator("[data-pagination-key=batch-operations-ST0006]"),
  ).toContainText("移除盤點品項");
  await expect(page.locator("#content")).toHaveScreenshot(
    "react-empty-batch-ended.png",
  );
});

test("React 廠商搜尋鍵盤選取、Escape 與無結果", async ({ page }) => {
  await login(page);
  await navigate(page, "vendors");
  await page.locator("#search").fill("晴川");
  await page.locator("#search").press("ArrowDown");
  await expect(page.locator("[data-vendor-option=V001]")).toBeFocused();
  await expect(page.locator("[data-vendor-option=V001]")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.keyboard.press("Enter");
  await expect(page.locator("#search")).toHaveValue("V001");
  await expect(page.locator("#list-table tbody tr:visible")).toHaveCount(1);
  await page.locator("#search").fill("不存在");
  await expect(page.locator("#vendor-options")).toContainText("沒有符合的廠商");
  await expect(page.locator("#list-table")).toContainText("目前沒有符合的資料");
  await expect(page.locator("#content")).toHaveScreenshot(
    "react-vendor-search-empty.png",
  );
  await page.locator("#search").press("Escape");
  await expect(page.locator("#vendor-options")).toBeHidden();
  await expect(page.locator("#search")).toHaveValue("不存在");
});

test("React 品項新增、重複料號條碼、日期驗證與高權限編輯", async ({ page }) => {
  await login(page, true);
  await navigate(page, "products");
  await page.locator("[data-action=add]").click();
  for (const [name, value] of Object.entries({
    id: "O001",
    barcode: "0000123456000",
    name: "React 新品項",
    spec: "10 入",
    unit: "盒",
    minStock: "2",
    costPrice: "10",
    salePrice: "12",
    activationDate: "2026-10-16",
    deactivationDate: "2026-10-17",
  }))
    await page.locator(`#editor [name="${name}"]`).fill(value);
  await page.locator("#editor [name=vendorId]").selectOption("V001");
  await page.locator("#editor-form button[type=submit]").click();
  await expect(page.locator("#editor-error")).toContainText("代碼已存在");
  await page.locator("#editor [name=id]").fill("R001");
  await page.locator("#editor [name=barcode]").fill("9902000000001");
  await page.locator("#editor-form button[type=submit]").click();
  await expect(page.locator("#editor-error")).toContainText("國際條碼已存在");
  await page.locator("#editor [name=barcode]").fill("0000123456000");
  await page.locator("#editor [name=deactivationDate]").fill("2026-10-15");
  await page.locator("#editor-form button[type=submit]").click();
  await expect(page.locator("#editor-error")).toContainText("停用日期不能早於");
  await expect(page.locator("#editor")).toHaveScreenshot(
    "react-product-date-error.png",
  );
  await page.locator("#editor [name=deactivationDate]").fill("2026-10-17");
  await page.locator("#editor-form button[type=submit]").click();
  await page.locator("#search").fill("R001");
  await expect(page.locator("#list-table")).toContainText("0000123456000");
  await page.locator("#list-table [data-action=edit]").click();
  await expect(page.locator("#editor [name=id]")).toHaveAttribute(
    "readonly",
    "",
  );
  await page.locator("#editor [name=costPrice]").fill("15");
  await page.locator("#editor-form button[type=submit]").click();
  await expect(
    page.locator("[data-pagination-key=data-changes-products]"),
  ).toContainText("15");
  await page.locator("#list-table [data-action=delete]").click();
  await page.locator("#confirmation button[value=confirm]").click();
  await expect(page.locator("#list-table")).toContainText("目前沒有符合的資料");
});
