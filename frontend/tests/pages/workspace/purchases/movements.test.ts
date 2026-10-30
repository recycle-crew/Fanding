import { test, expect } from "@playwright/test";

test("@critical 進貨明細直接顯示退貨沖銷與逐筆剩餘數量", async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);
  await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
  await page.goto("/purchases");
  const dialog = page.getByRole("dialog");
  const action = async (name: string) => {
    await page
      .getByRole("textbox", { name: "搜尋進貨單", exact: true })
      .fill("PO20261020009");
    await page
      .getByRole("button", { name: "更多作業 PO20261020009", exact: true })
      .click();
    await page.getByRole("menuitem", { name, exact: true }).click();
  };
  await action("進貨退貨");
  await page.locator("#operation-reason").fill("包裝破損退貨");
  await page.locator("#operation-resolution").selectOption("退款");
  await page
    .getByRole("checkbox", { name: "選擇人工淚液", exact: true })
    .check();
  await page.getByLabel("人工淚液本次數量", { exact: true }).fill("5");
  await page.locator("#operation-physical").check();
  await dialog
    .getByRole("button", { name: "下一步：確認退貨", exact: true })
    .click();
  await dialog.getByRole("button", { name: "確認退貨", exact: true }).click();
  await expect(dialog).toBeHidden();
  await action("進貨沖銷");
  await page.locator("#operation-reason").fill("重複登錄沖銷");
  await page
    .getByRole("checkbox", { name: "選擇人工淚液", exact: true })
    .check();
  await page.getByLabel("人工淚液本次數量", { exact: true }).fill("3");
  await dialog
    .getByRole("button", { name: "下一步：確認沖銷", exact: true })
    .click();
  await dialog.getByRole("button", { name: "確認沖銷", exact: true }).click();
  await expect(dialog).toBeHidden();
  await action("查看進貨明細");
  const movements = dialog.locator(".purchase-line-movements");
  await expect(movements).toBeVisible();
  await expect(movements.locator(".purchase-movement-summary")).toContainText(
    "已退貨5 瓶",
  );
  await expect(movements.locator(".purchase-movement-summary")).toContainText(
    "已沖銷3 瓶",
  );
  await expect(movements.locator(".purchase-movement-summary")).toContainText(
    "本單剩餘12 瓶",
  );
  const entries = movements.locator(".purchase-movement");
  await expect(entries).toHaveCount(3);
  await expect(entries.nth(0)).toContainText("+20 瓶");
  await expect(entries.nth(1)).toContainText("−5 瓶");
  await expect(entries.nth(1)).toContainText("剩餘 15 瓶");
  await expect(entries.nth(2)).toContainText("−3 瓶");
  await expect(entries.nth(2)).toContainText("剩餘 12 瓶");
  await expect(entries.nth(1)).toContainText("包裝破損退貨");
  const colors = await entries.evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element).borderLeftColor),
  );
  expect(new Set(colors).size).toBe(3);
  await movements.scrollIntoViewIfNeeded();
  await dialog.screenshot({
    path: testInfo.outputPath("purchase-movements.png"),
  });
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth <= element.clientWidth + 1,
    ),
  ).toBe(true);
  const recordLink = entries
    .nth(1)
    .getByRole("button", { name: /^查看異動紀錄/ });
  const number = await recordLink.innerText();
  await recordLink.click();
  await expect(
    dialog.getByRole("tab", { name: "異動及更正歷史", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  const record = dialog.locator(".purchase-history-linked");
  await expect(record).toContainText(number);
  await expect(record).toBeFocused();
  await record.locator("summary").click();
  await expect(record).toContainText("包裝破損退貨");
});
