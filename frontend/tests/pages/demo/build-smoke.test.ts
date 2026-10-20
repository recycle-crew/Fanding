import { test, expect } from "@playwright/test";

import { readdirSync } from "node:fs";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-15T04:00:00Z"));
});
test("build 靜態文件、系統路由、錨點與正式版無測試入口", async ({ page }) => {
  expect(
    readdirSync("dist", { recursive: true, encoding: "utf8" })
      .filter((name) => name.endsWith(".html"))
      .map((name) => name.replaceAll("\\", "/"))
      .sort(),
  ).toEqual(["docs/architecture.html", "docs/planning.html", "index.html"]);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const path of [
    "index.html",
    "architecture.html",
    "board.html",
    "demo.html",
  ]) {
    await page.goto(
      {
        "index.html": "/docs/planning.html",
        "architecture.html": "/docs/architecture.html",
        "board.html": "/board",
        "demo.html": "/",
      }[path],
    );
    await expect(
      page.locator(path === "demo.html" ? "#workspace" : "h1"),
    ).toBeVisible();
    if (path === "architecture.html") {
      const documentPath = await page
        .locator('footer a[href$=".md"]')
        .getAttribute("href");
      const source = await page.request.get(
        new URL(documentPath!, page.url()).href,
      );
      expect(source.ok()).toBe(true);
      expect(await source.text()).toContain("# 庫存管理系統程式架構規劃");
    }
    expect(await page.evaluate(() => typeof window.__demoTest)).toBe(
      "undefined",
    );
  }
  await page.goto("/docs/planning.html#development-readiness");
  await expect(page.locator("#development-readiness")).toBeVisible();
  await page.goto("/stocktake/history");
  await expect(page.locator("#workspace")).toBeVisible();
  await expect(page.locator("#content h2")).toHaveText("歷史盤點紀錄");
  expect(errors).toEqual([]);
  await page.addStyleTag({ content: "#notice{visibility:hidden!important}" });
  await expect(page).toHaveScreenshot("build-history.png");
});
test("build 本機 XLSX 與條碼套件、傳票及下載", async ({ page }) => {
  const response = await page.request.get("/vendor/zxing-browser-0.2.1.min.js");
  expect(response.ok()).toBe(true);
  await page.goto("/");
  await expect(page.locator("#workspace")).toBeVisible();
  if (page.viewportSize().width <= 800)
    await page.locator("#menu-toggle").click();
  await page.locator("#module-nav [data-module=receipt]").click();
  await page.locator("[data-action=create-voucher]").click();
  await page.locator("#barcode").fill("9902000000001");
  await page.locator("#barcode").press("Enter");
  await page.locator("#movement-form [name=quantity]").fill("2");
  await page.locator("#movement-form [name=note]").fill("build 驗證");
  await page.locator("#movement-form button[type=submit]").click();
  await page.locator("[data-action=submit-voucher]").click();
  await page.locator("#confirmation button[value=confirm]").click();
  await expect(page.locator(".voucher-section")).toContainText("已送出");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator(".voucher-section [data-export-excel]").click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
  await page.addStyleTag({ content: "#notice{visibility:hidden!important}" });
  await expect(page.locator("#content")).toHaveScreenshot("build-receipt.png");
});
test("build 流程 iframe 通訊及返回", async ({ page }) => {
  await page.goto("/board");
  await page.locator("#start-tour").click();
  await expect(page.locator("#player")).toBeVisible();
  await expect(page.locator("#player-status")).toHaveText("");
  await page.locator("#next-step").click();
  await expect(page.locator("#step-title")).toHaveText("忘記密碼");
  await expect(
    page.frameLocator("#interactive-demo").locator("#password-recovery"),
  ).toBeVisible();
  await page.locator("#close-player").click();
  await expect(page.locator("#player")).not.toBeVisible();
});

test("build 實際載入本機辨識 SDK 並顯示相機權限提示", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => {
          throw new DOMException("test denied", "NotAllowedError");
        },
      },
    });
  });
  await page.goto("/");
  await expect(page.locator("#workspace")).toBeVisible();
  if (page.viewportSize().width <= 800)
    await page.locator("#menu-toggle").click();
  await page.locator("#module-nav [data-module=receipt]").click();
  const sdk = page.waitForResponse(
    (response) =>
      response.url().endsWith("/vendor/zxing-browser-0.2.1.min.js") &&
      response.ok(),
  );
  await page.locator("[data-action=open-barcode-camera]").click();
  await sdk;
  await expect(page.locator("[data-camera-status]")).toContainText(
    "相機權限未開啟",
  );
  expect(
    await page.evaluate(
      () => typeof window.ZXingBrowser.BrowserMultiFormatReader,
    ),
  ).toBe("function");
  await page.addStyleTag({ content: "#notice{visibility:hidden!important}" });
  await expect(page.locator("#content > .panel").first()).toHaveScreenshot(
    "build-camera-permission.png",
  );
  await page.locator("[data-action=close-barcode-camera]").click();
  await expect(page.locator("#barcode-camera-panel")).toBeHidden();
});
