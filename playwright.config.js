const { defineConfig } = require("@playwright/test");

const buildOnly = process.env.PLAYWRIGHT_BUILD === "1";
module.exports = defineConfig({
  testDir: "./tests/ui",
  fullyParallel: true,
  workers: 2,
  reporter: [
    ["list"],
    [
      "html",
      {
        open: "never",
        outputFolder: buildOnly
          ? "playwright-report/build"
          : "playwright-report/ui",
      },
    ],
  ],
  expect: {
    toHaveScreenshot: { animations: "disabled", maxDiffPixelRatio: 0.002 },
  },
  use: {
    baseURL: "http://127.0.0.1:4173",
    locale: "zh-TW",
    timezoneId: "Asia/Taipei",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: buildOnly ? "npm run preview" : "npm run dev:test",
    url: "http://127.0.0.1:4173/demo.html",
    reuseExistingServer: false,
  },
  projects: buildOnly
    ? [
        {
          name: "build-desktop",
          testMatch: "**/build-smoke.spec.js",
          use: {
            browserName: "chromium",
            viewport: { width: 1440, height: 1000 },
          },
        },
        {
          name: "build-mobile",
          testMatch: "**/build-smoke.spec.js",
          use: {
            browserName: "chromium",
            viewport: { width: 390, height: 844 },
            isMobile: true,
            hasTouch: true,
          },
        },
      ]
    : [
        {
          name: "desktop",
          testIgnore: ["**/rwd.spec.js", "**/build-smoke.spec.js"],
          use: {
            browserName: "chromium",
            viewport: { width: 1440, height: 1000 },
          },
        },
        {
          name: "mobile",
          testIgnore: ["**/rwd.spec.js", "**/build-smoke.spec.js"],
          use: {
            browserName: "chromium",
            viewport: { width: 390, height: 844 },
            isMobile: true,
            hasTouch: true,
          },
        },
        ...[
          { name: "rwd-small-phone", width: 320, height: 740 },
          { name: "rwd-phone", width: 390, height: 844 },
          { name: "rwd-tablet", width: 768, height: 1024 },
          { name: "rwd-desktop", width: 1440, height: 1000 },
        ].map((viewport) => ({
          name: viewport.name,
          testMatch: "**/rwd.spec.js",
          use: {
            browserName: "chromium",
            viewport: { width: viewport.width, height: viewport.height },
            isMobile: viewport.width < 800,
            hasTouch: viewport.width < 800,
          },
        })),
      ],
});
