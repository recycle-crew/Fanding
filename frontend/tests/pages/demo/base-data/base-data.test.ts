import axe from "axe-core";
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
  await page.goto("/base-data");
  await expect(
    page.getByRole("heading", { name: "基礎資料管理", exact: true }),
  ).toBeVisible();
});

for (const noun of ["倉別", "供應商"]) {
  test(`@critical ${noun}必填標示、逐欄漏填阻擋與補齊儲存`, async ({
    page,
  }) => {
    await page.getByRole("tab", { name: `${noun}管理`, exact: true }).click();
    await page
      .getByRole("button", { name: `新增${noun}`, exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    const fields =
      noun === "倉別"
        ? [
            ["倉別代碼", "REQ-E2E"],
            ["倉別名稱", "必填測試倉"],
          ]
        : [["供應商名稱", "必填測試供應商"]];
    for (const [label, value] of fields) {
      const input = dialog.getByLabel(label, { exact: true });
      await expect(input).toHaveAttribute("required", "");
      await expect(
        dialog.locator(`label[for="${await input.getAttribute("id")}"]`),
      ).toContainText("*");
      await dialog.getByRole("button", { name: "儲存", exact: true }).click();
      await expect(dialog.getByRole("alert")).toContainText(label);
      await expect(dialog.getByRole("alert")).toBeVisible();
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await input.fill(value);
    }
    await dialog.getByRole("button", { name: "儲存", exact: true }).click();
    await expect(dialog).toBeHidden();
    await page
      .getByRole("textbox", { name: `搜尋${noun}`, exact: true })
      .fill(fields.at(-1)![1]);
    await expect(page.locator("tbody tr:visible")).toHaveCount(1);
    await expect(page.locator("tbody tr:visible")).toContainText(
      fields.at(-1)![1],
    );
  });
}

test("倉別開關可用鍵盤切換，且不會誤送出表單或開啟視窗", async ({ page }) => {
  const control = page.getByRole("switch", { name: "停用主倉庫", exact: true });
  await expect(control).toBeChecked();
  await control.focus();
  await page.keyboard.press("Space");
  const disabled = page.getByRole("switch", {
    name: "啟用主倉庫",
    exact: true,
  });
  await expect(disabled).not.toBeChecked();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await disabled.click();
  await expect(
    page.getByRole("switch", { name: "停用主倉庫", exact: true }),
  ).toBeChecked();
});

test("@critical 倉別新增、重複、唯讀代碼、取消與刪除", async ({ page }) => {
  await page.getByRole("button", { name: "新增倉別", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("倉別代碼").fill("MAIN");
  await dialog.getByLabel("倉別名稱").fill("測試倉庫");
  await dialog.getByRole("button", { name: "儲存", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("已存在");
  await dialog.getByLabel("倉別代碼").fill("NEW");
  await dialog.getByRole("button", { name: "儲存", exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole("textbox", { name: "搜尋倉別" }).fill("測試倉庫");
  await page.getByRole("button", { name: "編輯測試倉庫", exact: true }).click();
  await expect(dialog.getByLabel("倉別代碼")).toHaveAttribute("readonly", "");
  await dialog.getByLabel("倉別名稱").fill("不儲存");
  await dialog.getByRole("button", { name: "取消", exact: true }).click();
  await expect(dialog.getByText("尚有未儲存變更")).toBeVisible();
  await dialog.getByRole("button", { name: "繼續編輯" }).click();
  await expect(dialog.getByLabel("倉別名稱")).toHaveValue("不儲存");
  await dialog.getByRole("button", { name: "關閉視窗" }).click();
  await dialog.getByRole("button", { name: "放棄變更" }).click();
  await page.getByRole("button", { name: "刪除測試倉庫", exact: true }).click();
  await dialog.getByRole("button", { name: "確認刪除" }).click();
  await expect(
    page.getByRole("button", { name: "編輯測試倉庫", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "清除", exact: true }).click();
  await page.getByRole("button", { name: "刪除主倉庫", exact: true }).click();
  await expect(dialog).toContainText("無法刪除");
  await expect(dialog.getByRole("button", { name: "確認刪除" })).toHaveCount(0);
});

test("@critical 供應商驗證、搜尋、狀態、頁籤鍵盤及匯出", async ({ page }) => {
  await page.getByRole("tab", { name: "倉別管理" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "供應商管理" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.getByRole("button", { name: "新增供應商", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("供應商名稱").fill("新增廠商");
  await dialog.getByLabel("統一編號").fill("123");
  await dialog.getByRole("button", { name: "儲存", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("8 位數字");
  await dialog.getByLabel("統一編號").fill("12345678");
  await dialog.getByLabel("Email", { exact: true }).fill("invalid");
  await dialog.getByRole("button", { name: "儲存", exact: true }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await dialog.getByLabel("Email", { exact: true }).fill("test@example.com");
  await dialog.getByRole("button", { name: "儲存", exact: true }).click();
  await page.getByRole("textbox", { name: "搜尋供應商" }).fill("新增廠商");
  await expect(page.locator("tbody tr:visible")).toHaveCount(1);
  await page.getByRole("switch", { name: "停用新增廠商" }).click();
  await page.getByLabel("啟用狀態", { exact: true }).selectOption("active");
  await expect(page.getByRole("button", { name: "編輯新增廠商" })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "清除", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /匯出/ }).click();
  expect((await download).suggestedFilename()).toMatch(/\.xlsx$/);
});

test("無障礙與桌面／手機版面", async ({ page }, testInfo) => {
  async function audit() {
    await page.addScriptTag({ content: axe.source });
    const violations = await page.evaluate(
      async () =>
        (
          await window.axe.run(
            document.querySelector('[role="dialog"]') ||
              document.querySelector(".base-data-page"),
            {
              runOnly: {
                type: "tag",
                values: ["wcag2a", "wcag2aa", "wcag21aa"],
              },
            },
          )
        ).violations,
    );
    expect(violations).toEqual([]);
  }
  await audit();
  await page.screenshot({ path: testInfo.outputPath("base-data-list.png") });
  await page.getByRole("button", { name: "新增倉別", exact: true }).click();
  await audit();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("button", { name: "儲存", exact: true }),
  ).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath("base-data-form.png") });
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("button", { name: "新增倉別", exact: true }),
  ).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBeTruthy();
});

test(
  "/base-data 直接進入與重新整理",
  { tag: "@critical" },
  async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-20T08:00:00Z"));
    await page.goto("/base-data");
    await expect(page.locator("#workspace")).toBeVisible();
    await expect(
      page.locator("#workspace").getByRole("heading").first(),
    ).not.toBeEmpty();
    await expect(page).toHaveURL((url) => url.pathname === "/base-data");
    const entryURL = page.url();
    await page.reload();
    await expect(page).toHaveURL(entryURL);
    await expect(page.locator("#workspace").first()).toBeVisible();
  },
);
