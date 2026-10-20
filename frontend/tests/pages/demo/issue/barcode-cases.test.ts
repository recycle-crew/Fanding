import type { Page, Locator } from "@playwright/test";
import {
  test as base,
  expect,
  enterWorkspace,
  loginEnabled,
} from "../../../helpers/test";
import { checkPageEntry } from "../../../helpers/test";

const test = base.extend<{ browserErrors: string[] }>({ browserErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await use(errors);
      expect(errors, "瀏覽器不得出現未處理的 JavaScript 錯誤").toEqual([]);
    },
    {
      auto: true,
    },
  ],
});
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-15T04:00:00Z"));
  await page.goto("/demo");
  await expect(
    page.locator(loginEnabled ? "#login-form" : "#workspace"),
  ).toBeVisible();
  await enterWorkspace(page);
  await expect(page.locator("#workspace")).toBeVisible();
  await page.addStyleTag({
    content: "#notice { visibility:hidden !important; }",
  });
});
async function enterScanModule(page: Page, module: string, project: string) {
  if (project === "mobile") await page.locator("#menu-toggle").click();
  await page.locator(`#module-nav [data-module="${module}"]`).click();
  await expect(page.locator("#scan-form")).toBeVisible();
}

// 模擬串流只檢查應用程式生命週期；不宣稱已驗證真實鏡頭辨識。
async function installCameraSimulation(page: Page,  pending = false) {
  await page.evaluate((pending) => {
    window.cameraTest = {
      tracksStopped: 0,
      decoderStopped: 0,
      requests: 0,
      pendingAllows: [],
    };
    const makeStream = () => ({
      getTracks: () => [
        {
          stop() {
            window.cameraTest.tracksStopped++;
          },
        },
      ],
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async (constraints: MediaStreamConstraints) => {
          window.cameraTest.requests++;
          window.cameraTest.constraints = constraints;
          if (pending)
            return await new Promise((resolve) => {
              window.cameraTest.allow = () => resolve(makeStream());
              window.cameraTest.pendingAllows.push(window.cameraTest.allow);
            });
          return makeStream();
        },
      },
    });
    window.ZXingBrowser = {
      BrowserMultiFormatReader: class {
        async decodeFromStream(stream: MediaStream, video: HTMLVideoElement, callback: CameraDecodeCallback) {
          const controls = {
            stop() {
              window.cameraTest.decoderStopped++;
            },
          };
          window.cameraTest.emit = (barcode) =>
            callback(
              barcode === null
                ? null
                : {
                    getText: () => barcode,
                  },
              null,
              controls,
            );
          return controls;
        }
      },
    };
  }, pending);
}
for (const module of ["issue"]) {
  test(`${module}: 成功送出一次並記錄庫存、料號及人員`, async ({
    page,
  }, testInfo) => {
    await enterScanModule(page, module, testInfo.project.name);
    await page.locator("#barcode").fill("9902000000001");
    await page.locator("#barcode").press("Enter");
    await page.locator('#movement-form [name="quantity"]').fill("3");
    await page.locator('#movement-form [name="note"]').fill("自動測試異動");
    await page.locator('#movement-form button[type="submit"]').click();
    await page.locator('[data-action="submit-voucher"]').click();
    await page.locator('#confirmation button[value="confirm"]').click();
    await expect(page.locator("#movement-form")).toHaveCount(0);
    const newRow = page
      .locator(
        "#receipt-movements-table tbody tr,#issue-movements-table tbody tr",
      )
      .filter({
        hasText: "自動測試異動",
      });
    await expect(newRow).toHaveCount(1);
    await expect(newRow).toContainText("O001");
    await expect(newRow).toContainText("demo.pharmacy");
    await expect(newRow).toContainText(module === "receipt" ? "+3" : "-3");
    if (testInfo.project.name === "desktop")
      await expect(page.locator("#barcode")).toBeFocused();
    await page.locator("#barcode").fill("9902000000001");
    await page.locator("#barcode").press("Enter");
    await expect(page.locator(".selection")).toContainText(
      `帳面庫存 ${module === "receipt" ? 243 : 237}`,
    );
    await expect(page.locator("#content > .panel").first()).toHaveScreenshot(
      `${module}-saved-stock.png`,
    );
  });
  test(`${module}: 停用品項不得入出庫`, async ({ page }, testInfo) => {
    await enterScanModule(page, module, testInfo.project.name);
    await page.locator("#barcode").fill("9902000000010");
    await page.locator("#barcode").press("Enter");
    await expect(page.locator(".selection")).toContainText("停用");
    await expect(page.locator("#movement-form")).toHaveCount(0);
    await expect(page.locator("#content > .panel").first()).toContainText(
      "停用品項不可新增",
    );
    await expect(page.locator("#content > .panel").first()).toHaveScreenshot(
      `${module}-inactive.png`,
    );
  });
  test(`${module}: 空白條碼及錯誤數量不能提交`, async ({ page }, testInfo) => {
    await enterScanModule(page, module, testInfo.project.name);
    await page.locator("#barcode").press("Enter");
    await expect(page.locator("#movement-form")).toHaveCount(0);
    expect(
      await page
        .locator("#barcode")
        .evaluate((input) => (input as HTMLInputElement).validity.valueMissing),
    ).toBe(true);
    await page.locator("#barcode").fill("9902000000001");
    await page.locator("#barcode").press("Enter");
    const quantity = page.locator('#movement-form [name="quantity"]');
    for (const invalid of ["0", "-1", "1.5", "1000001"]) {
      await quantity.fill(invalid);
      await page.locator('#movement-form button[type="submit"]').click();
      expect(await quantity.evaluate((input) => (input as HTMLInputElement).validity.valid)).toBe(
        false,
      );
      await expect(page.locator(".selection")).toContainText("帳面庫存 240");
    }
    await expect(page.locator("#content > .panel").first()).toHaveScreenshot(
      `${module}-invalid-quantity.png`,
    );
  });
  test(`${module}: 相機辨識成功、自動查詢且釋放鏡頭`, async ({
    page,
  }, testInfo) => {
    await enterScanModule(page, module, testInfo.project.name);
    await installCameraSimulation(page);
    await page.locator('[data-action="open-barcode-camera"]').click();
    await expect(page.locator("[data-camera-status]")).toContainText(
      "畫面中央",
    );
    await page.evaluate(() => window.cameraTest.emit(null));
    await expect(page.locator("#movement-form")).toHaveCount(0);
    await page.evaluate(() => window.cameraTest.emit("9902000000001"));
    await expect(page.locator(".selection")).toContainText("醫用口罩");
    await expect(page.locator("#barcode-camera-panel")).toBeHidden();
    expect(
      await page.evaluate(() => window.cameraTest.tracksStopped),
    ).toBeGreaterThan(0);
    expect(
      await page.evaluate(() => window.cameraTest.decoderStopped),
    ).toBeGreaterThan(0);
    await expect(page.locator("#content > .panel").first()).toHaveScreenshot(
      `${module}-camera-result.png`,
    );
  });
  test(`${module}: 等待相機授權時取消、遲到的串流也會關閉`, async ({
    page,
  }, testInfo) => {
    await enterScanModule(page, module, testInfo.project.name);
    await installCameraSimulation(page, true);
    await page.locator('[data-action="open-barcode-camera"]').click();
    await expect
      .poll(() => page.evaluate(() => window.cameraTest.requests))
      .toBe(1);
    await expect(page.locator("#content > .panel").first()).toHaveScreenshot(
      `${module}-camera-pending.png`,
    );
    await page.locator('[data-action="close-barcode-camera"]').click();
    await page.evaluate(() => window.cameraTest.allow());
    await expect
      .poll(() => page.evaluate(() => window.cameraTest.tracksStopped))
      .toBe(1);
    await expect(page.locator("#barcode-camera-panel")).toBeHidden();
    await expect(page.locator("#movement-form")).toHaveCount(0);
    await expect(page.locator("#content > .panel").first()).toHaveScreenshot(
      `${module}-camera-cancelled.png`,
    );
  });
  for (const exit of ["close", "navigate", "logout"]) {
    test(`${module}: 相機 ${exit} 釋放`, async ({ page }, testInfo) => {
      await enterScanModule(page, module, testInfo.project.name);
      await installCameraSimulation(page);
      await page.locator('[data-action="open-barcode-camera"]').click();
      await expect(page.locator("[data-camera-status]")).toContainText(
        "畫面中央",
      );
      if (exit === "close")
        await page.locator('[data-action="close-barcode-camera"]').click();
      if (exit === "navigate") {
        if (testInfo.project.name === "mobile")
          await page.locator("#menu-toggle").click();
        await page.locator('#module-nav [data-module="overview"]').click();
      }
      if (exit === "logout") {
        if (testInfo.project.name === "mobile")
          await page.locator("#menu-toggle").click();
        test.skip(!loginEnabled, "Demo 已暫停登入，沒有登出 UI");
        await page.locator("#logout").click();
      }
      // 路由切換後由 React effect 釋放資源，等待實際停止，仍須在期限內完成。
      await expect
        .poll(() => page.evaluate(() => window.cameraTest.tracksStopped))
        .toBeGreaterThan(0);
      await expect
        .poll(() => page.evaluate(() => window.cameraTest.decoderStopped))
        .toBeGreaterThan(0);
      await expect(
        page.locator(exit === "logout" ? "#login" : "#content"),
      ).toHaveScreenshot(`${module}-camera-${exit}.png`);
    });
  }
  for (const [errorName, message] of [
    ["NotFoundError", "找不到後鏡頭"],
    ["NotReadableError", "相機無法使用"],
  ] as const) {
    test(`${module}: ${errorName} 提示與重試`, async ({ page }, testInfo) => {
      await enterScanModule(page, module, testInfo.project.name);
      await page.evaluate((errorName) => {
        window.ZXingBrowser = {
          BrowserMultiFormatReader: class {},
        } as unknown as NonNullable<Window["ZXingBrowser"]>;
        Object.defineProperty(navigator, "mediaDevices", {
          configurable: true,
          value: {
            getUserMedia: async () => {
              throw new DOMException("", errorName);
            },
          },
        });
      }, errorName);
      await page.locator('[data-action="open-barcode-camera"]').click();
      await expect(page.locator("[data-camera-status]")).toContainText(message);
      await expect(page.locator("#content > .panel").first()).toHaveScreenshot(
        `${module}-${errorName}.png`,
      );
      await installCameraSimulation(page);
      await page.locator('[data-action="open-barcode-camera"]').click();
      await expect(page.locator("[data-camera-status]")).toContainText(
        "畫面中央",
      );
      await page.locator('[data-action="close-barcode-camera"]').click();
      await expect(page.locator("#barcode-camera-panel")).toBeHidden();
    });
  }
  test(`${module}: 辨識套件載入失敗後重試`, async ({ page }, testInfo) => {
    await enterScanModule(page, module, testInfo.project.name);
    await page.route("**/vendor/zxing-browser-0.2.1.min.js", (route) =>
      route.abort(),
    );
    await page.locator('[data-action="open-barcode-camera"]').click();
    await expect(page.locator("[data-camera-status]")).toContainText(
      "無法載入條碼辨識套件",
    );
    await expect(page.locator("#content > .panel").first()).toHaveScreenshot(
      `${module}-decoder-load-error.png`,
    );
    await page.unroute("**/vendor/zxing-browser-0.2.1.min.js");
    await installCameraSimulation(page);
    await page.locator('[data-action="open-barcode-camera"]').click();
    await expect(page.locator("[data-camera-status]")).toContainText(
      "畫面中央",
    );
    await page.locator('[data-action="close-barcode-camera"]').click();
  });
  test(`${module}: 不支援相機 API 時顯示提示`, async ({ page }, testInfo) => {
    await enterScanModule(page, module, testInfo.project.name);
    await page.evaluate(() =>
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: undefined,
      }),
    );
    await page.locator('[data-action="open-barcode-camera"]').click();
    await expect(page.locator("[data-camera-status]")).toContainText(
      "HTTPS 或 localhost",
    );
    await expect(page.locator("#content > .panel").first()).toHaveScreenshot(
      `${module}-camera-unsupported.png`,
    );
    await page.locator('[data-action="close-barcode-camera"]').click();
    await page.locator("#barcode").fill("9902000000001");
    await page.locator("#barcode").press("Enter");
    await expect(page.locator(".selection")).toContainText("醫用口罩");
  });
  test(`${module}: 快速重開相機只使用最新授權`, async ({ page }, testInfo) => {
    await enterScanModule(page, module, testInfo.project.name);
    await installCameraSimulation(page, true);
    await page.locator('[data-action="open-barcode-camera"]').click();
    await expect
      .poll(() => page.evaluate(() => window.cameraTest.requests))
      .toBe(1);
    await page.locator('[data-action="open-barcode-camera"]').click();
    await expect
      .poll(() => page.evaluate(() => window.cameraTest.requests))
      .toBe(2);
    await page.evaluate(() => window.cameraTest.pendingAllows[0]());
    await expect
      .poll(() => page.evaluate(() => window.cameraTest.tracksStopped))
      .toBe(1);
    await page.evaluate(() => window.cameraTest.pendingAllows[1]());
    await expect(page.locator("[data-camera-status]")).toContainText(
      "畫面中央",
    );
    await expect(page.locator("#content > .panel").first()).toHaveScreenshot(
      `${module}-camera-reopened.png`,
    );
    await page.locator('[data-action="close-barcode-camera"]').click();
    expect(await page.evaluate(() => window.cameraTest.tracksStopped)).toBe(2);
  });
  test(`${module}: 頁面背景化停止掃描，返回後可重開`, async ({
    page,
  }, testInfo) => {
    await enterScanModule(page, module, testInfo.project.name);
    await installCameraSimulation(page);
    await page.locator('[data-action="open-barcode-camera"]').click();
    await expect(page.locator("[data-camera-status]")).toContainText(
      "畫面中央",
    );
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect(page.locator("#barcode-camera-panel")).toBeHidden();
    expect(await page.evaluate(() => window.cameraTest.tracksStopped)).toBe(1);
    await page.evaluate(() => window.cameraTest.emit("9902000000001"));
    await expect(page.locator("#movement-form")).toHaveCount(0);
    await page.evaluate(() =>
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: false,
      }),
    );
    await page.locator('[data-action="open-barcode-camera"]').click();
    await expect(page.locator("[data-camera-status]")).toContainText(
      "畫面中央",
    );
    await expect(page.locator("#content > .panel").first()).toHaveScreenshot(
      `${module}-camera-resumed.png`,
    );
    await page.locator('[data-action="close-barcode-camera"]').click();
    expect(await page.evaluate(() => window.cameraTest.tracksStopped)).toBe(2);
  });
}
test("issue: 必填用途、庫存不足與修正重試", async ({ page }, testInfo) => {
  await enterScanModule(page, "issue", testInfo.project.name);
  await page.locator("#barcode").fill("9902000000001");
  await page.locator("#barcode").press("Enter");
  await page.locator('#movement-form [name="quantity"]').fill("241");
  await page.locator('#movement-form button[type="submit"]').click();
  expect(
    await page
      .locator('#movement-form [name="note"]')
      .evaluate((input) => (input as HTMLInputElement).validity.valueMissing),
  ).toBe(true);
  await page.locator('#movement-form [name="note"]').fill("庫存不足測試");
  await page.locator('#movement-form button[type="submit"]').click();
  await expect(page.locator("#movement-error")).toContainText("庫存不足");
  await expect(page.locator(".selection")).toContainText("帳面庫存 240");
  await expect(page.locator("#content > .panel").first()).toHaveScreenshot(
    "issue-insufficient.png",
  );
  await page.locator('#movement-form [name="quantity"]').fill("1");
  await page.locator('#movement-form button[type="submit"]').click();
  await expect(page.locator("#movement-form")).toHaveCount(0);
  await page.locator('[data-action="submit-voucher"]').click();
  await page.locator('#confirmation button[value="confirm"]').click();
  await expect(
    page.locator("#issue-movements-table tbody tr").filter({
      hasText: "庫存不足測試",
    }),
  ).toHaveCount(1);
});


test(
  "/demo/issue 直接進入與重新整理",
  { tag: "@critical" },
  async ({ page }, info) => {
    await checkPageEntry(page, "/demo/issue", info);
  },
);
