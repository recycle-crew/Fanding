import { test, expect } from "../../../helpers/test";

test(
  "搜尋與倉別、庫存條件取交集，無結果後可清除並恢復列表",
  { tag: "@critical" },
  async ({ page }, info) => {
    // 共用 fixture 固定日期；每個案例有獨立瀏覽器 context 與 Demo 資料。
    // 全程操作 UI，不直接改 Redux，也不 mock 元件或篩選邏輯。
    const results = page.getByRole("table", {
      name: "品項與庫存查詢結果",
      exact: true,
    });
    const search = page.getByRole("textbox", { name: "搜尋品項" });
    const warehouse = page.getByRole("combobox", { name: "倉別", exact: true });
    const stock = page.getByRole("combobox", { name: "庫存狀態", exact: true });
    const item = results.getByRole("row").filter({ hasText: "MED0001" });
    const count = page
      .getByRole("region", { name: "新版品項與庫存管理", exact: true })
      .getByRole("status");

    await test.step("進入 HIS 品項頁，確認初始資料", async () => {
      await page.goto("/demo/items/his");
      await expect(
        page.getByRole("heading", { name: "品項與庫存管理", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("tab", { name: "HIS 藥品", exact: true }),
      ).toHaveAttribute("aria-selected", "true");
      // 1 列表頭 + 6 筆品項；空結果也有一列提示，不能只斷言有 row。
      await expect(results.getByRole("row")).toHaveCount(7);
      await expect(
        item.getByRole("cell", { name: "35", exact: true }),
      ).toBeVisible();
    });

    await test.step("搜尋人工淚液並切到診間倉庫，驗證數量與全倉安全庫存規則", async () => {
      await search.fill("人工淚液");
      await expect(results.getByRole("row")).toHaveCount(2);
      await expect(item).toContainText("人工淚液");

      await warehouse.selectOption({ label: "診間倉庫" });
      await expect(
        item.getByRole("cell", { name: "診間倉庫", exact: true }),
      ).toBeVisible();
      await expect(
        item.getByRole("cell", { name: "15", exact: true }),
      ).toBeVisible();
      // 診間可用量 15，全倉可用量 35；安全庫存狀態依全倉判斷。
      await expect(
        item.getByRole("cell", { name: "正常", exact: true }),
      ).toBeVisible();
      await info.attach("搜尋與倉別結果", {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
      });
    });

    await test.step("再選低庫存，驗證條件取交集與空結果操作", async () => {
      await stock.selectOption({ label: "低庫存" });
      await expect(item).toHaveCount(0);
      await expect(results).toContainText("找不到符合條件的品項");
      await expect(count).toHaveText("共 0 筆");
      await expect(
        page.getByRole("button", { name: "匯出 Excel", exact: true }),
      ).toBeDisabled();
    });

    await test.step("從空結果清除條件，確認欄位與列表同步恢復", async () => {
      await results
        .getByRole("button", { name: "清除條件", exact: true })
        .click();
      await expect(search).toHaveValue("");
      await expect(warehouse).toHaveValue("");
      await expect(stock).toHaveValue("");
      await expect(
        page.getByRole("combobox", { name: "啟用狀態", exact: true }),
      ).toHaveValue("active");
      await expect(results.getByRole("row")).toHaveCount(7);
      await expect(
        item.getByRole("cell", { name: "35", exact: true }),
      ).toBeVisible();
      await expect(count).toHaveText("共 6 筆，顯示 1–6 筆");
      await expect(
        page.getByRole("button", { name: "匯出 Excel", exact: true }),
      ).toBeEnabled();
      await info.attach("清除後恢復列表", {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
      });
    });
  },
);
