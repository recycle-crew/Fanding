import type { Page, Locator } from "@playwright/test";
import { test, expect } from "../../../helpers/test";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const axe = require.resolve("axe-core/axe.min.js");
test.beforeEach(async ({ page }) => {
  await page.goto("/demo/consumptions");
  await expect(
    page.getByRole("heading", { name: "藥品耗用查詢", exact: true }),
  ).toBeVisible();
});
test("耗用各入口無障礙與小螢幕", async ({ page }, testInfo) => {
  async function audit() {
    await page.addScriptTag({ path: axe });
    const violations = await page.evaluate(
      async () =>
        (
          await window.axe.run(
            document.querySelector('[role="dialog"]') ||
              document.querySelector(".consumption-page"),
            {
              runOnly: {
                type: "tag",
                values: ["wcag2a", "wcag2aa", "wcag21aa"],
              },
            },
          )
        ).violations,
    );
    expect(violations).toEqual([]);
  }
  await audit();
  await page.screenshot({ path: testInfo.outputPath("consumptions-list.png") });
  for (const tab of ["同步異常", "HIS 藥品對照", "同步紀錄"]) {
    await page.getByRole("tab", { name: tab, exact: true }).click();
    await audit();
  }
  await page.getByRole("tab", { name: "HIS 藥品對照", exact: true }).click();
  await page.getByRole("button", { name: "新增對照", exact: true }).click();
  await audit();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "儲存對照", exact: true }),
  ).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBeTruthy();
});
