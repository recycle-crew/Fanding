import { test, expect } from "@playwright/test";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

test("靜態規劃文件停用 JavaScript 仍可閱讀、收合及跳轉", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const name of ["planning", "architecture"]) {
    for (const url of [
      "http://127.0.0.1:" +
        (process.env.PLAYWRIGHT_PORT || "4173") +
        "/docs/" +
        name +
        ".html",
      pathToFileURL(resolve("../docs/" + name + ".html")).href,
    ]) {
      await page.goto(url);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator("script")).toHaveCount(0);
      const detail = page.locator("details").first();
      await expect(detail).toHaveAttribute("open", "");
      await detail.locator("summary").click();
      await expect(detail).not.toHaveAttribute("open", "");
      await detail.locator("summary").press("Enter");
      await expect(detail).toHaveAttribute("open", "");
      expect(
        await page
          .locator("body")
          .evaluate((el) => getComputedStyle(el).fontFamily),
      ).toContain("Segoe UI");
    }
  }
  await context.close();
});

test("舊文件網址保留查詢與章節錨點", async ({ page }) => {
  await page.goto("/architecture.html?source=legacy#prep-fields");
  await expect(page).toHaveURL(
    /\/docs\/architecture\.html\?source=legacy#prep-fields$/,
  );
  await expect(page.locator("#prep-fields")).toBeInViewport();
  await expect(page.locator("#prep-fields")).toHaveAttribute("open", "");
  await page.reload();
  await expect(page.locator("#prep-fields")).toBeInViewport();
  await page.goto("/docs/planning.html#development-readiness");
  await page.locator('a[href="architecture.html#prep-fields"]').click();
  await expect(page.locator("#prep-fields")).toBeInViewport();
});
