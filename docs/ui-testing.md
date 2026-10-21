> 日常指令與最新測試目錄請見 [瀏覽器測試指南](../frontend/tests/README.md)。

# 畫面案例驗證

## 共用 UI 樣式宣告統一（2026-10-21）

共用 UI 元件及內部部位的固定樣式集中到各檔案的 CVA 宣告，外部 className 最後交由 cn 合併；保留既有 props、CSS hooks、互動與業務流程。新增真實元件展示與四尺寸案例，涵蓋固定樣式、外部高度覆寫、停用狀態、Checkbox／Switch、Accordion／Tabs 鍵盤、表單錯誤、預設視窗取消及焦點回復。

提交前重新執行正式 build、應用與瀏覽器測試 TypeScript，以及單元測試，61 個單元測試通過。工作目錄既有 `.artifacts/ui-style-unification/after-tests.json` 記錄兩種共用元件案例於 320／390／768／1440px 共 8 次通過；已檢視四尺寸頁面總覽與差異圖，以及本輪 320px 的元件、錯誤與視窗截圖。前後比較 68 組有 59 組逐像素一致，包含 40 組頁面中的 37 組；其餘差異保留於 comparison.json 與 differences.png，不宣稱全部截圖一致。

提交檢查另外選取 52 個 Chromium RWD 案例，以 `--ignore-snapshots --workers=1 --timeout=60000` 執行。期間另有一個全站 Playwright 作業並行，且同一份測試檔仍有截圖穩定化調整；本輪出現 390px 工作區及播放器載入等待逾時，因此停止本輪作業並保留 `.artifacts/test-results/` 中的失敗畫面與 trace。此輪未完成，不列為全站或四尺寸完整回歸通過；未更新舊截圖基準，正式部署、NAS／HIS、身分服務與實機設備仍未驗收。

後續以本輪開始時的完整 UI 檔案備份重新確認：此次整理 17 個檔案，新增 51 個具名 CVA 宣告；既有註解、元件函式順序及範圍外檔案內容保留。Vite 暫時將 UI import 指向原始備份，固定動畫、滑鼠位置、字型與 iframe 場景就緒後，重拍選單、通知、規劃板、播放器的四尺寸共 16 組，全部逐像素一致。比較結果與原始模組清單在 `.artifacts/ui-style-unification/stable-states/comparison.json`、`original-modules.json`；沒有修改 production code 來消除初輪擷取差異，也沒有更新舊基準。RWD 狀態案例同步加入動畫控制、移開滑鼠及等待播放器完成場景切換。

原工作樹的全套 RWD 作業遇到首頁載入等待逾時，已停止並保留 `.artifacts/ui-style-unification/rwd-results/`；原頁面回歸之後又受其他流程搬移 pages/Demo 與路由影響，出現動態匯入失敗，因此中止。這些中斷批次均不列為通過。

後續改以 `git archive f2ef702` 建立 `.artifacts/ui-verify-f2ef702/` 獨立副本，固定本次共用元件完成版本，排除同時進行的 Workspace／路由重構。副本重新執行應用及測試 TypeScript、正式 build 通過；完整頁面行為回歸 310 通過、4 跳過、0 失敗（桌機／手機，9.3 分鐘），4 個跳過案例為展示登入停用後不適用的相機登出釋放情境。正式產物檢查 8／8 通過（32.9 秒），涵蓋深連結、靜態文件、iframe 通訊、XLSX、辨識 SDK 與模擬相機權限。JSON 報告分別為 `.artifacts/ui-style-unification/e2e-isolated.json`、`build-isolated.json`。以上使用 `--ignore-snapshots`，不代表舊截圖基準比對通過。

正式產物的 `/items` 另於 320／390／768／1440px 擷取畫面並檢查 pageerror，四尺寸沒有腳本錯誤，且與調整前逐像素一致；畫面位於 `.artifacts/ui-style-unification/preview/`。本次版本預覽為 `http://127.0.0.1:4200/items`。

獨立副本的完整四尺寸 RWD 首輪 205 通過、20 跳過、3 個桌機案例逾時（13.2 分鐘）。3 項分別為靜態文件返回首頁、架構文件整頁檢查、入庫傳票草稿；前兩種等待為工作區顯示及文件表格捲動檢查，未發現新增的腳本錯誤。保持相同原始碼、90 秒測試上限與原有 5 秒 expect 條件，改為單一 worker 重跑這 3 項，3／3 全部通過（1.1 分鐘）。合併完成 208 個不同 RWD 案例，另有 20 個登入／帳號／密碼重設相關案例因展示登入停用而跳過；不是一次整批全綠，也不以通過數量宣稱沒有覆蓋缺口。完整及重跑 JSON 在 `.artifacts/ui-style-unification/rwd-isolated.json`、`rwd-recheck.json`，原始失敗畫面與 trace 保留在 `rwd-isolated-results/`。本次驗證不涵蓋後續 Workspace 搬移、表單重構、正式部署、NAS／HIS、正式身分服務或真實設備。

## Base 元件外觀統一 variant（2026-10-21）

盤點 21 個 UI Base 元件檔案、3 個 Layout Base 元件檔案及其呼叫端，將 Badge 狀態、Button 預設外觀與導覽選取、Alert、Card、Label／Select 分頁、Switch、表格／儲存格／Frame、Dialog 與選單 preset 收進元件的 variant；className 保留頁面配置、可見性與定位用途。只有單一外觀的元件保留基底，disabled／checked／aria 仍控制互動狀態。型別沿用 CVA 的 VariantProps 推導。

TypeScript（應用與瀏覽器測試）及正式 Vite build 通過。Windows Chromium 於 320／390／768／1440px，完成 24 個共用元件、空結果、開關取消、排序、選單、通知、workspace／native／player 視窗、側欄導覽與新增／編輯案例；HIS、入庫頁另重跑 8 個案例通過，共 32 個針對性案例。這些執行使用 `--ignore-snapshots --workers=1 --timeout=60000`，不代表舊截圖基準比對通過。

初輪選取 88 個案例，期間新測試誤將播放器 iframe 當成外層 dialog，且並行擷取時 HIS／入庫出現載入逾時，因此中途停止。修正 selector、停止並行擷取後依序執行上述案例；沒有將未執行的原 88 個案例算成通過。原執行產物保留於 `.artifacts/variant-rwd-initial-results/`。

畫面比對涵蓋總覽、廠商、HIS、入庫、新版品項、進貨、基礎資料、耗用、POS、規劃板共 10 頁，每頁四種寬度。首輪 34 組逐像素一致，6 組分頁文字差異來自舊 CSS 僅匹配 outline；補上 pagination 的相同主題規則並重拍後，40 組前後截圖全部逐像素一致。比較資料與四尺寸畫面總覽位於 `.artifacts/variant-review/comparison.json`、`review-{width}.png`，已逐張檢視四尺寸總覽。

狀態案例另外擷取廠商查詢、workspace 視窗、作業選單、通知及播放器的四尺寸共 20 張畫面。播放器等待登入 frame 實際顯示後才擷取，視窗／選單採實際 viewport 截圖；最新原圖在 `.artifacts/variant-states-final/`，檢視總覽在 `.artifacts/variant-review/states-{width}.png`。未更新舊基準。未重跑全站完整測試，正式部署、NAS／HIS、後端與實機設備仍依案例清單保留待驗證。

## cn 套件直接匯入（2026-10-21）

13 個共用元件直接從 `cn@0.5.0` 匯入，移除本地 `src/lib/utils.ts` 及 `clsx`／`tailwind-merge` 直接依賴；`clsx` 仍由 `class-variance-authority` 間接使用。同步更新 shadcn 設定與維護文件。

TypeScript（應用與瀏覽器測試）及正式 Vite build 通過。Windows Chromium 以 320／390／768／1440px 執行 `RWD shadcn`、`RWD Demo overview`、`RWD Demo his`：一般模式的 12 個案例都遇到既有截圖基準差異，包含此次未修改的靜態文件。保留基準，改以 `--ignore-snapshots` 重跑，12／12 通過，涵蓋表單／表格捲動、狀態 Badge、確認視窗取消與焦點回復、選取狀態及手機導覽。

另在相同原始碼與固定日期下，使用暫存 Vite alias 分別載入舊 `twMerge(clsx(inputs))` 與新 `cn`，比對工作區總覽、HIS、廠商三頁的四種尺寸：11 組截圖位元組完全相同；768px 廠商頁僅按鈕邊緣 15 像素不同（540×1208px，低於既有 0.002 比例容差），放大檢視未見可見外觀差異。四尺寸廠商全頁截圖也已逐張檢視，未更新基準。遷移前後圖片與比較腳本位於 `frontend/.artifacts/cn-parity/`、`frontend/.artifacts/cn-compare.mjs`；原基準失敗報告保留在 `.artifacts/cn-baseline-report/`。

這是 class 合併套件遷移的針對性驗證，不代表全站所有案例、正式部署、NAS／HIS 整合或實機設備驗收。

## 首頁路由與靜態規劃文件（2026-10-21）

後續依使用者更正，移除系統頂部、規劃板頁首及登入示範內的規劃文件入口；系統頂部僅保留畫面規劃板連結，兩份 HTML 仍保留於 docs。應用與測試 TypeScript、正式 build 通過；桌機／手機共 2 個首頁導覽案例確認首頁及規劃板沒有兩份文件入口，且畫面規劃板仍可切換。已擷取兩頁的桌機／手機畫面並檢視手機首頁與桌機規劃板截圖；未更新基準、未部署。

首頁 `/` 直接顯示庫存工作區，功能路由移除 `/demo` 前綴；舊網址保留子路徑、查詢及錨點轉址。功能與流程規劃、程式架構改為 `docs/planning.html`、`docs/architecture.html`，移除對應 React page，以原生 details／summary 保留收合功能。展示模式列提供文件及畫面規劃板入口；規劃板改用根路徑嵌入系統，並保留登入／忘記密碼示範。

驗證結果：TypeScript（應用與瀏覽器測試）、正式 Vite build、61 個 Vitest 測試及 git diff whitespace 檢查通過。首頁、轉址、文件停用 JavaScript／直接本機開啟等桌機與手機測試 10／10 通過。關鍵操作與各功能入口、重新整理共 112 個案例：首輪 110 通過，2 個受同時執行另一組測試清除共用 trace 產物影響；停止並行執行後，該 2 個桌機案例重跑全部通過。

正式產物檢查 8／8 通過，包含靜態文件與 Markdown、深連結、規劃板 iframe、Excel 下載及本機掃碼 SDK。首輪發現登入停用設定使 iframe 無法展示密碼重設，修正嵌入畫面的登入表單條件後，完整 8 個案例重跑通過。

受影響 RWD 案例涵蓋 320／390／768／1440px，首輪 28／32 通過，4 個文件返回連結的測試 selector 尚用錯誤相對路徑；修正後 4／4 重跑通過。此輪使用 `--ignore-snapshots` 驗證行為及版面斷言，沒有更新截圖基準，也不宣稱完整視覺回歸。另以正式產物擷取首頁、兩份文件及規劃板四種寬度共 16 張畫面，檢查整頁無橫向溢出、無 pageerror、文件本機連結與錨點，並人工檢視圖片。截圖位於忽略追蹤的 `frontend/ui-review/root-docs/`。此次未部署正式網站。

## 側欄緊湊帳號列（2026-10-20）

帳號及權限改為上下兩行，右側使用透明背景的 ghost 登出按鈕；底部白色背景融入側欄、上方細分隔線、左右 16px／上下 12px，點擊區至少 44×44px。最窄 180px 桌面側欄的一般帳號保持單行，長帳號可換行且不擠壓登出。沿用既有登出與編輯阻擋行為。

以 `PLAYWRIGHT_PORT=4198 npm run test:ui:capture -- rwd.test.js --grep '帳號固定|長帳號|帳號列編輯'` 擷取 Windows Chromium 的 320／390／768／1440px，12 個案例通過。檢視 24 張畫面（固定底部、縮窄、長帳號、編輯阻擋、hover、鍵盤焦點）後才接受基準；總覽位於 `frontend/ui-review/sidebar-account-review.png`，原圖位於 `frontend/ui-review/rwd.test.js/sidebar-account-*.png`。觸控模擬不要求滑鼠 hover，桌面 hover 及四尺寸鍵盤焦點均已檢視。

以同一 grep 執行 `PLAYWRIGHT_PORT=4198 npm run test:ui -- rwd.test.js`，一般截圖比對模式 12／12 通過，包含 24 張已檢視基準的比對。`npm run build`（包含 TypeScript typecheck）通過。本次僅驗證帳號列受影響案例，並非全站回歸；實機手機、NAS／正式身分服務與正式部署未驗收。

## ChatGPT Sites deployment verification (2026-10-20)

Private production URL: https://fanding-inventory-demo.zanewnch.chatgpt.site. Native Sites deployment `appgdep_6ad742a5458c81918489fa1ddb31ad2d` succeeded. The deployment uses the same previously built/tested frontend assets, with `single-page-application` fallback in `.openai/hosting.json`. Pushed Sites source commit: `0c1b717ad568c7c61f7a0de96c5a834980cbf6ff`.

Live Chromium at 320/390/768/1440px passed the four main routes, demo login, and history deep-link refresh returning to login. History screenshots were captured and reviewed at `ui-review/sites/live-{width}.png`. Automated checks used the supported Site-only service-access header; normal owner sign-in and external visitor access were not independently tested. This is hosting smoke coverage, not a full RWD/functional regression. GitHub push-to-deploy is not configured for Sites.

## Vercel deployment verification (2026-10-20)

Production URL: https://fanding.vercel.app. Deployment `dpl_5FC2vqtACNuucT3pzc8mqjJ39Eoe` reached READY; the remote build passed TypeScript and Vite with Node.js 24.x. This change adds deployment configuration, without changing UI components or flows.

Local production-output tests: `PLAYWRIGHT_PORT=4197 npm run test:ui:build`, 8/8 passed in Chromium, including existing desktop/mobile screenshot comparisons, main routes, document assets, deep links, iframe flow, XLSX downloads, barcode SDK, and simulated camera-permission denial.

Live Chromium checks at 320/390/768/1440px passed for `/`, `/architecture`, `/board`, and `/demo/stocktake/history`; each width also passed demo login, deep-link refresh returning to login at the same URL, barcode SDK delivery, and no page errors. Four live history-page screenshots were captured and visually reviewed at `ui-review/vercel/history-{width}.png`. This is deployment smoke coverage, not a new full functional/RWD regression run. No screenshot baselines were updated. Real camera/scanner, NAS LDAP, HIS, backend integration, and automatic Git deployments remain unverified or unconnected.

## shadcn/ui 全站遷移（2026-10-17）

本次沿用現有使用者流程，將全站共用 UI 遷移為 shadcn/ui：Button、Input、Label、NativeSelect、Table、Card、Badge、Alert、Checkbox、Accordion、Dialog。元件客製與應用責任見 [shadcn/ui 慣例](shadcn-ui.md)，需求逐項對照見 [案例清單](ui-case-matrix.md) 首節。


檢視過程修正出入庫選取分類、載入失敗重試按鈕的文字／底色衝突；改用 Button variant 管理狀態。320px 的播放器底部按鈕需要換行，footer 改用三欄自適應高度，播放器內容採可收縮的 flex 區域，避免按鈕溢出或壓住 iframe。受影響案例重新擷取後再檢視。

`shadcn.test.js` 實際測試確認視窗的 Tab、Esc、取消及焦點回復，並在播放器內新增廠商，關閉重開後以查詢畫面驗證資料仍在。`rwd.test.js` 新增四尺寸 Accordion 鍵盤、錨點、表單／選擇欄／資料表、Dialog 與選取分類畫面，原有完整模組與表單測試繼續執行。

預設測試 port 為 4173；若該 port 已有使用者服務，使用 `PLAYWRIGHT_PORT` 指定獨立 port，不停掉既有服務。例如：

```powershell
$env:PLAYWRIGHT_PORT = "4185"
npm run test:ui
npm run build
npm run test:ui:build
```

本輪瀏覽器為 Windows Chromium，手機／平板以 viewport 及 touch 模擬。實際 iOS／Android 相機、USB／藍牙掃碼槍、NAS LDAP、HIS、資料庫及正式主機部署不在此次 UI 遷移驗收內，保留在案例清單的待驗證範圍。

## Layout、Tailwind 與 RWD

共用頁面骨架由 BaseLayout 組合 BaseHeader、可選的 BaseSidebar、BaseFooter。Planning／Architecture 共用文件頁版型；Demo 維持登入與工作區流程，並由 BaseLayout 承載側欄和頂部導覽。

五個 pages 模組的 Layout 只呼叫 BaseLayout，依固定 variant 選擇文件、規劃板、工作區或無導覽外框；BaseLayout 組合共用元件並由 Outlet 承載子頁，不傳遞業務 context。Demo 的登入、密碼重設、展示橫幅、通知、分頁 Provider、展示初始化、路由同步與對話框內容由 Home 擁有；側欄負責自己的導覽與登出，App 保護未完成表單。BaseLayout 只管理框架顯示、側欄尺寸與手機選單。

「RWD Layout 外框與 Home 登入流程及切頁保護」涵蓋四種尺寸的登入／重設／工作區／切頁阻擋／登出，驗證同一路由收合選單、上一頁／下一頁及登入欄位跨模組保留，並附上實際畫面。「RWD Demo Layout 承載子頁並保留工作區」保留既有側欄／頁首節點與畫面基準比對。附件截圖需另行檢視，不能將操作通過視為舊基準比對通過。

2026-10-17 本次責任調整：`npm run build`（含 TypeScript）通過；`npx playwright test rwd.test.js spa.test.js react-flows.test.js --ignore-snapshots` 共 232 次通過（7.5 分鐘），此輪僅代表操作與響應式斷言通過。四尺寸登入、重設、工作區、阻擋切頁及登出另擷取 20 張畫面並檢視，保存在 `frontend/ui-review/layout-home/`。舊基準比對與正式 dist 結果另列，不以此數量宣稱全站截圖回歸通過。相機／掃碼槍仍為模擬，NAS LDAP、HIS 與後端正式整合未驗收。

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

`spa.test.js` 驗證跨頁沒有主視窗 document 請求、登入／新增資料保留、深層路由重新整理、舊網址與 query、文件錨點與表格分頁、找不到頁面，以及模組下載失敗後重試。`react-flows.test.js` 的盤點案例以瀏覽器上一頁驗證未完成表單路由保護；`rwd.test.js` 新增四種尺寸的 SPA 導覽與找不到頁面案例。`build-smoke.test.js` 另確認 dist 遞迴只有一份 index.html。

新增及變更畫面先執行 capture 並檢視實際 Chromium 截圖，再只接受對應基準；不改動截圖容許值。頁面測試必須先等可見標題／登入表單，不能以延遲載入中的空白畫面作為基準。相機／掃碼槍仍採模擬，正式 NAS／HIS、資料庫及設備整合仍待驗收。

以下 React 重構的 322 次與 build 8 次為 SPA 遷移前的歷史紀錄。

React 版本的測試會自動啟動 Vite `test` 模式。頁面就緒以可見表單／標題判斷，不依賴舊版全域渲染函式。特殊庫存、跨日、序號上限等情境由 `testBridge.ts` 在測試模式提供資料初始化；正式 build 不載入這個模組。

測試入口等待畫面週期後才讀取最新狀態；純讀取不派送更新，初始化變更則同步提交，避免測試用的舊快照覆寫尚在提交的 React 狀態。傳票重試也先確認畫面已鎖定送出，再檢查庫存。


流程規劃板的縮圖先依場景等待登入、編輯或工作區實際顯示，再擷取畫面，避免把 React 尚未載入的空白 iframe 當成基準。原生數字驗證案例會核對錯誤訊息、stepMismatch、焦點及未送出資料，再把焦點移至備註欄後擷取穩定表單；Chromium 原生驗證泡泡的位置不納入像素基準，應用程式的錯誤提示仍直接比對。

一般報告在 `frontend/playwright-report/ui/`，build 報告在 `frontend/playwright-report/build/`；分別以 `npm run test:ui:report` 與 `npm run test:ui:build:report` 開啟。

2026-10-16 React 重構先保留原版 296 次流程／RWD 通過紀錄，再擷取 React 實際畫面，檢視新增及有差異的截圖後接受必要基準。一般比對發現 320px 廠商導覽文字位置差一像素；獨立重跑三次的實際圖片均為 SHA256 `C72DDE48035036605EED8A7F628568333DEA29DD3AEC746A7A7878C1935335B0`，檢視後只修正這張基準，截圖容許值維持 0.002。

最終驗證：Windows Chromium 156.0.8078.4，`npm run typecheck`、`npm run build` 通過；`npm run test:ui` 一般截圖比對完整 322 次通過（6.8 分鐘），其中 RWD 45 個案例 × 320／390／768／1440px 共 180 次，其餘電腦／手機流程共 142 次。`npm run test:ui:build` 對正式 dist 的電腦／手機檢查 8 次通過，涵蓋四頁、深連結、流程通訊、實際 XLSX 與本機掃碼 SDK；正式輸出不含測試入口。相機串流與掃碼槍輸入仍採模擬，實機、NAS／HIS 及後端整合不列為已驗收。

正式產物另行驗證：先執行 `npm run build`，再執行 `npm run test:ui:build`。此套件自動啟動 preview，確認單一 HTML、四個主要路由、文件錨點、盤點深連結、流程 iframe 通訊、實際 XLSX 下載及本機掃碼資源，並確認正式頁面沒有測試入口。

`react-flows.test.js` 補上展示登入必填、密碼申請、廠商新增／重複代碼／補填與高權限修改、刪除限制／取消、領用不足／刪除回復、盤點草稿／取消確認／送出鎖定／歷史更正與路由等畫面案例。

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

全站 RWD 測試：`npm run test:ui -- rwd.test.js`。涵蓋小手機、手機、平板及桌面，詳細範圍見案例清單。正常執行會比對已檢視的基準圖，不自動更新。

左側導覽測試另確認四個大分類保留本機 SVG 圖示，十個功能細項僅顯示文字；圖示不影響導覽的無障礙名稱；四種尺寸均保留選單截圖。

導覽狀態測試會逐項以滑鼠點擊／鍵盤 Enter 切換，驗證 hover、focus、選取前後所有項目的字重、文字寬高與按鈕寬高保持一致；桌面另縮至 180px 側欄檢查換行。選取狀態僅改色彩與內側陰影，不改字重或邊框厚度。

帳號與登出固定在側欄底部，手機須展開選單才能操作。測試檢查選單捲動不移動帳號區、縮窄後仍可登出，以及長帳號和高權限文字不溢出；相機登出案例也從側欄操作並驗證資源釋放。

出入庫傳票測試見 `vouchers.test.js`：多筆草稿整批送出、編號跨日與 999 上限、取消與鎖定、庫存重新核對、防重複提交、分頁及實際下載 XLSX 檢查。側欄另測暫時縮窄視窗後恢復偏好寬度，及恢復後用方向鍵調整；未建檔品項表單截圖也驗證側欄寬度未被截圖過程改寫。

批次查詢見 `batch-filters.test.js`：總覽／入庫／出庫以傳票批次為主要條件，驗證歷史跨日、多料號、日期前綴、交集與清除、無符合結果、獨立條件、分頁與篩選後 XLSX。盤點另驗證以品項核對帳面數量且無出入庫批次欄位；三頁的批次查詢也在 `rwd.test.js` 驗證四種尺寸。

歷史成本驗證：`npm run test:ui -- historical-cost.test.js`；四個案例在電腦／手機執行，涵蓋成本快照、數量加權、排除非已送出入庫、缺價／零元、篩選、分頁、Excel 與錯誤重試。RWD 另含新頁與兩個料號成本表，截圖更新仍需人工檢視後一般模式比對。

2026-10-15 歷史成本變更驗證：Windows Chromium，全套 296 次流程／RWD 檢查以更新截圖模式通過，新增及變更畫面已逐組檢視；再以一般截圖比對模式執行 126 個受影響案例，全部通過。這不是正式 NAS／資料庫、其他成本規則或實機相機／掃碼槍驗收。

2026-10-15 導覽圖示調整：只在四個大分類保留圖示，十個功能細項僅顯示文字。涵蓋四種尺寸的 84 個導覽／側欄／流程視窗案例，更新後已檢視側欄及嵌入畫面。一般比對首次 83 通過，320px 廠商側欄一個基準出現一像素文字差異；獨立重跑三次的實際圖片 SHA256 均為 C72DDE48035036605EED8A7F628568333DEA29DD3AEC746A7A7878C1935335B0，檢視後只更新該張基準，再連續三次一般比對通過，未放寬容差。點擊及聚焦尺寸檢查也通過。

## 業務頁面拆分與工作區路由（2026-10-21）

移除 pages/Demo，改由各業務頁面及舊版資料維護／庫存作業畫面直接對應 route。WorkspaceLayout 只組合 BaseLayout；Workspace 功能容器持有登入、通知及共用視窗，頁首與修改歷程拆為元件。資料維護、掃碼與傳票、共用庫存篩選分別持有事件處理，App 保留跨路由未完成表單保護。route handle.module 同步既有操作模組與側欄，URL 決定呈現頁面。

Redux key、command、seed、型別、樣式、測試橋接及規劃板 ready 訊息改為 workspace；相機、庫存及規劃預覽按功能歸屬。舊 /demo 網址轉址、示範帳號／假資料識別與歷史部署紀錄保留。/overview 及 /overview/ 轉至 /，保留 query/hash。規劃板場景同步切換 iframe 實際路由。

最終應用及瀏覽器測試 TypeScript、正式 build 通過；Vitest 10 個檔案、72 個案例通過，JSON 在 frontend/.artifacts/route-split-unit-final.json。正式 dist 已確認不含 __workspaceTest；測試橋接只存在於隔離的 test-mode build。

| 驗證範圍 | 最終結果 | 產物位於 frontend/.artifacts/ |
| --- | --- | --- |
| 桌面／手機主要操作：SPA、舊網址、找不到、HIS 權限、掃碼送出／停用／錯誤重試、相機授權取消及資源釋放、播放器資料保留、載入失敗重試 | 50 通過、2 略過；略過的是停用登入設定下的相機登出案例 | route-split-acceptance-results/ |
| 獨立路由、盤點填寫／審核直接連結及重新整理、複盤與主管核對 | 8 通過，部分路由案例與前列重複，不加總為獨立案例總數 | route-split-form-fixed-results/ |
| /overview 與尾斜線 query/hash 相容、SPA 上一頁／下一頁 | 桌面／手機 2 通過 | route-split-edge-final-results/ |
| 編輯中阻擋上一頁及側欄切頁、取消後焦點回復並可重試 | 桌面／手機 2 通過，截圖已檢視 | route-split-guard-results/ |
| 倉別必填、供應商 Email、HIS 對照逐欄必填及補齊儲存 | 桌面／手機 6 通過，6 張錯誤畫面已檢視 | route-split-native-final-results/ |
| 320／390／768／1440px 各 24 個業務網址，含耗用子頁、品項分類與盤點參數路由 | 4 個循環案例通過；96 張全頁截圖已檢視，檢查整頁／控制項邊界、表格及耗用頁籤獨立捲動 | route-split-final-rwd-results/ |
| 唯讀說明、歷史更正、播放器 RWD 視窗 | 12 通過、4 略過；略過的是原本停用的登入流程整合案例 | route-split-interaction-results/ |
| 639／640、767／768、1023／1024px 斷點；POS 1100／1101px 切欄 | 4 通過；12 張斷點截圖已檢視 | route-split-breakpoint-results/ |

截圖總覽在 route-split-review/，包括 native-states.jpg、interaction-states.jpg、final-states.jpg 與四尺寸全頁總覽。既有 554 張測試基準只搬移，Git blob hash 全部相同，沒有重建基準；以上 --ignore-snapshots 操作驗證不代表舊基準像素比對通過。

回歸修正包括規劃場景對應回傳空值、共用表單原有 HTML 必填／格式驗證的相容步驟，以及測試對舊 DOM 直接子層與品項 canonical URL 的假設。RWD 驗證器補上新版表格與可橫向捲動頁籤容器的檢查。實際截圖另發現 768px POS 商品區被結帳欄壓窄，已將 1100px 以下改為上下排列，手機與 1440px 桌面配置維持原行為。

前幾輪 dev server 導頁逾時及中止批次不列為最終通過；完整全站行為套件未全量完成。未執行的其餘模組細節與舊像素基準比對仍待驗證，不以通過數量宣稱零缺漏。相機案例使用模擬裝置，實機相機／掃碼槍、正式部署、後端／NAS／HIS 及真實身分服務未驗收。沒有 commit、push 或部署。

## Commit 前重跑（2026-10-21）

本輪正式 build、應用及瀏覽器測試 TypeScript 檢查通過，Vitest 10 個檔案共 72 個案例通過。桌面／手機路由與 POS 流程重跑時，前兩個 POS 案例在 beforeEach 等待頁面載入逾時，畫面停留於載入狀態；停止該批次及並行四尺寸路由批次，均不列為完整通過。失敗附件保留於 frontend/.artifacts/commit-check，四尺寸輸出位於 frontend/.artifacts/commit-rwd。沒有更新截圖基準，既有待驗證範圍維持。
