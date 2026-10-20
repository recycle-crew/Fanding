import { test, expect } from "@playwright/test";
import { DEMO_LOGIN_ENABLED as loginEnabled } from "../../../../src/constants/demoAccess";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-15T04:00:00Z"));
  await page.goto("/");
  await expect(
    page.locator(loginEnabled ? "#login-form" : "#workspace"),
  ).toBeVisible();
  await expect(page.locator("#workspace")).toBeVisible();
  await page.addStyleTag({
    content: "#notice { visibility:hidden !important; }",
  });
});
for (const module of ["issue"]) {
  test(`${module}: 進頁待掃描`, async ({ page }, testInfo) => {
    if (testInfo.project.name === "mobile")
      await page.locator("#menu-toggle").click();
    await page.locator(`#module-nav [data-module="${module}"]`).click();
    if (testInfo.project.name === "desktop")
      await expect(page.locator("#barcode")).toBeFocused();
    else await expect(page.locator("#barcode")).not.toBeFocused();
    await expect(
      page.locator('[data-action="open-barcode-camera"]'),
    ).toBeVisible();
    await expect(page.locator("#content > .panel").first()).toHaveScreenshot(
      `${module}-ready.png`,
    );
  });
  test(`${module}: 掃碼槍 Enter 找到品項及取消再掃描`, async ({
    page,
  }, testInfo) => {
    if (testInfo.project.name === "mobile")
      await page.locator("#menu-toggle").click();
    await page.locator(`#module-nav [data-module="${module}"]`).click();
    await page.locator("#barcode").focus();
    await page.keyboard.type("9902000000001");
    await page.keyboard.press("Enter");
    await expect(page.locator(".selection")).toContainText("醫用口罩");
    await expect(page.locator("#movement-form")).toBeVisible();
    await expect(page.locator("#content > .panel").first()).toHaveScreenshot(
      `${module}-found.png`,
    );
    await page.locator('[data-action="cancel-scan"]').click();
    if (testInfo.project.name === "desktop")
      await expect(page.locator("#barcode")).toBeFocused();
    await expect(page.locator("#barcode")).toHaveValue("");
  });
  test(`${module}: 找不到條碼顯示紅字`, async ({ page }, testInfo) => {
    if (testInfo.project.name === "mobile")
      await page.locator("#menu-toggle").click();
    await page.locator(`#module-nav [data-module="${module}"]`).click();
    await page.locator("#barcode").fill("0000000000000");
    await page.locator("#barcode").press("Enter");
    await expect(page.locator("#scan-error")).toBeVisible();
    await expect(page.locator("#scan-error")).toContainText("沒有找到");
    await expect(page.locator("#scan-error")).toHaveCSS(
      "color",
      "rgb(179, 52, 52)",
    );
    await expect(page.locator("#content > .panel").first()).toHaveScreenshot(
      `${module}-not-found.png`,
    );
    if (module === "receipt") {
      await page.locator('[data-action="add-unknown-barcode"]').click();
      await expect(page.locator("#editor")).toBeVisible();
      await expect(page.locator('#editor-form [name="barcode"]')).toHaveValue(
        "0000000000000",
      );
    }
  });
  for (const errorName of ["NotAllowedError", "OverconstrainedError"]) {
    test(`${module}: 相機 ${errorName} 畫面`, async ({ page }, testInfo) => {
      await page.addInitScript(
        ({ errorName }) => {
          window.ZXingBrowser = {
            BrowserMultiFormatReader: class {},
          } as unknown as NonNullable<Window["ZXingBrowser"]>;
          Object.defineProperty(navigator, "mediaDevices", {
            value: {
              getUserMedia: async (constraints: Window["requestedCamera"]) => {
                window.requestedCamera = constraints;
                throw new DOMException("測試相機錯誤", errorName);
              },
            },
          });
        },
        {
          errorName,
        },
      );
      // init script 應在導覽後執行；重新登入避免沿用前一個頁面。
      await page.reload();
      await expect(
        page.locator(loginEnabled ? "#login-form" : "#workspace"),
      ).toBeVisible();
      await expect(page.locator("#workspace")).toBeVisible();
      await page.addStyleTag({
        content: "#notice { visibility:hidden !important; }",
      });
      if (testInfo.project.name === "mobile")
        await page.locator("#menu-toggle").click();
      await page.locator(`#module-nav [data-module="${module}"]`).click();
      await page.locator('[data-action="open-barcode-camera"]').click();
      await expect(page.locator("[data-camera-status]")).toContainText(
        errorName === "NotAllowedError" ? "權限" : "後鏡頭",
      );
      expect(
        await page.evaluate(() => window.requestedCamera.video.facingMode),
      ).toEqual({
        exact: "environment",
      });
      await expect(page.locator("#content > .panel").first()).toHaveScreenshot(
        `${module}-${errorName}.png`,
      );
      await page.locator('[data-action="close-barcode-camera"]').click();
      await expect(page.locator("#barcode-camera-panel")).toBeHidden();
    });
  }
}
