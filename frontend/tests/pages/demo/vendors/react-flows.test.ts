import {
  test,
  expect,
  enterWorkspace,
  loginEnabled,
  checkPageEntry,
} from "../../../helpers/test";
import type { Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-15T04:00:00Z"));
  await page.goto("/demo");
  await expect(
    page.locator(loginEnabled ? "#login-form" : "#workspace"),
  ).toBeVisible();
  await page.addStyleTag({ content: "#notice{visibility:hidden!important}" });
});
async function login(page: Page, privileged = false) {
  await enterWorkspace(page, privileged);
}
async function navigate(page: Page, module: string) {
  if (page.viewportSize().width <= 800)
    await page.locator("#menu-toggle").click();
  await page.locator(`[data-module="${module}"]`).click();
}

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
  await warningStyle.evaluate((element) =>
    element.parentNode?.removeChild(element),
  );
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

test(
  "/demo/vendors 直接進入與重新整理",
  { tag: "@critical" },
  async ({ page }, info) => {
    await checkPageEntry(page, "/demo/vendors", info);
  },
);
