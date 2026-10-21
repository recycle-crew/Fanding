import { test as base, expect } from "@playwright/test";
import { WORKSPACE_LOGIN_ENABLED as loginEnabled } from "../../../../src/constants/workspaceAccess";

const test = base.extend<{ componentErrors: void }>({
  componentErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (
          /requires a.*DialogTitle|Missing.*Description|cannot be a descendant/i.test(
            message.text(),
          )
        )
          errors.push(message.text());
      });
      await use();
      expect(errors, "shadcn 元件不得發生執行錯誤或缺少無障礙標題").toEqual([]);
    },
    { auto: true },
  ],
});

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-15T04:00:00Z"));
});

test("shadcn 確認視窗的鍵盤取消、焦點限制與回復", async ({ page }) => {
  await page.goto("/vendors");
  if (loginEnabled)
    await page.locator("#workspace-permission").selectOption("privileged");
  await expect(page.locator("#workspace")).toBeVisible();
  await page.addStyleTag({ content: "#notice{visibility:hidden!important}" });
  const trigger = page.locator("[data-action=delete][data-id=V005]");
  await trigger.click();
  const dialog = page.locator("#confirmation");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("data-slot", "dialog-content");
  await expect(dialog.locator("[data-slot=dialog-title]")).toHaveCount(1);
  for (let index = 0; index < 4; index++) {
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBe(true);
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
