import { test as base, expect } from "@playwright/test";

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

test("shadcn 規劃板關閉重開仍保留 iframe 中新增的廠商", async ({ page }) => {
  await page.goto("/board");
  await page.locator('[data-page="vendors"]').click();
  await page.locator("#start-tour").click();
  const frame = page.frameLocator("#interactive-workspace");
  await expect(page.locator("#player-status")).toHaveText("");
  await frame.locator('[data-action="add"]').click();
  await frame.locator('#editor [name="code"]').fill("SHADCN");
  await frame.locator('#editor [name="name"]').fill("元件遷移測試廠商");
  await frame.locator('#editor [name="phone"]').fill("02-1234-5678");
  await frame.locator('#editor-form button[type="submit"]').click();
  await expect(frame.locator("#editor")).toBeHidden();
  await frame.locator("#search").fill("元件遷移測試廠商");
  await expect(frame.locator(".list-panel table")).toContainText(
    "元件遷移測試廠商",
  );
  await page.locator("#close-player").click();
  await expect(page.locator("#player")).toBeHidden();
  await page.locator("#start-tour").click();
  await expect(page.locator("#player-status")).toHaveText("");
  await frame.locator("#search").fill("元件遷移測試廠商");
  await expect(frame.locator(".list-panel table")).toContainText(
    "元件遷移測試廠商",
  );
  await page.screenshot({ path: test.info().outputPath("workspace-player-retained.png") });
  await expect(page.locator("#player")).toHaveScreenshot(
    "shadcn-player-retained.png",
  );
});

test("/board 直接進入與重新整理", { tag: "@critical" }, async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
  await page.goto("/board");
  await expect(page.getByRole("heading", { level: 1 }).first()).not.toBeEmpty();
  await expect(page).toHaveURL((url) => url.pathname === "/board");
  const entryURL = page.url();
  await page.reload();
  await expect(page).toHaveURL(entryURL);
  await expect(page.locator("h1").first()).toBeVisible();
});
