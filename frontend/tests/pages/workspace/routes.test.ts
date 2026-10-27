import { test, expect } from "@playwright/test";

test("@critical 舊工作區網址改由現行模組接手", async ({ page }) => {
  for (const [oldPath, newPath] of [
    ["/vendors", "/base-data"],
    ["/his", "/items/his"],
    ["/products", "/items/general"],
    ["/historical-cost", "/items/his"],
    ["/receipt", "/purchases"],
    ["/issue", "/consumptions"],
    ["/requisitions", "/consumptions"],
    ["/stocktake/current", "/stocktakes"],
    ["/stocktake/history", "/stocktakes"],
  ]) {
    await page.goto(oldPath + "?embed=1#content");
    await expect(page).toHaveURL(
      (url) =>
        url.pathname === newPath &&
        url.searchParams.get("embed") === "1" &&
        url.hash === "#content",
    );
    await expect(page.locator("#content")).toBeVisible();
  }
});

test("獨立頁面載入失敗可重新載入重試", async ({ page }) => {
  const pageModule =
    /\/(?:src\/pages\/Items\/Home\.tsx|assets\/Home-[^/]+\.js)(?:\?.*)?$/;
  await page.route(pageModule, (route) => route.abort());
  await page.goto("/items");
  await expect(
    page.getByRole("heading", { name: "畫面載入失敗" }),
  ).toBeVisible();
  await page.unroute(pageModule);
  await page.getByRole("button", { name: "重新載入" }).click();
  await expect(page.locator("#content")).toContainText("品項");
});
