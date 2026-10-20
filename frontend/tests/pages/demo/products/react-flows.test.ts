import type { Page, Locator } from "@playwright/test";
import {
  test,
  expect,
  enterWorkspace,
  loginEnabled,
} from "../../../helpers/test";
import { checkPageEntry } from "../../../helpers/test";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-15T04:00:00Z"));
  await page.goto("/demo");
  await expect(
    page.locator(loginEnabled ? "#login-form" : "#workspace"),
  ).toBeVisible();
  await page.addStyleTag({ content: "#notice{visibility:hidden!important}" });
});
async function login(page: Page,  privileged = false) {
  await enterWorkspace(page, privileged);
}
async function navigate(page: Page, module: string) {
  if (page.viewportSize().width <= 800)
    await page.locator("#menu-toggle").click();
  await page.locator(`[data-module="${module}"]`).click();
}

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


test(
  "/demo/products 直接進入與重新整理",
  { tag: "@critical" },
  async ({ page }, info) => {
    await checkPageEntry(page, "/demo/products", info);
  },
);
