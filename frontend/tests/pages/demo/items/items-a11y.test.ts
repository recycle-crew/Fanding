import axe from "axe-core";
import { test, expect } from "../../../helpers/test";
import type { Page } from "@playwright/test";

async function audit(page: Page) {
  await page.addScriptTag({ content: axe.source });
  const results = await page.evaluate(async () => {
    const result = await window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
    });
    return result.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    }));
  });
  expect(results).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/demo/items");
  await expect(
    page.getByRole("heading", { name: "品項與庫存管理", exact: true }),
  ).toBeVisible();
});

test("a11y 列表、一般商品與空結果", async ({ page }) => {
  await audit(page);
  await page
    .getByRole("tab", { name: "自費／OTC／其他商品", exact: true })
    .click();
  await audit(page);
  await page.getByRole("textbox", { name: "搜尋品項" }).fill("沒有這個商品");
  await audit(page);
});

test("a11y 鍵盤頁籤、視窗焦點限制與回復", async ({ page }) => {
  const skip = page.getByRole("link", { name: "跳至主要內容", exact: true });
  await skip.focus();
  await expect(skip).toBeInViewport();
  await skip.press("Enter");
  await expect(page.locator("#content")).toBeFocused();
  const his = page.getByRole("tab", { name: "HIS 藥品", exact: true });
  const general = page.getByRole("tab", {
    name: "自費／OTC／其他商品",
    exact: true,
  });
  await his.focus();
  await his.press("ArrowRight");
  await expect(general).toBeFocused();
  await expect(general).toHaveAttribute("aria-selected", "true");
  await general.press("Home");
  await expect(his).toBeFocused();
  await expect(general).toHaveAttribute("tabindex", "-1");
  await his.press("End");
  await expect(general).toBeFocused();
  await general.press("ArrowRight");
  await expect(his).toBeFocused();
  const opener = page.getByRole("button", {
    name: "查看人工淚液",
    exact: true,
  });
  await opener.click();
  const modal = page.locator(".items-modal");
  await expect(
    modal.getByRole("heading", { name: "庫存批號明細", exact: true }),
  ).toBeFocused();
  await expect(modal).toHaveAttribute("aria-modal", "true");
  for (let n = 0; n < 20; n++) {
    await page.keyboard.press(n < 10 ? "Tab" : "Shift+Tab");
    expect(
      await modal.evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true);
  }
  const batches = page.getByRole("tab", { name: "批號庫存", exact: true });
  await batches.focus();
  await batches.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "庫存異動", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
});

test("a11y 表單錯誤關聯、放棄提醒與穩定開關名稱", async ({ page }) => {
  await page.getByRole("button", { name: "新增品項", exact: true }).click();
  const modal = page.locator(".items-modal");
  await modal.getByRole("button", { name: "儲存品項", exact: true }).click();
  await expect(page.locator("#items-editor-error")).toBeFocused();
  await expect(page.locator("#item-name")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.locator("#item-name")).toHaveAttribute(
    "aria-describedby",
    "items-editor-error",
  );
  await page.locator("#item-name").fill("不儲存");
  await page.keyboard.press("Escape");
  await expect(
    modal.getByRole("button", { name: "繼續編輯", exact: true }),
  ).toBeFocused();
  await modal.getByRole("button", { name: "放棄修改", exact: true }).click();
  const toggle = page.getByRole("switch", {
    name: "啟用品項：人工淚液",
    exact: true,
  });
  await toggle.click();
  await modal.getByRole("button", { name: "確認停用", exact: true }).click();
  await page.locator("#items-filter-active").selectOption("all");
  await expect(toggle).toHaveAttribute("aria-checked", "false");
});

test("a11y 320px 重排與減少動態效果", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "新增品項", exact: true }).click();
  await expect(
    page
      .locator(".items-modal")
      .getByRole("button", { name: "儲存品項", exact: true }),
  ).toBeInViewport();
  await audit(page);
});

test("a11y 新增、編輯、錯誤及放棄提醒", async ({ page }) => {
  await page.getByRole("button", { name: "新增品項", exact: true }).click();
  await audit(page);
  await page.locator("#item-name").fill("鍵盤測試");
  await page.locator("#item-code").fill("MED0001");
  await page.locator("#item-category").selectOption("眼科用藥");
  await page.locator("#item-unit").selectOption("瓶");
  await page
    .locator(".items-modal")
    .getByRole("button", { name: "儲存品項", exact: true })
    .click();
  await audit(page);
  await page
    .locator(".items-modal")
    .getByRole("button", { name: "關閉視窗" })
    .click();
  await audit(page);
});

test("a11y 批號、異動、成本與停用視窗", async ({ page }) => {
  await page.getByRole("button", { name: "查看人工淚液", exact: true }).click();
  await audit(page);
  await page.getByRole("tab", { name: "庫存異動", exact: true }).click();
  await audit(page);
  await page.getByRole("tab", { name: "進貨成本歷史", exact: true }).click();
  await audit(page);
  await page
    .locator(".items-modal")
    .getByRole("button", { name: "關閉視窗" })
    .click();
  await page
    .getByRole("switch", { name: "啟用品項：人工淚液", exact: true })
    .click();
  await audit(page);
});
