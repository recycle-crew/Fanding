import { test, expect } from "@playwright/test";

for (const method of ["現金", "刷卡", "銀行轉帳", "電子支付"]) {
  test(`@critical 百分比折扣與付款方式保存：${method}`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(60_000);
    await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
    await page.goto("/pos");
    const search = page.getByRole("textbox", {
      name: "掃碼／搜尋商品",
      exact: true,
    });
    await search.fill("OTC0001");
    await search.press("Enter");
    const summary = page.getByRole("region", { name: "結帳摘要", exact: true });
    await page.locator("#pos-order-discount-mode").selectOption("percentage");
    const percent = page.locator("#pos-order-discount-percent");
    await percent.fill("101");
    await expect(summary.getByRole("alert")).toContainText("0% 至 100%");
    await expect(
      page.getByRole("button", { name: "前往結帳", exact: true }),
    ).toBeDisabled();
    await percent.fill("10");
    await expect(summary.locator(".pos-amount")).toContainText("319.5");
    await expect(summary).toContainText("自動折扣金額 $35.5");
    await page.getByLabel("葉黃素膠囊數量", { exact: true }).fill("2");
    await expect(summary.locator(".pos-amount")).toContainText("639");
    await page.getByLabel("葉黃素膠囊數量", { exact: true }).fill("1");
    await page.locator("#pos-payment-method").selectOption(method);
    await expect(page.locator("#pos-payment-method option")).toHaveText([
      "現金",
      "刷卡",
      "銀行轉帳",
      "電子支付",
    ]);
    if (method === "現金") {
      await summary.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: testInfo.outputPath("pos-discount-percent.png"),
      });
    }
    await page.getByRole("button", { name: "前往結帳", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel("付款方式", { exact: true })).toHaveValue(
      method,
    );
    await expect(
      dialog.getByRole("region", { name: "結帳金額" }),
    ).toContainText("319.5");
    const submit = dialog.getByRole("button", {
      name: "確認完成結帳",
      exact: true,
    });
    await expect(
      dialog.getByRole("checkbox", {
        name: /外部付款成功|專業人員確認藥品銷售/,
      }),
    ).toHaveCount(0);
    await submit.click();
    await expect(
      dialog.getByRole("heading", { name: "銷售明細與交易憑證", exact: true }),
    ).toBeVisible();
    const payment = dialog
      .locator(".sale-detail-facts")
      .first()
      .locator("div")
      .filter({ has: page.locator("dt", { hasText: "付款方式" }) });
    await expect(payment).toContainText(method);
    await expect(
      dialog.getByRole("region", { name: "交易金額摘要" }),
    ).toContainText("319.5");
    if (method === "現金")
      await dialog.screenshot({
        path: testInfo.outputPath("sale-payment-summary.png"),
      });
    expect(
      await dialog.evaluate(
        (element) => element.scrollWidth <= element.clientWidth + 1,
      ),
    ).toBe(true);
  });
}
