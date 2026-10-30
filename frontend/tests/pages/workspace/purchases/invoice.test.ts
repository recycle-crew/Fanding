import { test, expect } from "@playwright/test";

test("@critical 新增與修改出貨發票資料，核對僅保留三欄", async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);
  await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
  await page.goto("/purchases");
  await page.getByRole("button", { name: "新增進貨單", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const next = () =>
    dialog
      .getByRole("button", { name: "下一步：確認內容", exact: true })
      .click();
  await page.locator("#purchase-supplier").selectOption("明康醫藥有限公司");
  await page.locator("#purchase-warehouse").selectOption("主倉庫");
  await page.locator("#purchase-supplier-shipping-date").fill("2026-10-18");
  await page.locator("#purchase-invoice").fill("AB12345678");
  await expect(page.locator("#purchase-tax")).toHaveValue("免稅");
  await page.locator("#purchase-tax").selectOption("應稅");
  await page.locator("#purchase-item-search").fill("MED0001");
  await page.locator("#purchase-item-search").press("Enter");
  await page.locator("#purchase-invoice-date").fill("");
  await next();
  await expect(dialog.getByRole("alert")).toContainText("發票日期");
  await page.locator("#purchase-invoice-date").fill("2026-10-19");
  await dialog.screenshot({
    path: testInfo.outputPath("purchase-invoice.png"),
  });
  await next();
  await dialog.getByRole("button", { name: "返回檢查", exact: true }).click();
  await expect(page.locator("#purchase-invoice")).toHaveValue("AB12345678");
  await next();
  await dialog.getByRole("button", { name: "確認入庫", exact: true }).click();
  await expect(dialog).toBeHidden();
  const number = "PO20261020010";
  const action = async (name: string) => {
    await page
      .getByRole("textbox", { name: "搜尋進貨單", exact: true })
      .fill(number);
    await page
      .getByRole("button", { name: `更多作業 ${number}`, exact: true })
      .click();
    await page.getByRole("menuitem", { name, exact: true }).click();
  };
  await action("修改出貨與發票資料");
  await expect(page.locator("#purchase-supplier-shipping-date")).toHaveValue(
    "2026-10-18",
  );
  await expect(page.locator("#purchase-invoice-date")).toHaveValue(
    "2026-10-19",
  );
  await expect(page.locator("#purchase-tax")).toHaveValue("應稅");
  await page.locator("#purchase-supplier-shipping-date").fill("2026-10-17");
  await page.locator("#purchase-invoice").fill("CD87654321");
  await next();
  await dialog.getByRole("button", { name: "確認送出", exact: true }).click();
  await expect(dialog).toBeHidden();
  await action("核對單據");
  await expect(dialog.locator("input, select, textarea")).toHaveCount(3);
  await page.locator("#settlement-amount").fill("99");
  await dialog.locator(".purchase-optional-fields summary").click();
  await page.locator("#settlement-remark").fill("已核對折扣");
  await dialog.screenshot({
    path: testInfo.outputPath("settlement-three-fields.png"),
  });
  await next();
  await dialog.getByRole("button", { name: "確認核對", exact: true }).click();
  await expect(dialog).toBeHidden();
  await action("查看進貨明細");
  await expect(dialog).toContainText("2026-10-17");
  await expect(dialog).toContainText("CD87654321");
  await expect(dialog).toContainText("2026-10-19");
  await dialog.getByRole("tab", { name: "核對資訊", exact: true }).click();
  await expect(dialog).toContainText("已核對折扣");
  await dialog
    .getByRole("button", { name: "關閉進貨視窗", exact: true })
    .click();
  await page
    .getByRole("button", { name: `更多作業 ${number}`, exact: true })
    .click();
  await expect(
    page.getByRole("menuitem", { name: "修改出貨與發票資料", exact: true }),
  ).toBeDisabled();
});
