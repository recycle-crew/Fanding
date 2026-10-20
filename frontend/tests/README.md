# 測試：依頁面與程式歸屬

UI 行為用 Playwright，非 UI 邏輯用 Vitest。頁面的定義沿用現有 route，檔名統一使用 `.test`，由搜尋目錄區分執行工具。

```text
src/store/
├─ baseData.ts
└─ baseData.test.ts           Vitest：測試就在受測程式旁

tests/
├─ pages/                    Playwright：對應現有 route
│  ├─ index/                 /
│  ├─ architecture/          /architecture
│  ├─ board/                 /board
│  └─ demo/
│     ├─ base-data/          /demo/base-data
│     ├─ consumptions/       /demo/consumptions 與其子路由
│     ├─ purchases/          /demo/purchases
│     ├─ items/              /demo/items 與其子路由
│     └─ …                   其他現有 route
├─ setup.ts                  Vitest 日期與 mock 清理
├─ tsconfig.json             瀏覽器測試的型別檢查設定
├─ types/                    測試型別，依用途與來源資料夾分類
│  └─ browser.d.ts           測試環境的瀏覽器型別
└─ README.md
```

不再按 fixtures、flows、journeys、smoke、visual 建立目錄。跨頁操作歸到起始頁。RWD 與正式產物檢查是執行模式，目前共用工作區檢查放在 `pages/demo/`。

每頁入口檢查併入該頁的既有測試；尚無其他行為案例的 route 使用 `page.test.ts`。頁內依查詢、新增、修改等行為分組，需要時才拆檔。

## 執行方式

在專案根目錄或 `frontend` 都能執行：

```powershell
# Vitest UI：非 UI 邏輯測試
npm run test:unit:ui

# Playwright UI：依 route 查看頁面行為
npm run test:e2e:ui

# 只跑進貨頁
npm run test:e2e -- demo/purchases

# 一次執行所有非 UI 邏輯測試
npm run test:unit

# 執行所有頁面行為
npm run test:e2e
```

Vitest 只收集 `src/**/*.test.ts`，使用 Node 環境。Playwright 只收集 `tests/pages/**/*.test.ts`。不以 `.test`／`.spec` 區分兩套工具。

`test:e2e` 驗證操作與資料結果，明確略過舊的像素比對。`test:ui`／`test:visual` 包含頁面截圖比對；`test:ui:rwd` 使用四種寬度跑既有 RWD 檢查。既有基準是 Windows Chromium，Linux CI 不比較這些基準。

Playwright 自動啟動伺服器。port 已被占用時，先設定 `$env:PLAYWRIGHT_PORT = "4198"`。Vitest UI 請使用終端輸出的完整網址，包含驗證 token。Ctrl+C 結束介面。

## 截圖與執行產物

截圖基準集中放在各測試目錄的 `screenshots/<測試檔名>/`，例如 `receipt/screenshots/barcode.test.ts/`，需提交 Git。保留完整測試檔名，方便對應來源；圖片檔名保留裝置與平台，避免不同執行環境互相覆蓋。搬移只調整位置，不重新產生圖片。

失敗附件、報告、檢視截圖統一輸出到 `frontend/.artifacts/`，不提交 Git。舊的 anchor-audit 結果移至 `.artifacts/archive/` 保留，不再散落在 frontend 根目錄。

`test:ui:report` 查看 `.artifacts/reports/ui`；`test:ui:build:report` 查看正式產物報告。截圖差異先檢查原因，確認符合需求才用 `test:ui:update` 更新基準。

## 歸屬與維護規則

- Playwright 測試直接從 `@playwright/test` 匯入 `test`、`expect`。路由載入與重新整理的檢查直接寫在所屬測試；登入開關直接匯入 `src/constants/demoAccess.ts`。
- Page 的表單、子元件互動、鍵盤、畫面、錯誤與取消行為寫在所屬 route 的 Playwright 測試。
- 計算、store、驗證、資料轉換與未來的 request 邏輯，將 `.test.ts` 放在受測 `.ts` 旁。
- `interface` 統一放在 `src/types`，依領域或來源資料夾分類（例如 `types/items`、`types/demo`、`types/store`、`types/helpers`），實作檔使用 `import type` 引用。測試專用型別放在 `tests/types`，同樣依來源資料夾分類；不在元件、model、store 或 helper 內宣告 `interface`。
- 子元件與必要的 store 使用真實實作；需要模擬時從網路邊界處理。現有 Demo 沒有正式 HTTP client，不建立空的 request 模組。
- 每個瀏覽器情境使用獨立 context，測試資料留在記憶體。需要固定日期的測試，在案例或 `test.beforeEach` 中直接呼叫 Playwright 的 `page.clock.setFixedTime()`。Vitest 每次清理 mock 與假計時器。
- 依頁面功能涵蓋成功、載入、空資料、驗證、失敗、重試、取消、權限及重複送出。重要流程加 `@critical`；route 對應測試會檢查頁面入口案例是否存在。
- Demo 登入暫停時，依賴登入／登出 UI 的舊情境會說明原因後跳過。

## CI 與發布

已加入 `.github/workflows/frontend-tests.yml`。推送後，PR 執行 typecheck、Vitest、頁面行為與正式產物檢查，並保留失敗附件。要禁止失敗 PR 合併，GitHub 分支規則仍須將 `frontend-quality` 設為必要檢查。

上線前可先 `npm run build`，再 `npm run test:ui:build -- --ignore-snapshots`。這不代表部署後主機、真實資料庫、HIS 或實體設備已驗證。

本次目錄收斂不會更新舊截圖，也不把未完成重跑的舊 RWD 情境視為通過。

所有頁面測試與共用工具均使用 TypeScript 和 ESM import。`npm run typecheck` 依序檢查應用程式與 `tests/tsconfig.json`，CI 沿用同一指令。Playwright 執行 TS 本身不代表型別檢查通過。
