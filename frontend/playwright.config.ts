import { defineConfig, type Project } from "@playwright/test";

import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const buildOnly = process.env.PLAYWRIGHT_BUILD === "1";
const rwdOnly = process.env.PLAYWRIGHT_RWD === "1";
const port = Number(process.env.PLAYWRIGHT_PORT || 4173);
const baseURL = `http://127.0.0.1:${port}`;
const require = createRequire(import.meta.url);
const viteCli = join(
  dirname(require.resolve("vite/package.json")),
  "bin/vite.js",
);
const viteCommand = `"${process.execPath}" "${viteCli}"`;
const rwdProjects: Project[] = [
  { name: "rwd-small-phone", width: 320, height: 740 },
  { name: "rwd-phone", width: 390, height: 844 },
  { name: "rwd-tablet", width: 768, height: 1024 },
  { name: "rwd-desktop", width: 1440, height: 1000 },
].map((viewport) => ({
  name: viewport.name,
  testMatch: "**/rwd.test.ts",
  use: {
    browserName: "chromium",
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.width < 800,
    hasTouch: viewport.width < 800,
  },
}));
export default defineConfig({
  testDir: "./tests/pages",
  testMatch: "**/*.test.ts",
  outputDir: "./.artifacts/test-results",
  forbidOnly: !!process.env.CI,
  retries: 0,
  fullyParallel: true,
  workers: 2,
  reporter: [
    ["list"],
    [
      "html",
      {
        open: "never",
        outputFolder: buildOnly
          ? ".artifacts/reports/build"
          : ".artifacts/reports/ui",
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
      ? `${viteCommand} preview --host 127.0.0.1 --port ${port} --strictPort`
      : `${viteCommand} --mode test --host 127.0.0.1 --port ${port} --strictPort`,
    url: `${baseURL}/demo`,
    reuseExistingServer: false,
  },
  projects: buildOnly
    ? [
        {
          name: "build-desktop",
          testMatch: "**/build-smoke.test.ts",
          use: {
            browserName: "chromium",
            viewport: { width: 1440, height: 1000 },
          },
        },
        {
          name: "build-mobile",
          testMatch: "**/build-smoke.test.ts",
          use: {
            browserName: "chromium",
            viewport: { width: 390, height: 844 },
            isMobile: true,
            hasTouch: true,
          },
        },
      ]
    : rwdOnly
      ? rwdProjects
      : [
          {
            name: "desktop",
            testIgnore: ["**/rwd.test.ts", "**/build-smoke.test.ts"],
            use: {
              browserName: "chromium",
              viewport: { width: 1440, height: 1000 },
            },
          },
          {
            name: "mobile",
            testIgnore: ["**/rwd.test.ts", "**/build-smoke.test.ts"],
            use: {
              browserName: "chromium",
              viewport: { width: 390, height: 844 },
              isMobile: true,
              hasTouch: true,
            },
          },
        ],
});
