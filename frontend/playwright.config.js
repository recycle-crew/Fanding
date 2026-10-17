import { defineConfig } from "@playwright/test";

const buildOnly = process.env.PLAYWRIGHT_BUILD === "1";
const port = Number(process.env.PLAYWRIGHT_PORT || 4173);
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
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
    baseURL,
    locale: "zh-TW",
    timezoneId: "Asia/Taipei",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: buildOnly
      ? `npm run preview -- --port ${port}`
      : `npm run dev:test -- --port ${port}`,
    url: `${baseURL}/demo`,
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
