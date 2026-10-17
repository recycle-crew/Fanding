const { test, expect } = require("../test-api.cjs");

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-15T04:00:00Z"));
});

test("SPA 跨頁不重載並保留登入及新增資料", async ({ page }) => {
  const reduxErrors = [];
  page.on("console", (message) => {
    if (/non-serializable|A state mutation was detected/i.test(message.text()))
      reduxErrors.push(message.text());
  });
  await page.goto("/demo/vendors");
  await page.locator("#login-form button[type=submit]").click();
  await expect(page.locator("#content h2")).toHaveText("廠商資料維護");
  await page.locator("[data-action=add]").click();
  await page.locator("#editor [name=name]").fill("SPA 保留資料測試");
  await page.locator("#editor [name=phone]").fill("02-0000-1234");
  await page.locator("#editor-form button[type=submit]").click();
  await expect(page.locator("#editor")).toBeHidden();
  await page.evaluate(() => {
    window.__spaDocument = "same-document";
  });
  const documents = [];
  page.on("request", (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame())
      documents.push(request.url());
  });
  if (page.viewportSize().width <= 800)
    await page.locator("#menu-toggle").click();
  await page.locator('.planning-link[href="/"]').click();
  await expect(page.locator("h1")).toBeVisible();
  await page.locator('nav a[href="/architecture"]').click();
  await expect(page).toHaveURL(/\/architecture$/);
  await expect(page.locator(".document-layout")).toBeVisible();
  await page.locator('nav a[href="/board"]').click();
  await expect(page.locator("#page-title")).not.toBeEmpty();
  await page.locator('nav a[href="/demo"]').click();
  await expect(page.locator("#workspace")).toBeVisible();
  if (page.viewportSize().width <= 800)
    await page.locator("#menu-toggle").click();
  await page.locator("[data-module=vendors]").click();
  await page.locator("#search").fill("SPA 保留資料測試");
  await expect(page.locator("#list-table")).toContainText("SPA 保留資料測試");
  expect(await page.evaluate(() => window.__spaDocument)).toBe("same-document");
  expect(documents).toEqual([]);
  expect(reduxErrors, "Redux 序列化與不可變檢查必須通過").toEqual([]);
  await page.addStyleTag({ content: "#notice{visibility:hidden!important}" });
  await expect(page).toHaveScreenshot("spa-retained-vendor.png");
});

test("SPA 直接開啟與重新整理盤點路徑及舊連結", async ({ page }) => {
  await page.goto("/demo/stocktake/history");
  await expect(page.locator("#login-form")).toBeVisible();
  await page.locator("#login-form button[type=submit]").click();
  await expect(page.locator("#content h2")).toHaveText("歷史盤點紀錄");
  await page.reload();
  await expect(page).toHaveURL(/\/demo\/stocktake\/history$/);
  await expect(page.locator("#login-form")).toBeVisible();
  await page.goto("/demo.html?embed=1#/stocktake/current");
  await expect(page).toHaveURL(/\/demo\/stocktake\/current\?embed=1$/);
  await expect(page.locator("#login-form")).toBeVisible();
  await page.locator("#login-form button[type=submit]").click();
  await expect(page.locator("#content h2")).toHaveText("現有盤點週期");
  await page.addStyleTag({ content: "#notice{visibility:hidden!important}" });
  await expect(page.locator("#content")).toHaveScreenshot(
    "spa-stocktake-direct.png",
  );
  await page.goto("/architecture.html#preparation");
  await expect(page).toHaveURL(/\/architecture#preparation$/);
  await expect(page.locator("#preparation")).toBeInViewport();
  await page.goto("/#development-readiness");
  await page.locator('a[href="/architecture#prep-fields"]').click();
  await expect(page.locator("#prep-fields")).toBeInViewport();
  await expect(page.locator("#prep-fields")).toHaveAttribute(
    "data-state",
    "open",
  );
  await expect(page.locator("#prep-fields")).toHaveScreenshot(
    "spa-document-anchor.png",
  );
  await page.locator('#prep-fields a[href="/#confirmation-fields"]').click();
  await expect(page.locator("#confirmation-fields")).toBeInViewport();
  await page.goto("/architecture/");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator("body")).toHaveClass("planning-page");
  await page.goto("/demo/stocktake/history/");
  await page.locator("#login-form button[type=submit]").click();
  await expect(page.locator("#content h2")).toHaveText("歷史盤點紀錄");
});

test("SPA 找不到頁面可返回首頁", async ({ page }) => {
  await page.goto("/demo/missing-module");
  await expect(page.getByRole("heading", { name: "找不到頁面" })).toBeVisible();
  await expect(page).toHaveScreenshot("spa-not-found.png");
  await page.getByRole("link", { name: "返回系統規劃" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.locator("h1")).toBeVisible();
});

test("SPA 頁面載入失敗可重新載入重試", async ({ page }) => {
  await page.route("**/src/pages/Architecture/Home.tsx*", (route) =>
    route.abort(),
  );
  await page.goto("/");
  await page.locator('nav a[href="/architecture"]').click();
  await expect(
    page.getByRole("heading", { name: "畫面載入失敗" }),
  ).toBeVisible();
  await expect(page).toHaveScreenshot("spa-load-error.png");
  await page.unroute("**/src/pages/Architecture/Home.tsx*");
  await page.getByRole("button", { name: "重新載入" }).click();
  await expect(page).toHaveURL(/\/architecture$/);
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.getByRole("heading", { name: "畫面載入失敗" })).toHaveCount(
    0,
  );
});

test("SPA 延遲載入顯示狀態並恢復頁面", async ({ page }) => {
  let resume;
  const pending = new Promise((resolve) => {
    resume = resolve;
  });
  await page.route("**/src/pages/Architecture/Home.tsx*", async (route) => {
    await pending;
    await route.continue();
  });
  await page.goto("/");
  await page.locator('nav a[href="/architecture"]').click();
  await expect(
    page.getByRole("status").filter({ hasText: "正在載入畫面…" }),
  ).toBeVisible();
  try {
    await expect(page).toHaveScreenshot("spa-loading.png");
  } finally {
    resume();
  }
  await expect(page.locator("h1")).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "正在載入畫面…" }),
  ).toHaveCount(0);
});
