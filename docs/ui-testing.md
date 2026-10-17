# 畫面案例驗證

## Layout、Tailwind 與 RWD

共用頁面骨架由 BaseLayout 組合 BaseHeader、可選的 BaseSidebar、BaseFooter。Planning／Architecture 共用文件頁版型；Demo 維持登入與工作區流程，並由 BaseLayout 承載側欄和頂部導覽。

五個 pages 模組的 Layout 只呼叫 BaseLayout，依固定 variant 選擇文件、規劃板、工作區或無導覽外框；BaseLayout 組合共用元件並由 Outlet 承載子頁，不傳遞業務 context。Demo 的登入、密碼重設、展示橫幅、通知、分頁 Provider、展示初始化、路由同步與對話框內容由 Home 擁有；側欄負責自己的導覽與登出，App 保護未完成表單。BaseLayout 只管理框架顯示、側欄尺寸與手機選單。

「RWD Layout 外框與 Home 登入流程及切頁保護」涵蓋四種尺寸的登入／重設／工作區／切頁阻擋／登出，驗證同一路由收合選單、上一頁／下一頁及登入欄位跨模組保留，並附上實際畫面。「RWD Demo Layout 承載子頁並保留工作區」保留既有側欄／頁首節點與畫面基準比對。附件截圖需另行檢視，不能將操作通過視為舊基準比對通過。

2026-10-17 本次責任調整：`npm run build`（含 TypeScript）通過；`npx playwright test rwd.spec.js spa.spec.js react-flows.spec.js --ignore-snapshots` 共 232 次通過（7.5 分鐘），此輪僅代表操作與響應式斷言通過。四尺寸登入、重設、工作區、阻擋切頁及登出另擷取 20 張畫面並檢視，保存在 `frontend/ui-review/layout-home/`。舊基準比對與正式 dist 結果另列，不以此數量宣稱全站截圖回歸通過。相機／掃碼槍仍為模擬，NAS LDAP、HIS 與後端正式整合未驗收。

後續截圖擷取發現側欄同時使用 sticky／fixed 的定位衝突，已改成互斥 class；通知改為點擊穿透，手機案例先收合選單再回到表單。追加驗證期間工作樹又導入 shadcn／Radix（BaseModal、Tailwind、套件與其他 UI 元件），新 BaseModal 出現 `Cannot read properties of null (reading 'open')`，這輪擷取未全部通過；已停止測試，未更新截圖基準。上述 232 次結果屬於此批 UI 改寫前，不能視為目前工作樹的完整驗收。最新樣式整合後的基準比對、浮動側欄重驗及正式 dist 瀏覽器檢查仍待完成。

Tailwind CSS 4.3.3 由官方 Vite plugin 編譯，Tailwind utilities 與 `@apply` 共用語意樣式涵蓋規劃、架構、規劃板及 Demo。響應式使用 mobile-first 預設斷點，未加前綴的 class 用於小尺寸，再由 `sm`（640px）、`md`（768px）、`lg`（1024px）覆蓋；`xl`（1280px）與 `2xl`（1536px）沿用 Tailwind 預設值。RWD 案例涵蓋 320／390／768／1440px，並核對本次使用的 sm／md／lg 邊界兩側：639／640、767／768、1023／1024px。瀏覽器驗證與截圖依各次任務實際執行狀態記錄。原生表格捲動、列印、鍵盤操作與 reduced-motion 樣式仍保留。

2026-10-16 驗證結果：Windows Chromium 156.0.8078.4，TypeScript、正式 build、Prettier 與 diff 檢查通過。第二輪完整執行 348 次，其中 346 次通過、2 次相機切頁釋放檢查過早讀取結果而失敗；這兩項改為以有時限的 expect.poll 等待 React effect 實際停止串流與 decoder，入／出庫 close／navigate／logout 的電腦與手機共 12 次重跑全部通過（19.5 秒）。合併完成 348 個不同案例的驗證，不宣稱一次完整 348 次全綠。其中 49 個 RWD 案例 × 4 種尺寸共 196 次在第二輪全部通過。正式 frontend/dist 另外 8 次通過（10.8 秒），包含單一 HTML、Markdown、深連結、iframe、XLSX 與本機掃碼 SDK。

首輪完整回歸為 316 次通過、32 次規劃板截圖失敗（7.5 分鐘）；原因是同一段 @apply 中的 border／border-top 排序使畫布多出 1px 上邊框。拆開覆寫後，第二輪（7.1 分鐘）的原有 32 張規劃板基準全部通過，未更新它們。max-width 變體另按大到小排列，確保較窄斷點優先；畫布背景色同步清除原底圖，保留原本純色畫面。

新增 22 張目錄、共用 Layout 與斷點截圖均先擷取並檢視後接受。架構文件內容調整使既有錨點截圖出現次像素差異，電腦／手機各連續擷取三次相同，檢視後只更新這兩張；SHA256 分別為 `25E7E7BD4515C9A87389442B017E237C26FA7701C96CD5E909054A8EAE2D85B8`、`17D0CC4D124742B7D1E382D3C37199D56856A2E11CB093A57A7107178234E041`。截圖容許值不變。

完整執行報告保留在 frontend/playwright-report/ui（含上述 2 項過早檢查），修正後的 12 次報告在 frontend/playwright-report/ui-recheck，正式產物報告在 frontend/playwright-report/build。可從根目錄執行 `npx playwright show-report frontend/playwright-report/ui-recheck` 查看重跑結果。相機與掃碼槍仍使用模擬；實機、NAS／HIS、後端／資料庫與正式主機部署未列為已驗收。列印及 reduced-motion 保留規則，本輪未另作獨立畫面驗收。

## IA_Map 組織與 Redux

前端套件、Playwright 設定、scripts 與 tests 已集中到 frontend，根目錄 npm 指令以 workspace 轉送，frontend 內也可直接執行同名指令。截圖基準位於 frontend/tests/ui，報告位於 frontend/playwright-report，擷取圖位於 frontend/ui-review；正式產物位於 frontend/dist。

現有跨元件展示狀態由 Redux Toolkit 管理，store/index.ts 建立 store，store/hooks.ts 提供型別化 hook，原有 Context 已移除。更新 callback 與業務交易在 thunk 執行，再以可序列化 patches 更新 store；reducer 不讀取時間或執行 callback。testBridge 僅於 test 模式安裝，直接讀取最新 Redux state，以同步派送 patches 建立特殊案例；正式 build 不安裝測試入口。

所有瀏覽器案例共用 Redux 完整性檢查：若 console 出現 action／state 不可序列化或直接修改 state 的訊息，案例即失敗，不停用 Redux middleware。RWD 的 SPA 案例另驗證深層路由重新整理後可正常顯示與操作。

## SPA 驗證

2026-10-16 最終結果：Windows Chromium 156.0.8078.4，TypeScript 與正式 build 通過；一般截圖比對完整 334 次通過（6.9 分鐘），之後新增的延遲載入案例在電腦／手機另跑 2 次通過，合計 336 個不同案例執行；其中 RWD 為 46 個案例 × 4 種尺寸共 184 次。正式 dist 另有 8 次通過（11.8 秒），包含單一 HTML、Markdown 文件資源、深連結、iframe、XLSX 與本機掃碼 SDK。這是分次執行的結果，不是一次完整 336 次的報告。

首輪完整回歸 331 通過、3 個桌面側欄案例失敗；確認共用捲動重設會改變 Demo 黏附側欄位置後，改由 Demo 自行管理捲動，並讓尺寸測試等待側欄縮至 180px，再完成上述第二輪完整比對。架構頁沿用原本 planning-page，四種尺寸與原截圖完全一致；既有基準未變更，僅新增 SPA 畫面基準，容許值維持 0.002。

全站使用單一 `frontend/index.html`，由 React Router 管理 `/`、`/architecture`、`/board` 與 `/demo` 子路由。舊 HTML 網址僅為前端轉向相容路由，不另產生 HTML。正式主機必須對非既存檔案／目錄回退 index.html；dev／preview 的通過結果不代表正式主機已設定完成。

`spa.spec.js` 驗證跨頁沒有主視窗 document 請求、登入／新增資料保留、深層路由重新整理、舊網址與 query、文件錨點與表格分頁、找不到頁面，以及模組下載失敗後重試。`react-flows.spec.js` 的盤點案例以瀏覽器上一頁驗證未完成表單路由保護；`rwd.spec.js` 新增四種尺寸的 SPA 導覽與找不到頁面案例。`build-smoke.spec.js` 另確認 dist 遞迴只有一份 index.html。

新增及變更畫面先執行 capture 並檢視實際 Chromium 截圖，再只接受對應基準；不改動截圖容許值。頁面測試必須先等可見標題／登入表單，不能以延遲載入中的空白畫面作為基準。相機／掃碼槍仍採模擬，正式 NAS／HIS、資料庫及設備整合仍待驗收。

以下 React 重構的 322 次與 build 8 次為 SPA 遷移前的歷史紀錄。

React 版本的測試會自動啟動 Vite `test` 模式。頁面就緒以可見表單／標題判斷，不依賴舊版全域渲染函式。特殊庫存、跨日、序號上限等情境由 `testBridge.ts` 在測試模式提供資料初始化；正式 build 不載入這個模組。

測試入口等待畫面週期後才讀取最新狀態；純讀取不派送更新，初始化變更則同步提交，避免測試用的舊快照覆寫尚在提交的 React 狀態。傳票重試也先確認畫面已鎖定送出，再檢查庫存。

需要先檢視畫面時，可執行 `npm run test:ui:capture`；它把實際 Chromium 截圖與案例資訊寫到忽略追蹤的 `frontend/ui-review/`，不比對或改寫基準。這是視覺檢查前的擷取步驟，不能代替一般 `npm run test:ui` 的截圖比較。正式 build 可用 `npm run test:ui:capture -- --build` 先擷取畫面。完成檢視後才接受必要的基準變更，再以一般模式重跑。

流程規劃板的縮圖先依場景等待登入、編輯或工作區實際顯示，再擷取畫面，避免把 React 尚未載入的空白 iframe 當成基準。原生數字驗證案例會核對錯誤訊息、stepMismatch、焦點及未送出資料，再把焦點移至備註欄後擷取穩定表單；Chromium 原生驗證泡泡的位置不納入像素基準，應用程式的錯誤提示仍直接比對。

一般報告在 `frontend/playwright-report/ui/`，build 報告在 `frontend/playwright-report/build/`；分別以 `npm run test:ui:report` 與 `npm run test:ui:build:report` 開啟。

2026-10-16 React 重構先保留原版 296 次流程／RWD 通過紀錄，再擷取 React 實際畫面，檢視新增及有差異的截圖後接受必要基準。一般比對發現 320px 廠商導覽文字位置差一像素；獨立重跑三次的實際圖片均為 SHA256 `C72DDE48035036605EED8A7F628568333DEA29DD3AEC746A7A7878C1935335B0`，檢視後只修正這張基準，截圖容許值維持 0.002。

最終驗證：Windows Chromium 156.0.8078.4，`npm run typecheck`、`npm run build` 通過；`npm run test:ui` 一般截圖比對完整 322 次通過（6.8 分鐘），其中 RWD 45 個案例 × 320／390／768／1440px 共 180 次，其餘電腦／手機流程共 142 次。`npm run test:ui:build` 對正式 dist 的電腦／手機檢查 8 次通過，涵蓋四頁、深連結、流程通訊、實際 XLSX 與本機掃碼 SDK；正式輸出不含測試入口。相機串流與掃碼槍輸入仍採模擬，實機、NAS／HIS 及後端整合不列為已驗收。

正式產物另行驗證：先執行 `npm run build`，再執行 `npm run test:ui:build`。此套件自動啟動 preview，確認單一 HTML、四個主要路由、文件錨點、盤點深連結、流程 iframe 通訊、實際 XLSX 下載及本機掃碼資源，並確認正式頁面沒有測試入口。

`react-flows.spec.js` 補上展示登入必填、密碼申請、廠商新增／重複代碼／補填與高權限修改、刪除限制／取消、領用不足／刪除回復、盤點草稿／取消確認／送出鎖定／歷史更正與路由等畫面案例。

之後每個新增／修改的畫面 case 都需要實際瀏覽器測試及截圖檢查。測試必須操作使用者的流程、確認可見結果與錯誤提示，再比較畫面；不可只驗證內部函式或以 jsdom 代替畫面驗收。

第一次安裝：

```powershell
npm ci
npx playwright install chromium
```

執行：

```powershell
npm run test:ui
npm run test:ui:report
```

新增 case 放在 `frontend/tests/ui/`。正常、找不到、錯誤、取消／重試、權限等本次涉及的狀態都要測；手機與電腦行為不同時，兩種版面都要測。測試自動啟動本機 HTTP 服務，日期／時區固定以避免截圖漂移，成功提示浮層在截圖中隱藏。

首次建立或刻意改版時可執行 `npm run test:ui:update`。**必須檢視產生的基準圖後，再以一般測試確認通過**；不可直接用更新基準掩蓋缺陷。基準圖保留於 `frontend/tests/ui/*-snapshots/`；失敗畫面與 trace 在 `frontend/test-results/`，HTML 報告在 `frontend/playwright-report/`。基準與執行環境相關，目前使用 Windows Chromium。

第一批包含入庫／出庫各五個 case，分別在電腦和手機 Chromium 執行，共 20 個：

- 進頁待掃描：電腦輸入欄自動聚焦、手機可見相機按鈕。
- 掃碼槍鍵盤輸入條碼與 Enter：找到品項、取消後可再掃描。
- 找不到條碼：紅字可見；入庫可另按新增品項。
- 相機未授權：提示畫面與關閉。
- 無法提供後鏡頭：提示畫面及指定後鏡頭的請求。

相機錯誤測試以模擬 mediaDevices 檢查 UI，鍵盤輸入模擬掃碼槍。測試報告不得將模擬結果描述為實際手機鏡頭／USB 掃碼槍驗收；真實條碼辨識、iOS／Android 權限與後鏡頭仍需設備測試。既有其餘模組尚未全面補齊畫面案例，後續變更必須同步補上對應測試。

補查清單與設備驗證範圍見 [畫面案例清單](ui-case-matrix.md)。目前掃碼套件已擴充到 80 次電腦／手機執行，包含交易、驗證、相機成功、取消、資源釋放及錯誤重試；其他模組與實機的未覆蓋範圍必須保留在清單中。

全站 RWD 測試：`npm run test:ui -- rwd.spec.js`。涵蓋小手機、手機、平板及桌面，詳細範圍見案例清單。正常執行會比對已檢視的基準圖，不自動更新。

左側導覽測試另確認四個大分類保留本機 SVG 圖示，十個功能細項僅顯示文字；圖示不影響導覽的無障礙名稱；四種尺寸均保留選單截圖。

導覽狀態測試會逐項以滑鼠點擊／鍵盤 Enter 切換，驗證 hover、focus、選取前後所有項目的字重、文字寬高與按鈕寬高保持一致；桌面另縮至 180px 側欄檢查換行。選取狀態僅改色彩與內側陰影，不改字重或邊框厚度。

帳號與登出固定在側欄底部，手機須展開選單才能操作。測試檢查選單捲動不移動帳號區、浮動／縮窄後仍可登出，以及長帳號和高權限文字不溢出；相機登出案例也從側欄操作並驗證資源釋放。

出入庫傳票測試見 `vouchers.spec.js`：多筆草稿整批送出、編號跨日與 999 上限、取消與鎖定、庫存重新核對、防重複提交、分頁及實際下載 XLSX 檢查。側欄另測暫時縮窄視窗後恢復偏好寬度，及恢復後用方向鍵調整；未建檔品項表單截圖也驗證側欄寬度未被截圖過程改寫。

批次查詢見 `batch-filters.spec.js`：總覽／入庫／出庫以傳票批次為主要條件，驗證歷史跨日、多料號、日期前綴、交集與清除、無符合結果、獨立條件、分頁與篩選後 XLSX。盤點另驗證以品項核對帳面數量且無出入庫批次欄位；三頁的批次查詢也在 `rwd.spec.js` 驗證四種尺寸。

歷史成本驗證：`npm run test:ui -- historical-cost.spec.js`；四個案例在電腦／手機執行，涵蓋成本快照、數量加權、排除非已送出入庫、缺價／零元、篩選、分頁、Excel 與錯誤重試。RWD 另含新頁與兩個料號成本表，截圖更新仍需人工檢視後一般模式比對。

2026-10-15 歷史成本變更驗證：Windows Chromium，全套 296 次流程／RWD 檢查以更新截圖模式通過，新增及變更畫面已逐組檢視；再以一般截圖比對模式執行 126 個受影響案例，全部通過。這不是正式 NAS／資料庫、其他成本規則或實機相機／掃碼槍驗收。

2026-10-15 導覽圖示調整：只在四個大分類保留圖示，十個功能細項僅顯示文字。涵蓋四種尺寸的 84 個導覽／側欄／流程視窗案例，更新後已檢視側欄及嵌入畫面。一般比對首次 83 通過，320px 廠商側欄一個基準出現一像素文字差異；獨立重跑三次的實際圖片 SHA256 均為 C72DDE48035036605EED8A7F628568333DEA29DD3AEC746A7A7878C1935335B0，檢視後只更新該張基準，再連續三次一般比對通過，未放寬容差。點擊及聚焦尺寸檢查也通過。
