import { expect as baseExpect, test as baseTest, type Page, type TestInfo } from "@playwright/test";
import { readFileSync } from "node:fs";
import { captureExpect } from "./capture";

export const test = baseTest.extend<{ fixedClock: void; reduxIntegrity: void }>({
  fixedClock: [async ({ page }, use) => {
    await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
    await use();
  }, { auto: true }],
  reduxIntegrity: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on("console", message => {
      if (/non-serializable|A state mutation was detected/i.test(message.text())) errors.push(message.text());
    });
    await use();
    baseExpect(errors, "Redux action／state 必須可序列化，且不得直接變更 state").toEqual([]);
  }, { auto: true }],
});

export const expect: typeof baseExpect = process.env.UI_CAPTURE === "1" ? captureExpect : baseExpect;
export const loginEnabled = /DEMO_LOGIN_ENABLED\s*=\s*true/.test(
  readFileSync(new URL("../../src/constants/demoAccess.ts", import.meta.url), "utf8"),
);

export async function enterWorkspace(page: Page, privileged = false) {
  if (loginEnabled) {
    if (privileged) await page.locator("#demo-permission").selectOption("privileged");
    await page.locator("#login-form button[type=submit]").click();
  } else if (privileged) {
    await page.evaluate(() => window.__demoTest.run(state => {
      state.canEditExistingData = true;
    }));
  }
  await expect(page.locator("#workspace")).toBeVisible();
}

export async function checkPageEntry(page: Page, route: string, info: TestInfo) {
  await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
  await page.goto(route);
  if (route.startsWith("/demo")) {
    await expect(page.locator("#workspace")).toBeVisible();
    await expect(page.locator("#workspace").getByRole("heading").first()).not.toBeEmpty();
  } else {
    await expect(page.getByRole("heading", { level: 1 }).first()).not.toBeEmpty();
  }
  const expectedPath = route === "/demo/items" ? "/demo/items/his" : route;
  await expect.poll(() => new URL(page.url()).pathname).toBe(expectedPath);
  const resolved = page.url();
  await page.reload();
  await expect(page).toHaveURL(resolved);
  await expect(page.locator(route.startsWith("/demo") ? "#workspace" : "h1").first()).toBeVisible();
  await info.attach("頁面", { body: await page.screenshot(), contentType: "image/png" });
}
