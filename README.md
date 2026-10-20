# 庫存管理系統規劃與客戶展示

React＋TypeScript 的庫存管理展示網站，包含 HIS／OTC 功能規劃、假資料操作 Demo，以及畫面規劃與流程示範。共用樣式位於 `frontend/src/styles/`，使用系統字型及本機套件資源。

2026/10/20 更新：新版模組 1 位於 `/demo/items`，原 HIS／OTC 頁面保留。展示期間暫停登入頁，直接以 `demo.pharmacy` 進入工作區；登入程式保留，恢復方式見 `frontend/src/constants/demoAccess.ts`。目前也移除工作區標題 bar，手機仍可用功能選單開啟側欄。新版功能、無障礙驗證與待辦見 [本次交接](docs/20261020.md)。

## 開啟方式

新版模組 2 進貨管理位於 `/demo/purchases`。本階段提供進貨單、核對、沖銷、退貨、更正及歷史的前端展示，依使用者確認不連動模組一庫存；原有掃碼入庫頁保留。

在根目錄執行（Node.js 24、npm）：

```powershell
npm ci
npm run dev
```

開啟終端顯示的網址，首頁為 `/`。全站為單一 HTML 入口的 React SPA，文件錨點及規劃板展示參數保留；舊 `.html` 連結由前端轉向對應路由。

`npm run dev` 使用 `localhost`，預設埠為 5173；若該埠已被其他專案占用，Vite 會選下一個可用埠，請以終端實際顯示的完整網址為準。瀏覽器測試另固定使用 `127.0.0.1:4173`。

```powershell
npm run typecheck
npm run build
npm run preview
```

`build` 產出 `frontend/dist/`，其中只有一份 `index.html`，另含 JavaScript、文件與 vendor 資源。部署完整目錄，並將不存在的頁面路徑回退到 `/index.html`，才能直接開啟或重新整理 `/demo/stocktake/history` 等網址；已存在的資源檔案照常提供。此版本部署在網站根路徑 `/`。`preview` 在 `http://127.0.0.1:4173` 檢查 build 結果。相機仍需要 HTTPS 或 localhost。

Nginx 可使用 `try_files $uri $uri/ /index.html;`；IIS 使用 URL Rewrite，僅在請求不是既存檔案／目錄時 rewrite 到 `/index.html`。主機未設定回退時，直接開深層網址可能由主機回傳 404；Vite dev／preview 已提供 SPA 回退。

前端依 IA_Map 的 IA.Client 目錄分層，使用 React／TypeScript 實作。`frontend/package.json` 管理前端依賴與指令，根目錄透過 npm workspace 轉送原有指令，依賴由根目錄 package-lock.json 鎖定。`@/` 對應 `frontend/src/`。

`frontend` 同時集中 `index.html`、Vite／TypeScript／Playwright 設定、`public`、`scripts`、`tests` 與建置輸出 `dist`。也可進入 frontend 執行同名 npm 指令。瀏覽器報告與失敗產物集中在 `frontend/.artifacts/`。現行測試結構與指令請見 [測試指南](frontend/tests/README.md)。

```text
frontend/src/
├─ main.tsx                  # 掛載 React、Provider 與 Router
├─ App.tsx                   # 全站外殼、樣式與路由保護
├─ pages/
│  ├─ Planning/              # Layout.tsx＋Home.tsx
│  ├─ Architecture/          # Layout.tsx＋Home.tsx
│  ├─ Board/                 # Layout.tsx＋Home.tsx
│  ├─ Demo/                  # Layout.tsx＋Home.tsx，共用工作區外殼
│  └─ Error/                 # Layout.tsx＋NotFound.tsx
├─ features/                 # demo 交易規則與功能元件、planning 場景
├─ components/
│  ├─ layout/                # 側欄等版面元件
│  └─ ui/                    # 表格、篩選表單、視窗
├─ router/
│  ├─ index.tsx              # 建立 Router
│  └─ routes/                # 分模組路由與舊網址相容
├─ store/                    # Redux store、typed hooks、展示 slice 與初始資料
├─ constants/                # 模組路徑契約
├─ helpers/                  # 庫存篩選、Excel 匯出
├─ styles/                   # layout 頁面樣式、themes 共用樣式
└─ types/                    # 舊 import 相容轉接；業務型別位於所屬 features
```

路由模組沿用 IA_Map 的 Layout／Home 慣例：父路由載入 `Layout.tsx`，透過 `<Outlet />` 呈現 Home 或其他子頁。Layout 負責模組外殼；Home 負責頁面操作流程，功能元件與業務規則由 `features` 擁有。Demo 的登入與共用對話框由 Home 持有，側欄及頂部導覽由 BaseLayout 組合，模組切換沿用同一個工作區外殼；Error Layout 僅承載錯誤子頁。狀態與型別分別歸入 `store`、`types`。正式 API 串接時沿用 IA_Map 的 `api/server` 分層，目前尚未建立 API 或正式資料連線。

全站 UI 使用 shadcn/ui，元件原始碼集中在 `frontend/src/components/ui/`，設定見 `frontend/components.json`。按鈕、表單、表格、卡片、標籤、確認視窗與文件 Accordion 共用同一套元件；BaseDataTable／BaseFilterForm／BaseModal 保留分頁、查詢和視窗生命週期等應用規則。元件選擇、專案調整與新增方式見 [shadcn/ui 慣例](docs/shadcn-ui.md)。

全站樣式使用 Tailwind CSS 4 與官方 `@tailwindcss/vite` plugin，`styles/tailwind.css` 統一 shadcn theme、字型與 RWD token，使用無前綴 utilities；跨頁語意樣式在 `styles/layout`、`styles/themes` 以 `@reference`／`@apply` 共用。保留原生表單驗證與文件排版，不載入 Preflight；側欄位置與畫布縮放的執行時數值保留 style。

RWD 採 mobile-first 預設斷點：sm 640px、md 768px、lg 1024px、xl 1280px、2xl 1536px。瀏覽器驗證涵蓋 320／390／768／1440px，另驗證實際使用的 sm／md／lg 斷點兩側。

全域狀態使用 Redux Toolkit 與 React Redux：store/index.ts 組合 store，store/hooks.ts 提供型別化存取，store/demo.ts 管理現有展示資料及跨元件流程。登入表單、選單、相機與版面等局部狀態維持由元件持有。業務操作及更新 callback 在 thunk 執行，送出可序列化的 Immer patches；reducer 只套用資料更新，Redux 的序列化與不可變檢查維持啟用。不建立尚無正式需求的 global／auth slice。

Demo 左側導覽固定於左側，頂端直接顯示系統名稱；右側拉柄可拖曳或用左右鍵調整寬度。寬度調整只保留在當次頁面，不改動資料或權限。

- `/`：系統分工、功能需求與待確認問題。
- `/architecture`：React／FastAPI 目錄結構、模組分工、資料流與待確認決策。
- `/demo`：展示登入、廠商維護、HIS 藥品修改、OTC 入出庫／領用、成本與盤點；功能路徑如 `/demo/vendors`、`/demo/receipt`。
- `/board`：7 個分類、24 個 Frame，可縮放、拖動畫布、逐步示範及直接操作。

Demo 可使用預填的展示帳號登入；登入與業務資料由路由上層的 Provider 保存，站內切換保留，重新整理即重置。規劃板的互動視窗共用該 iframe 當次假資料，縮圖則是獨立的初始畫面參考；iframe 與主視窗資料各自獨立。未完成的編輯表單或確認視窗會阻擋站內切換及上一頁，需先儲存、取消或完成確認。

所有新增／編輯畫面均自動帶入已有值並鎖定，只允許補填空白欄位（數字 0 也視為已有值）。掃描帶入的條碼為唯讀，下拉欄位沒有值時顯示「請選擇」，不自動指定第一筆。狀態不可編輯，右上角以綠色「啟用」或紅色「未啟用」呈現；新資料預設啟用。儲存或取消後返回原列表，保留搜尋、篩選與分頁。新盤點的實盤數量保持空白，儲存草稿後仍可修改，整批確認送出後鎖定並更新假庫存。這些規則為目前 Demo 行為，正式 HIS 可回寫欄位仍待確認。

所有表格各自分頁，預設每頁 5 筆，可切換 10／20／50 筆、選擇頁碼或使用上一頁／下一頁。搜尋與狀態篩選會回到第一頁；異動紀錄不截斷為最近 12 筆。規劃與架構文件的表格同樣支援分頁，列印時顯示完整資料，章節連結會展開目標列所在頁。分頁與畫面均由 React 元件管理。

## 展示範圍

本專案未串接 NAS LDAP、HIS、正式 API 或資料庫。領用立即扣庫及 HIS 盤點直接調整，均為標示在畫面上的展示假設，正式作業規則仍待確認。

請勿輸入真實帳密或客戶資料。所有品項與廠商均為虛構展示資料。

每次成功儲存、入出庫或盤點調整，均以目前登入帳號自動記錄「填寫人員」，不開放手動修改。資料維護、盤點與異動表格顯示此欄；既有資料沒有紀錄時顯示「未記錄」。資料列記錄最近一次填寫人員，異動紀錄各自保留當次操作人員。目前仍為記憶體中的 Demo 資料，正式實作須由後端登入身分填入。

領用人採文字輸入加自動完成下拉建議，示範選項包含既有領用人與虛構人員；尚未串接院內人員名單。領用資料不需填寫部門，列表也不顯示部門。已有值的領用人仍為唯讀，空白時才可輸入或選取。

LDAP 指 NAS 的權限管理；登入與權限以 NAS 提供的帳號與群組對應系統角色；實際群組與角色映射待確認。登入頁提供「忘記密碼」介面，填寫帳號與登記信箱後示範申請結果，並可返回登入。未連線 LDAP、未寄送郵件、未變更密碼。

廠商的聯絡人與廠商代碼為非必填，可留空儲存；代碼有填時檢查重複。廠商內部 id 與顯示代碼分開，確保多筆沒有代碼的資料仍可編輯並正確關聯品項。

廠商資料區分「公司名稱」（必填，沿用 name）與「簡稱」（選填，shortName），表單及列表皆顯示，搜尋支援兩者。已有值維持唯讀，空白簡稱可補填。

OTC 品項有「最低庫存」必填欄位，允許 0 至 1,000,000 的整數。示範既有品項設定為 20；新增品項需填寫。低庫存提醒與列表警示在啟用品項庫存低於各自最低庫存時顯示，等於最低庫存不警示。已有值的欄位仍維持唯讀。

OTC 品項可選填「啟用日期／停用日期」，表單與列表皆顯示。日期保存為 YYYY-MM-DD 固定值，不隨儲存、入出庫、頁面重繪或啟用狀態重新取當下時間，也不自行依日期切換狀態；兩者都有填時，停用日期不得早於啟用日期。日期已有值則唯讀。Demo 重新整理仍依原有規則重置全部假資料。

盤點以批次期間管理：先開始批次，再掃描與填寫實盤，完成或移除待處理列後結束批次。開始與結束時間固定記錄，期間操作歷程保留時間、料號、原值／新值、結果與填寫人員；同工作區的入出庫及領用異動也納入。可切換查閱歷史批次，移除明細不刪歷程，結束後鎖定。紀錄仍為當次記憶體 Demo 資料，重新整理重置。

每張表格皆有「匯出 Excel (.xlsx)」，暫行匯出目前篩選結果的全部分頁，不包含操作按鈕或唯讀標示；料號、條碼與電話保留文字型別。首次匯出才載入本機 vendor 的 SheetJS 0.20.3 mini 套件（Apache-2.0），不連線 CDN 或上傳資料。正式匯出格式、欄位與版型仍待討論。

盤點批次選單提供 2026 年 8 月及 9 月的 HIS／OTC 歷史展示紀錄。明細顯示「盤差」（實盤減帳面），並以 checkbox 確認盤點；必須先保存實盤數量、核對盤差並勾選，才能執行確認調整。勾選或取消勾選納入期間歷程；歷史已完成紀錄勾選並鎖定，Excel 保留盤差數值與確認狀態。

OTC 品項提供選填成本價／售價，允許 0 至 1,000,000、最多兩位小數；已有金額（含 0）為唯讀，空白可補填。表單、列表與 Excel 匯出皆包含，Excel 金額保存為數值並顯示兩位小數。尚未指定幣別及含稅規則，不以成本價與售價大小關係限制儲存。

OTC 新增「歷史平均成本價」頁：依已送出的入庫傳票保存當次單價，採使用者確認的數量加權平均，主檔改價不回寫歷史。支援批次／料號／送出人員／期間篩選，摘要及明細皆可分頁、匯出 XLSX；草稿、取消及出庫排除，缺少單價不當作零元。

盤點採整批確認送出：人工填寫各筆實盤數量，在獨立頁儲存草稿；送出前可修改草稿，修改後取消該筆確認。所有明細均填妥並勾選確認後，以「確認送出本批次」二次確認。送出時一次驗證全部帳面庫存，成功後更新假庫存、結束期間並鎖定整批，記錄送出時間與人員。送出後不能修改、取消確認、移除或重複送出。此規則取代先前儲存實盤即鎖定／逐筆調整的展示行為。

高權限展示：登入頁可選一般／高權限人員，僅模擬權限，正式來源為 NAS LDAP 群組。一般人員只能補空白欄位；高權限可修改既有主檔及領用資料，保留欄位原值、新值、時間及修改人員，料號／內部識別與 NAS 啟用狀態維持原規則。整批盤點送出後仍鎖定，高權限可用「歷史更正」填數量及必填原因；追加獨立更正紀錄，保留原送出數量、時間與期間，不回溯調整目前庫存。正式群組與權限映射、歷史更正對帳及庫存更正流程仍需確認與後端實作。

盤點分為兩個獨立前端路由：`/demo/stocktake/history` 只查已結束批次（含月份歷史、盤差、期間操作及高權限更正），`/demo/stocktake/current` 只查與操作進行中的週期（開始、人工填寫、確認送出）。各工作區與路由獨立保存所選批次；歷史頁不提供掃碼、開始或送出現有週期。直接開啟連結會先顯示登入，再進入該路由。

「出庫／耗用」的「最近 OTC 異動」表提供開始／結束時間搜尋及清除條件，可只填單邊時間，包含起訖分鐘；結束早於開始時提示且保留原搜尋結果。依瀏覽器本地時間輸入，以異動的 ISO 時間戳記比對，不解析顯示文字。搜尋只更新此表並重設頁碼，保留未送出的出庫內容；Excel 匯出篩選後全部分頁。其他表格暫不加入時間篩選。

時間篩選提供「本月、上個月、下個月、本週、下週、上週」六個快捷按鈕；以點擊當下的本地日期計算，週一至週日為一週，期間從首日 00:00 至末日 23:59。點擊直接帶入並搜尋，跨月、跨年及閏年依日曆計算。

「出庫／耗用」的異動表上方提供「出庫、入庫、總覽」三個切換頁籤，預設總覽；出庫包含數量減少的耗用、領用等異動，入庫包含數量增加的入庫、回復及調整，總覽保留全部。分類與時間條件共同篩選，切換重設頁碼且保留未送出的出庫表單；XLSX 匯出目前分類及時間條件的全部分頁。

工作區總覽首張表為「庫存總覽」，預設查詢瀏覽器本地當日；品項、動作、工作區預設「所有」，工作區為 HIS／OTC。支援指定日期及條件交集搜尋、重設為當日所有，分頁與 XLSX 匯出依相同條件處理。

領用表新增「領用時間」（requisitionedAt ISO），新增成功時自動記錄，編輯保留原時間；未記錄的舊資料不補造時間。領用人支援文字及下拉建議搜尋，開始／結束時間可單邊填寫並包含結束分鐘，與原文字搜尋取交集；分頁與 XLSX 套用篩選結果，提供清除條件。頁面不使用部門欄位及相關說明文字。

共用庫存篩選：`compileInventoryFilter` 編譯料號／人員／日期條件並驗證日期，`matchesInventoryFilter` 對明確的 materialNumber、person、timestamp 契約取交集；React `FilterForm` 管理各表的查詢草稿。料號與人員去除前後空白、不分大小寫、包含搜尋；空白表示所有。單日含本地 00:00 至下一日開始前，起訖時間含結束分鐘，可單邊填寫；有日期條件而缺少時間戳記的資料不納入。庫存總覽／出庫／入庫以填寫人員與 recordedAt 對應，領用表以領用人與 requisitionedAt 對應。四頁保存獨立條件，庫存總覽保留當日預設、動作／工作區條件，出庫保留分類及日期快捷；搜尋重設頁碼，XLSX 匯出篩選後全部分頁。

入庫／出庫共用條碼查詢：電腦進頁、取消或完成後自動聚焦條碼欄，掃碼槍以鍵盤方式輸入完整條碼並送 Enter；保留前導零，手動輸入也按 Enter。觸控裝置不強制聚焦，以「開啟相機掃碼」授權啟用相機，指定後鏡頭（facingMode exact environment），無後鏡頭時提示，不回退前鏡頭；ZXing Browser 0.2.1 多格式辨識套件首次使用才從本機 vendor 載入，辨識成功停止相機並呼叫同一查詢流程。關閉、切換頁面、登出、背景化及延後授權完成時釋放影像串流。HTTPS／localhost 與瀏覽器相機權限為必要條件；不申請音訊、不上傳影像。已驗證 DOM 操作與模擬串流生命週期，仍需實際手機鏡頭、印製條碼及掃碼槍驗收。

## Deployment decision: Vercel

As confirmed on 2026-10-20, **Vercel remains the chosen demo host**, using manual CLI deployments from the local checkout. The live demo is https://fanding.vercel.app/demo.

Manual deployment works on the current account. The plan limitation blocks connecting the private organization repository `recycle-crew/Fanding` for automatic Git deployments; it does not block uploading and deploying the local code manually. A GitHub push and a Vercel deployment are separate operations.

For each demo update, run from the repository root:

```powershell
npm run build
npx vercel --prod --scope zanes-projects-20eaa040
```

The checkout is already linked to the `fanding` Vercel project through the ignored `.vercel/` directory. Sign in with `npx vercel login` if needed. Deployment does not require committing or pushing to GitHub first. Follow the verification steps in the Vercel section below after publication.

## GitHub automatic deployment limitations

As of 2026-10-20, **neither the current Vercel setup nor ChatGPT Sites provides automatic deployment from this GitHub repository (`recycle-crew/Fanding`)**. Pushing to GitHub does not update either live demo; both currently require manual publication.

| Hosting | Limitation for this project |
| --- | --- |
| Vercel | The Hobby plan blocks Git integration with this private organization repository. Enabling that integration requires a supported plan or a change to repository ownership/visibility; granting repository permission alone does not resolve it. |
| ChatGPT Sites | No supported, persistent GitHub push-to-deploy or GitHub Actions deployment setup was verified. Updates currently require publication through ChatGPT/Sites. |

These are the limitations of this project's current setup, not a claim that Vercel never supports automatic deployment. No GitHub deployment workflow has been configured.

## ChatGPT Sites demo

This was an alternative hosting trial; Vercel is the chosen deployment target. The existing private snapshot remains at https://fanding-inventory-demo.zanewnch.chatgpt.site and is not kept in sync with Vercel. Sign in with the owning ChatGPT account to view it. Site identity and SPA fallback are recorded in `.openai/hosting.json`.

The first Sites publication uses a sanitized deployment copy at `ui-review/sites/fanding-demo/`, including the existing frontend source and verified production assets. Its top-level `dist/` is copied from `frontend/dist/` because Sites static packaging requires that directory name. When publishing an update, rebuild the frontend and refresh the deployment copy's source and `dist/` before using the Sites source/publishing helper. Do not include `.env*`, Vercel credentials, harness links, or local dependencies.

This is a separate, manually published Sites deployment. GitHub pushes to `recycle-crew/Fanding` do not update it. See the automatic deployment limitations above.

## Vercel demo deployment

Live demo: https://fanding.vercel.app (Vercel project `zanes-projects-20eaa040/fanding`). The first production deployment was made manually from this local checkout on 2026-10-20. GitHub automatic deployment is blocked by the Hobby plan restriction described above; granting repository access alone is insufficient.

Keep the Vercel project's **Root Directory** set to the repository root (`.`), not `frontend`. The root `vercel.json` configures:

| Setting | Value |
| --- | --- |
| Framework Preset | Vite |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `frontend/dist` |
| Node.js Version | 24.x (select in Vercel project settings) |

No environment variables or backend services are required for this demo. The SPA rewrite supports direct links and refreshes on routes such as `/demo/stocktake/history`, while Vercel serves existing assets normally.

To deploy the local checkout instead of importing Git, run these commands from the repository root:

```powershell
npx vercel login
npx vercel
# Publish to the project's production URL when ready:
npx vercel --prod
```

CLI deployments use `.vercelignore` to exclude local harness links, dependencies, generated reports, tests, and build output; Vercel builds from source. The CLI creates a local `.vercel/` project link, which should remain untracked.

After deployment, check `/`, `/architecture`, `/board`, and `/demo`; log into the demo, open `/demo/stocktake/history`, then refresh. Confirm that the board's embedded demo and XLSX downloads work. HTTPS enables browser camera access, but real phones and barcode scanners still require device testing. Demo changes remain in browser memory and reset on refresh; NAS LDAP, HIS, APIs, and databases are not connected.

## 畫面測試

每種新增／修改 case 必須加入實際瀏覽器與截圖驗證，流程見 [畫面測試規範](docs/ui-testing.md)。執行 `npm run test:ui`，用 `npm run test:ui:report` 查看報告；相機與掃碼槍模擬測試不代表實機驗收。

全站 RWD 驗證涵蓋 320／390／768／1440px 的規劃頁、架構頁、流程規劃與互動視窗、Demo 全模組與新增／編輯表單；含表格獨立捲動、導覽遮擋及調整尺寸後保留輸入。執行 `npm run test:ui:rwd`；目前 49 個 RWD 案例 × 4 種尺寸 = 196 次執行，含 Layout、Tailwind 斷點與架構目錄，另保留原有 80 次掃碼流程測試。

2026-10-16 Layout／Tailwind 驗證：TypeScript、build、格式檢查通過；完整 348 次執行中 346 次通過，2 次相機切頁檢查補上非同步釋放等待後，相關 12 次重跑全部通過。196 次 RWD 與正式 dist 另 8 次全部通過。新增及有差異截圖已先檢視，容許值不變；完整執行與重跑分開記錄於 [驗證紀錄](docs/ui-testing.md)。案例與實機待驗證範圍見 [案例清單](docs/ui-case-matrix.md)。

先前 SPA 階段紀錄：完整 334 次通過，之後補上延遲載入 2 次，以及正式 dist 8 次；此為 Layout／Tailwind 遷移前的分次執行結果。

新版模組 4 耗用查詢位於 /demo/consumptions，含 HIS 對照、同步異常及同步紀錄，所有同步皆為前端模擬。模組 5 基礎資料管理位於 /demo/base-data，提供倉別／供應商維護；新增主檔可供新進貨單選擇，歷史單據快照保留。
