const { test, expect } = require("../test-api.cjs");

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-15T04:00:00Z"));
});

test("shadcn 確認視窗的鍵盤取消、焦點限制與回復", async ({ page }) => {
  await page.goto("/demo/vendors");
  await page.locator("#demo-permission").selectOption("privileged");
  await page.locator("#login-form button[type=submit]").click();
  await page.addStyleTag({ content: "#notice{visibility:hidden!important}" });
  const trigger = page.locator('[data-action=delete][data-id=V003]');
  await trigger.click();
  const dialog = page.locator("#confirmation");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("data-slot", "dialog-content");
  await expect(dialog.locator("[data-slot=dialog-title]")).toHaveCount(1);
  for (let index = 0; index < 4; index++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await expect(dialog).toHaveScreenshot("shadcn-confirmation-keyboard.png");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toBeVisible();
  await trigger.click();
  await dialog.locator("button[value=cancel]").click();
  await expect(dialog).toBeHidden();
});

test("shadcn 規劃板關閉重開仍保留 iframe 中新增的廠商", async ({ page }) => {
  await page.goto("/board");
  await page.locator('[data-page="vendors"]').click();
  await page.locator("#start-tour").click();
  const frame = page.frameLocator("#interactive-demo");
  await expect(page.locator("#player-status")).toHaveText("");
  await frame.locator('[data-action="add"]').click();
  await frame.locator('#editor [name="code"]').fill("SHADCN");
  await frame.locator('#editor [name="name"]').fill("元件遷移測試廠商");
  await frame.locator('#editor [name="phone"]').fill("02-1234-5678");
  await frame.locator('#editor-form button[type="submit"]').click();
  await expect(frame.locator("#editor")).toBeHidden();
  await frame.locator("#search").fill("元件遷移測試廠商");
  await expect(frame.locator("#table-area")).toContainText("元件遷移測試廠商");
  await page.locator("#close-player").click();
  await expect(page.locator("#player")).toBeHidden();
  await page.locator("#start-tour").click();
  await expect(page.locator("#player-status")).toHaveText("");
  await frame.locator("#search").fill("元件遷移測試廠商");
  await expect(frame.locator("#table-area")).toContainText("元件遷移測試廠商");
  await expect(page.locator("#player")).toHaveScreenshot("shadcn-player-retained.png");
});
