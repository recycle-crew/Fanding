import { test, expect } from "@playwright/test";

test("獨立路由保留工作區、歷史導覽與舊網址", async ({ page }) => {
  await page.goto("/vendors");
  await expect(page.locator("#content h2")).toHaveText("廠商資料維護");
  await page.evaluate(() => {
    window.__spaDocument = "route-split";
  });
  if (page.viewportSize()!.width <= 800)
    await page.locator("#menu-toggle").click();
  await page
    .getByRole("button", { name: "品項與庫存管理（新版）", exact: true })
    .click();
  await expect(page).toHaveURL(/\/items\/his$/);
  await expect(page.locator("#content")).toBeVisible();
  await page.goBack();
  await expect(page.locator("#content h2")).toHaveText("廠商資料維護");
  await page.goForward();
  await expect(page).toHaveURL(/\/items\/his$/);
  expect(await page.evaluate(() => window.__spaDocument)).toBe("route-split");
  await page.goto("/demo/items/general");
  await expect(page).toHaveURL(/\/items\/general$/);
  await page.goto("/overview");
  await expect(page).toHaveURL(/\/$/);
  await page.reload();
  await expect(page.locator("#low-stock-panel")).toBeVisible();
  await page.goto("/overview?source=route#content");
  await expect(page).toHaveURL(/\/\?source=route#content$/);
  await page.goto("/overview/?source=route#content");
  await expect(page).toHaveURL(/\/\?source=route#content$/);
});

test("獨立頁面載入失敗可重新載入重試", async ({ page }) => {
  const pageModule =
    /\/(?:src\/pages\/Items\/Home\.tsx|assets\/Home-[^/]+\.js)(?:\?.*)?$/;
  await page.route(pageModule, (route) => route.abort());
  await page.goto("/items");
  await expect(
    page.getByRole("heading", { name: "畫面載入失敗" }),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("route-load-error.png"),
    fullPage: true,
  });
  await page.unroute(pageModule);
  await page.getByRole("button", { name: "重新載入" }).click();
  await expect(page.locator("#workspace")).toBeVisible();
  await expect(page.locator("#content")).toContainText("品項");
});

test("獨立頁面編輯阻擋上一頁及切頁，取消後可重試", async ({ page }) => {
  await page.goto("/");
  const mobile = page.viewportSize()!.width < 768;
  if (mobile) await page.locator("#menu-toggle").click();
  await page.locator("[data-module=vendors]").click();
  await expect(page).toHaveURL(/\/vendors$/);
  await page.locator("[data-action=add]").click();
  await page.locator("#editor [name=name]").fill("切頁保護草稿");
  await page.goBack();
  await expect(page).toHaveURL(/\/vendors$/);
  await expect(page.locator("#notice")).toContainText("請先儲存");
  await expect(page.locator("#editor [name=name]")).toHaveValue("切頁保護草稿");
  if (mobile) await page.locator("#menu-toggle").click();
  await page
    .getByRole("button", { name: "品項與庫存管理（新版）", exact: true })
    .click();
  await expect(page).toHaveURL(/\/vendors$/);
  if (mobile) await page.locator("#menu-toggle").click();
  await page.screenshot({
    path: test.info().outputPath("route-blocked-editor.png"),
  });
  await page.locator("#editor [data-close]").last().click();
  await expect(page.locator("#editor")).toBeHidden();
  await expect(page.locator("#content")).toBeFocused();
  if (mobile) await page.locator("#menu-toggle").click();
  await page
    .getByRole("button", { name: "品項與庫存管理（新版）", exact: true })
    .click();
  await expect(page).toHaveURL(/\/items\/his$/);
});
