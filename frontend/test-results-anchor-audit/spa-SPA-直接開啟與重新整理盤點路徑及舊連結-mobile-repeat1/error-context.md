# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: spa.spec.js >> SPA 直接開啟與重新整理盤點路徑及舊連結
- Location: tests\ui\spa.spec.js:52:1

# Error details

```
Error: expect(locator).toHaveScreenshot(expected) failed

Locator: locator('#prep-fields')
  10636 pixels (ratio 0.08 of all image pixels) are different.

  Snapshot: spa-document-anchor.png

Call log:
  - Expect "toHaveScreenshot(spa-document-anchor.png)" locator('#prep-fields') with timeout 5000ms
    - verifying given screenshot expectation
  - waiting for locator('#prep-fields')
    - locator resolved to <div id="prep-fields" data-state="open" data-slot="accordion-item" data-orientation="vertical" class="border-b last:border-b-0">…</div>
  - taking element screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - attempting scroll into view action
    2 × waiting for element to be stable
      - element is not stable
    - retrying scroll into view action
    - waiting 20ms
    - waiting for element to be stable
    - element is not stable
  - retrying scroll into view action
    - waiting 100ms
    - waiting for element to be stable
  - 10636 pixels (ratio 0.08 of all image pixels) are different.
  - waiting 100ms before taking screenshot
  - waiting for locator('#prep-fields')
    - locator resolved to <div id="prep-fields" data-state="open" data-slot="accordion-item" data-orientation="vertical" class="border-b last:border-b-0">…</div>
  - taking element screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - attempting scroll into view action
    - waiting for element to be stable
  - captured a stable screenshot
  - 10636 pixels (ratio 0.08 of all image pixels) are different.

```

# Page snapshot

```yaml
- generic [ref=f4e3]:
  - banner [ref=f4e4]:
    - link "庫存管理系統" [ref=f4e5] [cursor=pointer]:
      - /url: /
    - navigation "主要導覽" [ref=f4e6]:
      - link "功能與流程規劃" [ref=f4e7] [cursor=pointer]:
        - /url: /
      - link "程式架構" [ref=f4e8] [cursor=pointer]:
        - /url: /architecture
      - link "畫面規劃板 ↗" [ref=f4e9] [cursor=pointer]:
        - /url: /board
      - link "系統 Demo ↗" [ref=f4e10] [cursor=pointer]:
        - /url: /demo
  - main [ref=f4e11]:
    - generic [ref=f4e12]:
      - generic [ref=f4e13]:
        - generic [ref=f4e14]: CODE ARCHITECTURE / 程式架構規劃
        - heading "從畫面到資料， 看清程式分工。" [level=1] [ref=f4e15]: 從畫面到資料，看清程式分工。
        - generic [ref=f4e16]: 架構討論草案 · 2026-10-14
        - paragraph [ref=f4e17]: 前端以 React＋TypeScript 呈現操作，後端以 Python＋FastAPI 處理業務與資料存取。沿用 IA_Map 的 Controller、Service、Repository、DTO 與 Entity 分層，各層再依業務功能拆檔。
        - link "查看程式目錄 ↓" [ref=f4e18] [cursor=pointer]:
          - /url: "#section-3"
      - complementary "系統架構圖：瀏覽器透過 HTTP API 連接 FastAPI，再由後端存取資料庫及 HIS" [ref=f4e19]:
        - generic [ref=f4e20]: 系統連線方向
        - generic [ref=f4e21]:
          - strong [ref=f4e22]: React＋TypeScript
          - generic [ref=f4e23]: 院內使用者的瀏覽器 · 頁面與操作狀態
        - generic [ref=f4e24]: ↓ HTTP API /api
        - generic [ref=f4e25]:
          - strong [ref=f4e26]: Python＋FastAPI
          - generic [ref=f4e27]: 登入與權限 · 業務規則 · 交易流程
        - generic [ref=f4e28]: ↓ 由後端存取資料
        - generic [ref=f4e29]:
          - generic [ref=f4e30]:
            - strong [ref=f4e31]: 本系統資料庫
            - generic [ref=f4e32]: OTC 等管理資料資料庫選型待確認
          - generic [ref=f4e33]:
            - strong [ref=f4e34]: HIS 整合介面
            - generic [ref=f4e35]: 查詢與允許的回寫扣庫由 HIS 執行
    - generic [ref=f4e36]:
      - complementary [ref=f4e37]:
        - paragraph [ref=f4e38]: 閱讀導覽
        - navigation "架構文件" [ref=f4e39]:
          - link "1. 已確認的方向" [ref=f4e40] [cursor=pointer]:
            - /url: "#section-1"
          - link "2. 系統與部署邊界" [ref=f4e41] [cursor=pointer]:
            - /url: "#section-2"
          - link "3. 建議目錄結構" [ref=f4e42] [cursor=pointer]:
            - /url: "#section-3"
          - link "4. 業務模組與資料責任" [ref=f4e43] [cursor=pointer]:
            - /url: "#section-4"
          - link "5. OTC 入庫資料流範例" [ref=f4e44] [cursor=pointer]:
            - /url: "#section-5"
          - link "6. API 與資料契約方向" [ref=f4e45] [cursor=pointer]:
            - /url: "#section-6"
          - link "跨系統 SSO／OIDC 流程" [ref=f4e46] [cursor=pointer]:
            - /url: "#oidc-login"
          - link "7. 待討論的決策" [ref=f4e47] [cursor=pointer]:
            - /url: "#section-7"
          - link "8. 後續實作驗證方向" [ref=f4e48] [cursor=pointer]:
            - /url: "#section-8"
          - link "9. 開發規格準備清單" [ref=f4e49] [cursor=pointer]:
            - /url: "#preparation"
          - link "OTC 入庫待確認範例" [ref=f4e50] [cursor=pointer]:
            - /url: "#receipt-spec-example"
          - link "參考資料" [ref=f4e51] [cursor=pointer]:
            - /url: "#section-9"
      - article "架構文件" [ref=f4e52]:
        - paragraph [ref=f4e53]: 更新日期：2026-10-16 狀態：展示前端已改為 React＋TypeScript／Vite；FastAPI、正式資料連線及身分整合仍為架構規劃。
        - paragraph [ref=f4e54]: 本文件整理庫存管理系統 HIS 與 OTC 庫存系統的技術方向、程式碼結構和責任邊界。目錄與檔名是後續開發的建議起點；資料庫、HIS 串接方式及部分業務規則仍待確認，不代表已完成實作。
        - generic [ref=f4e55]:
          - heading "1. 已確認的方向" [level=2] [ref=f4e56]
          - region "1. 已確認的方向，可左右捲動" [ref=f4e57]:
            - table [ref=f4e58]:
              - rowgroup [ref=f4e59]:
                - row [ref=f4e60]:
                  - columnheader "項目" [ref=f4e61]
                  - columnheader "決定" [ref=f4e62]
              - rowgroup [ref=f4e63]:
                - row [ref=f4e64]:
                  - cell "前端" [ref=f4e65]
                  - cell "React＋TypeScript" [ref=f4e66]
                - row [ref=f4e67]:
                  - cell "後端" [ref=f4e68]
                  - cell "Python＋FastAPI" [ref=f4e69]
                - row [ref=f4e70]:
                  - cell "使用方式" [ref=f4e71]
                  - cell "院內多人共用，集中部署，透過瀏覽器操作" [ref=f4e72]
                - row [ref=f4e73]:
                  - cell "功能分區" [ref=f4e74]
                  - cell "HIS 與 OTC 分開呈現；另有登入、廠商及盤點模組" [ref=f4e75]
                - row [ref=f4e76]:
                  - cell "HIS 扣庫" [ref=f4e77]
                  - cell "由 HIS 執行" [ref=f4e78]
          - generic [ref=f4e79]:
            - status [ref=f4e80]: 第 1–5 筆，共 6 筆
            - button "匯出 Excel (.xlsx)" [ref=f4e81]
            - generic [ref=f4e82]:
              - text: 每頁筆數
              - combobox "每頁筆數" [ref=f4e84]:
                - option "5" [selected]
                - option "10"
                - option "20"
                - option "50"
            - navigation "表格分頁" [ref=f4e85]:
              - button "上一頁" [disabled]
              - generic [ref=f4e86]:
                - text: 頁碼
                - combobox "頁碼 ／ 2 頁" [ref=f4e88]:
                  - option "1" [selected]
                  - option "2"
                - generic [ref=f4e89]: ／ 2 頁
              - button "下一頁" [ref=f4e90]
            - status
          - paragraph [ref=f4e91]:
            - text: 目前 frontend/ 僅保留單一 HTML 入口
            - code [ref=f4e92]: index.html
            - text: ，由 React Router 切換規劃、架構、規劃板及 Demo。根目錄 npm run build 產出 frontend/dist/。展示資料透過 Redux store 保存在記憶體，站內切換保留，重新整理重置，不是正式登入或後端整合。
          - paragraph [ref=f4e93]: 前端依 IA_Map 的 IA.Client 分層：main.tsx 掛載 React，App.tsx 承接全站路由保護；pages 各模組的 Layout.tsx 只呼叫 BaseLayout， 由 BaseLayout 組合共用框架並以 Outlet 承載 Home 或其他子頁，Home 擁有具體內容與操作流程。features 放功能與業務規則，router/routes 定義路由，store 使用 Redux Toolkit，types 保存領域型別，helpers 提供篩選與 Excel，styles 集中樣式，components 提供共用介面。@/ 對應 src。 正式 API 與後端仍為後續規劃。
        - generic [ref=f4e94]:
          - heading "2. 系統與部署邊界" [level=2] [ref=f4e95]
          - generic "架構與程式目錄，可左右捲動" [ref=f4e96]:
            - code [ref=f4e97]: 院內使用者的瀏覽器 │ ▼ React＋TypeScript │ HTTP API ▼ Python＋FastAPI ├─ 本系統資料庫：OTC 等本系統管理資料 └─ HIS 整合介面：HIS 資料查詢及允許的回寫
          - paragraph [ref=f4e98]: 瀏覽器只透過 FastAPI 存取業務資料。資料庫連線、HIS 存取、登入驗證及庫存異動規則由後端處理；連線帳密與金鑰不送到前端，也不寫入 Git。
          - paragraph [ref=f4e99]:
            - text: 建議正式部署以同一個網站入口提供 React 靜態檔及
            - code [ref=f4e100]: /api
            - text: 路徑，由院內反向代理轉送 API 請求至 FastAPI。實際伺服器作業系統、代理產品、HTTPS 憑證及登入環境仍待確認。開發時可分開啟動前後端；開發埠號不作為正式部署契約。
          - paragraph [ref=f4e101]: 先以單一後端應用承載各業務模組。集中部署與多人共用不等於需要微服務；後續依實際負載決定程序數量及擴充方式。
        - generic [ref=f4e102]:
          - heading "3. 建議目錄結構" [level=2] [ref=f4e103]
          - generic "架構與程式目錄，可左右捲動" [ref=f4e104]:
            - code [ref=f4e105]: "Fanding/ ├─ package.json # npm workspace 指令入口 ├─ package-lock.json # workspace 依賴鎖定 ├─ frontend/ │ ├─ package.json │ ├─ index.html # SPA 唯一 HTML 入口 │ ├─ vite.config.ts │ ├─ playwright.config.js │ ├─ tests/ # 瀏覽器案例與截圖基準 │ ├─ scripts/ # 畫面擷取與正式產物驗證 │ ├─ tsconfig.json │ └─ src/ │ ├─ main.tsx # 掛載 React、Redux Provider 與 Router │ ├─ App.tsx # 全站外殼與路由保護 │ ├─ pages/ │ │ ├─ Planning/ # Layout.tsx、Home.tsx │ │ ├─ Architecture/ # Layout.tsx、Home.tsx │ │ ├─ Board/ # Layout.tsx、Home.tsx │ │ ├─ Demo/ # Layout.tsx 版型選擇、Home.tsx 頁面流程 │ │ └─ Error/ # Layout.tsx、NotFound.tsx │ ├─ features/ # demo 功能與交易、planning 場景 │ ├─ components/ │ │ ├─ layout/ # 側欄與版面元件 │ │ └─ ui/ # 表格、篩選表單與視窗 │ ├─ router/ # index.tsx、routes 分模組路由 │ ├─ store/ # Redux store、typed hooks、展示 slice │ ├─ constants/ # 模組路徑契約 │ ├─ helpers/ # 庫存篩選與 Excel 匯出 │ ├─ styles/ # tailwind.css、layout、themes；全站 Tailwind CSS │ ├─ types/ # demo、inventory、suppliers、otc、stocktaking │ └─ api/server/ # 正式串接時新增，目前未建立 ├─ backend/ │ ├─ pyproject.toml │ ├─ app/ │ │ ├─ __init__.py │ │ ├─ main.py # 建立 FastAPI、註冊模組路由 │ │ ├─ core/ # 設定、登入與權限依賴 │ │ │ └─ __init__.py │ │ ├─ db/ # 本系統資料庫連線與交易資源 │ │ │ └─ __init__.py │ │ ├─ integrations/ │ │ │ ├─ __init__.py │ │ │ └─ his/ # HIS 存取與來源欄位轉換 │ │ │ └─ __init__.py │ │ ├─ controllers/ # HTTP API 入口 │ │ │ ├─ __init__.py │ │ │ ├─ auth.py │ │ │ ├─ suppliers.py │ │ │ ├─ his.py │ │ │ ├─ otc.py │ │ │ └─ stocktaking.py │ │ ├─ services/ # 業務規則與交易流程 │ │ │ ├─ __init__.py │ │ │ ├─ auth.py │ │ │ ├─ suppliers.py │ │ │ ├─ his.py │ │ │ ├─ otc.py │ │ │ └─ stocktaking.py │ │ ├─ repositories/ # 資料庫查詢與寫入 │ │ │ ├─ __init__.py │ │ │ ├─ auth.py │ │ │ ├─ suppliers.py │ │ │ ├─ his.py │ │ │ ├─ otc.py │ │ │ └─ stocktaking.py │ │ ├─ dto/ # 層間傳遞及 API 請求／回應型別 │ │ │ ├─ __init__.py │ │ │ └─ otc.py │ │ └─ entities/ # 採用 ORM 時的資料表映射 │ │ ├─ __init__.py │ │ └─ otc.py │ └─ tests/ # 對應業務模組的後端測試 └─ docs/ └─ architecture.md"
          - paragraph [ref=f4e106]:
            - text: 後端
            - code [ref=f4e107]: app/
            - text: 與其下所有 Python 套件目錄統一放置
            - code [ref=f4e108]: __init__.py
            - text: ，內容可為空。文件、靜態資源等非 Python 套件目錄不需要放置。後端目錄仍為規劃，不要求先建立空目錄。展示前端已採 Vite，套件版本固定於 frontend/package.json 與根目錄 package-lock.json；Python 版本及後端套件管理工具仍待確認。
          - heading "前端模組" [level=3] [ref=f4e109]
          - paragraph [ref=f4e110]: 以 OTC 入庫作為責任分配範例：
          - generic "架構與程式目錄，可左右捲動" [ref=f4e111]:
            - code [ref=f4e112]: "frontend/src/ ├─ pages/Otc/Layout.tsx # OTC 模組外殼，以 Outlet 承載子頁（規劃） ├─ pages/Otc/Receipt.tsx # 正式入庫頁面（規劃） ├─ features/otc/ReceiptForm.tsx # OTC 專用表單（規劃） ├─ router/routes/otcRoutes.tsx # OTC 路由（規劃） ├─ api/server/otc.ts # OTC HTTP 請求（規劃） └─ types/otc/index.ts # OTC 領域型別（已建立）"
          - list [ref=f4e113]:
            - listitem [ref=f4e114]:
              - code [ref=f4e115]: App.tsx、pages/
              - text: 依全站與模組分層：各模組 Layout 只呼叫 BaseLayout，由 BaseLayout 組合共用導覽與版面並以 Outlet 承載 Home；登入、通知、對話框等具體內容及操作流程由 Home 擁有，功能元件與業務規則留在對應
              - code [ref=f4e116]: features/
              - text: 。
            - listitem [ref=f4e117]: 單一頁面的載入、提交與狀態由該頁面擁有；只有形成清楚的共用行為或獨立元件責任時才拆出。
            - listitem [ref=f4e118]:
              - code [ref=f4e119]: components/ui/
              - text: 放 shadcn/ui 元件原始碼與跨模組的表格、篩選及視窗；OTC 專用表單留在 OTC 模組。
            - listitem [ref=f4e120]:
              - code [ref=f4e121]: api/server/
              - text: 處理連線及通用錯誤，不包含入庫規則或頁面狀態。
            - listitem [ref=f4e122]: 前端型別按業務模組歸屬；不建立涵蓋所有領域的通用型別雜物檔。
          - heading "後端分層（沿用 IA_Map）" [level=3] [ref=f4e123]
          - paragraph [ref=f4e124]: 沿用 IA_Map 依技術層分組的方式，各層再依業務功能拆檔。Python 目錄與檔案採小寫及底線命名；以下以 OTC 為例：
          - generic "架構與程式目錄，可左右捲動" [ref=f4e125]:
            - code [ref=f4e126]: "backend/app/ ├─ controllers/ │ ├─ __init__.py │ └─ otc.py # OTC API 入口 ├─ services/ │ ├─ __init__.py │ └─ otc.py # OTC 業務規則與交易流程 ├─ repositories/ │ ├─ __init__.py │ └─ otc.py # OTC 資料庫查詢與寫入 ├─ dto/ │ ├─ __init__.py │ └─ otc.py # OTC 層間傳遞及 API 請求／回應型別 └─ entities/ ├─ __init__.py └─ otc.py # 採用 ORM 時的資料表映射"
          - region "3. 建議目錄結構，可左右捲動" [ref=f4e127]:
            - table [ref=f4e128]:
              - rowgroup [ref=f4e129]:
                - row [ref=f4e130]:
                  - columnheader "庫存管理系統位置" [ref=f4e131]
                  - columnheader "責任" [ref=f4e132]
                  - columnheader "IA_Map 對照" [ref=f4e133]
              - rowgroup [ref=f4e134]:
                - row [ref=f4e135]:
                  - cell [ref=f4e136]:
                    - code [ref=f4e137]: controllers/otc.py
                  - cell "HTTP 端點、取得登入者、套用權限依賴、呼叫作業及回應" [ref=f4e138]
                  - cell [ref=f4e139]:
                    - code [ref=f4e140]: IA.Server/Controllers/
                - row [ref=f4e141]:
                  - cell [ref=f4e142]:
                    - code [ref=f4e143]: services/otc.py
                  - cell "入出庫規則、跨資料操作及交易流程" [ref=f4e144]
                  - cell [ref=f4e145]:
                    - code [ref=f4e146]: IA.Services/
                - row [ref=f4e147]:
                  - cell [ref=f4e148]:
                    - code [ref=f4e149]: repositories/otc.py
                  - cell "明確的資料庫查詢與寫入" [ref=f4e150]
                  - cell [ref=f4e151]:
                    - code [ref=f4e152]: IA.DataAccess/
                    - text: ，例如
                    - code [ref=f4e153]: WeeklyProgressDao.cs
                - row [ref=f4e154]:
                  - cell [ref=f4e155]:
                    - code [ref=f4e156]: dto/otc.py
                  - cell "層間傳遞及 API 請求／回應型別、欄位驗證" [ref=f4e157]
                  - cell [ref=f4e158]:
                    - code [ref=f4e159]: IA.DataModels/Models/
                - row [ref=f4e160]:
                  - cell [ref=f4e161]:
                    - code [ref=f4e162]: entities/otc.py
                  - cell "採用 ORM 時的資料表映射" [ref=f4e163]
                  - cell [ref=f4e164]:
                    - code [ref=f4e165]: IA.DataModels/Entities/
          - generic [ref=f4e166]:
            - status [ref=f4e167]: 第 1–5 筆，共 5 筆
            - button "匯出 Excel (.xlsx)" [ref=f4e168]
            - generic [ref=f4e169]:
              - text: 每頁筆數
              - combobox "每頁筆數" [ref=f4e171]:
                - option "5" [selected]
                - option "10"
                - option "20"
                - option "50"
            - navigation "表格分頁" [ref=f4e172]:
              - button "上一頁" [disabled]
              - generic [ref=f4e173]:
                - text: 頁碼
                - generic [ref=f4e174]:
                  - combobox "頁碼 ／ 1 頁" [disabled]:
                    - option "1" [selected]
                - generic [ref=f4e175]: ／ 1 頁
              - button "下一頁" [disabled]
            - status
          - paragraph [ref=f4e176]:
            - text: 由
            - code [ref=f4e177]: main.py
            - text: 組合各 controller 的
            - code [ref=f4e178]: APIRouter
            - text: 。FastAPI 的路由功能放在
            - code [ref=f4e179]: controllers/
            - text: ；層間傳遞型別及 API 請求／回應 DTO 放在
            - code [ref=f4e180]: dto/
            - text: 。資料庫尚未選定，因此
            - code [ref=f4e181]: entities/
            - text: 、ORM 及 migration 工具目前只保留設計位置。
          - paragraph [ref=f4e182]: 一般業務流程由 controller 呼叫 service，再由 service 呼叫 repository。Repository 封裝具體查詢，避免預先建立通用 CRUD 基底類別。交易由 service 掌握，repository 不各自提交同一筆入庫流程中的部分寫入。
        - generic [ref=f4e183]:
          - heading "4. 業務模組與資料責任" [level=2] [ref=f4e184]
          - region "4. 業務模組與資料責任，可左右捲動" [ref=f4e185]:
            - table [ref=f4e186]:
              - rowgroup [ref=f4e187]:
                - row [ref=f4e188]:
                  - columnheader "模組" [ref=f4e189]
                  - columnheader "責任" [ref=f4e190]
                  - columnheader "需確認的邊界" [ref=f4e191]
              - rowgroup [ref=f4e192]:
                - row [ref=f4e193]:
                  - cell [ref=f4e194]:
                    - code [ref=f4e195]: auth
                  - cell "使用者身分、登入及權限" [ref=f4e196]
                  - cell "同系統共用登入或跨系統 SSO、NAS LDAP 用途、角色與操作權限" [ref=f4e197]
                - row [ref=f4e198]:
                  - cell [ref=f4e199]:
                    - code [ref=f4e200]: suppliers
                  - cell "廠商查詢與維護" [ref=f4e201]
                  - cell "HIS／OTC 是否共用、資料來源、停用與刪除規則" [ref=f4e202]
                - row [ref=f4e203]:
                  - cell [ref=f4e204]:
                    - code [ref=f4e205]: his
                  - cell "HIS 藥品查詢、允許欄位的修改與回寫" [ref=f4e206]
                  - cell "可寫欄位、讀寫介面及失敗處理" [ref=f4e207]
                - row [ref=f4e208]:
                  - cell [ref=f4e209]:
                    - code [ref=f4e210]: otc
                  - cell "OTC 品項、入庫、出庫／耗用及領用" [ref=f4e211]
                  - cell "欄位、單位、扣庫時點與撤銷方式" [ref=f4e212]
                - row [ref=f4e213]:
                  - cell [ref=f4e214]:
                    - code [ref=f4e215]: stocktaking
                  - cell "盤點批次、實際數量輸入及差異計算" [ref=f4e216]
                  - cell "庫存基準、盤點期間異動、審核與調整方式" [ref=f4e217]
          - generic [ref=f4e218]:
            - status [ref=f4e219]: 第 1–5 筆，共 5 筆
            - button "匯出 Excel (.xlsx)" [ref=f4e220]
            - generic [ref=f4e221]:
              - text: 每頁筆數
              - combobox "每頁筆數" [ref=f4e223]:
                - option "5" [selected]
                - option "10"
                - option "20"
                - option "50"
            - navigation "表格分頁" [ref=f4e224]:
              - button "上一頁" [disabled]
              - generic [ref=f4e225]:
                - text: 頁碼
                - generic [ref=f4e226]:
                  - combobox "頁碼 ／ 1 頁" [disabled]:
                    - option "1" [selected]
                - generic [ref=f4e227]: ／ 1 頁
              - button "下一頁" [disabled]
            - status
          - paragraph [ref=f4e228]:
            - code [ref=f4e229]: controllers/his.py
            - text: 提供 HIS 作業 API，
            - code [ref=f4e230]: services/his.py
            - text: 處理業務流程；
            - code [ref=f4e231]: integrations/his
            - text: 處理外部 HIS 的連線、來源欄位轉換與讀寫。HIS 連線或欄位細節不散落到其他模組。
          - paragraph [ref=f4e232]: 盤點模組不自行建立另一套扣庫規則。OTC 差異調整交給 OTC 的庫存異動作業；HIS 調整如何交由 HIS 執行仍待確認。HIS 與本系統資料庫也不能直接假設可共用同一筆交易，跨系統失敗與重試方式需配合 HIS 能力設計。
        - generic [ref=f4e233]:
          - heading "5. OTC 入庫資料流範例" [level=2] [ref=f4e234]
          - paragraph [ref=f4e235]: 以下是架構說明，不是已定案的 API 或業務規格。
          - generic "架構與程式目錄，可左右捲動" [ref=f4e236]:
            - code [ref=f4e237]: ReceiptPage → api/server/otc.ts → controllers/otc.py → services/otc.py → repositories/otc.py → 本系統資料庫 → 回應入庫結果 → 頁面更新庫存及異動資訊
          - list [ref=f4e238]:
            - listitem [ref=f4e239]: 使用者掃描或輸入條碼，查詢 OTC 品項。找不到時提示新增；新增所需欄位及權限仍待確認。
            - listitem [ref=f4e240]: 頁面收集入庫資訊並提供輸入提示。後端重新驗證數量、品項及權限，前端驗證不能取代後端驗證。
            - listitem [ref=f4e241]: 入庫作業在同一筆資料庫交易中更新庫存並保存異動紀錄。任一步驟失敗就回復，避免只更新庫存或只留下紀錄。
            - listitem [ref=f4e242]: 成功後回傳後端確認的結果，頁面重新取得或更新相關資訊；瀏覽器顯示的舊庫存不作為寫入依據。
          - paragraph [ref=f4e243]: 多人同時入出庫時，需以資料庫能力保護庫存更新；鎖定、原子更新或版本檢查的方式在資料庫選定後決定。重複提交也需由後端防止同一筆作業重複入庫，不能只靠停用按鈕；識別方式及有效期限待 API 設計時確認。
        - generic [ref=f4e244]:
          - heading "6. API 與資料契約方向" [level=2] [ref=f4e245]
          - list [ref=f4e246]:
            - listitem [ref=f4e247]:
              - text: 建議 HTTP API 統一從
              - code [ref=f4e248]: /api
              - text: 提供，各業務模組有各自路由；端點名稱、版本策略及欄位尚未定案。
            - listitem [ref=f4e249]: 後端以明確的 request／response schema 定義契約；前端依契約使用具體 TypeScript 型別。
            - listitem [ref=f4e250]: TypeScript 型別不等於執行時驗證；外部輸入及回應依需要在邊界驗證。
            - listitem [ref=f4e251]: 欄位命名、日期、數量精度、單位、空值及錯誤格式需在 API 設計時共同確認，不使用遞迴轉換或猜測欄位名稱的方式掩蓋差異。
            - listitem [ref=f4e252]: 身分及權限在後端檢查；畫面隱藏按鈕只是操作提示。
            - listitem [ref=f4e253]: HIS 暫時無法讀寫時，需讓使用者知道操作失敗；是否允許快取及重試，依 HIS 契約確認。
          - heading "跨系統 SSO 建議方案：OIDC" [level=3] [ref=f4e254]
          - paragraph [ref=f4e255]: 適用前提：已確認需要跨不同系統單一登入，且院內既有登入服務支援 OpenID Connect（OIDC）。建議採 Authorization Code Flow＋PKCE，由 FastAPI 處理授權碼交換與登入結果驗證，React 使用庫存管理系統自己的 Session Cookie。此為建議方案，院內協定、服務與參數尚待確認，尚未實作。
          - paragraph [ref=f4e256]: 若 HIS、OTC 只是同一個庫存管理系統網站的功能頁面，可共用庫存管理系統登入狀態；是否另外串接院內 SSO，取決於是否需要沿用其他系統的登入狀態。
          - heading "跨網域登入流程" [level=4] [ref=f4e257]
          - paragraph [ref=f4e258]:
            - text: 以下網域僅為說明範例：庫存管理系統使用
            - code [ref=f4e259]: app.example.com
            - text: ，統一登入服務使用
            - code [ref=f4e260]: login.example.org
            - text: 。
          - generic "跨網域登入流程，可左右捲動" [ref=f4e261]:
            - code [ref=f4e262]: 瀏覽器／React 庫存管理系統 FastAPI 統一登入服務 │ │ │ ├─ /api/auth/login ───→│ │ │←─ 導向登入服務 ──────┤ │ ├─ 帶登入服務 Cookie ──────────────────────────────→│ │ │ 已登入：直接通過；未登入：要求登入 │←─ 導回庫存管理系統 callback，帶一次性 code 與 state ──────┤ ├─ /api/auth/callback →│ │ │ ├─ code＋PKCE 交換 Token ───→│ │ │←─ ID Token／Access Token ──┤ │ │ 驗證結果，建立庫存管理系統 Session │ │←─ 庫存管理系統 Session Cookie┤ │ ├─ 後續 API 帶庫存管理系統 Cookie →│ │
          - paragraph [ref=f4e263]:
            - text: 兩個網域各自持有自己的 Cookie，透過瀏覽器導向與一次性授權碼交換銜接。庫存管理系統不需要讀取登入服務的 Cookie，也不以共享跨網域 Cookie 作為設計前提。React 與庫存管理系統 API 建議部署在同一個網站入口，以
            - code [ref=f4e264]: /api
            - text: 存取後端。
          - paragraph [ref=f4e265]: 授權碼（code）是短效、一次性的交換憑證；ID Token 用來表達驗證後的使用者身分；Access Token 用來存取其允許的 API。庫存管理系統的 Session Cookie 保存本系統的登入識別，各項用途分開。若需要保存 Access Token 或 Refresh Token，放在後端，瀏覽器只取得庫存管理系統的 Session Cookie。
          - heading "安全性：驗證身分與傳遞登入結果是兩件事" [level=4] [ref=f4e266]
          - paragraph [ref=f4e267]: Auth Service 負責驗證使用者身分；Main 不會重新驗使用者密碼。Main 仍需確認收到的登入證明可信、確實由預期的 Auth Service 簽發、是發給 Main 使用且仍在有效期限內。這是驗證登入證明，不是重做身分驗證。
          - paragraph [ref=f4e268]: 若 Auth Service 直接把 JWT 交給瀏覽器再帶回 Main，Main 仍可驗證該 JWT；但 Token 會經過瀏覽器，因此必須降低它被瀏覽器端程式、網址或其他客戶端位置讀取與重送的風險。直接傳遞 JWT 並非不能使用，仍須依協定正確驗證及保護 Token。
          - paragraph [ref=f4e269]:
            - text: Authorization Code Flow 讓瀏覽器只把短效的一次性
            - code [ref=f4e270]: code
            - text: 帶回 Main；Main 的後端再直接向 Auth Service 交換 ID Token／Access Token。這會減少 Token 暴露給瀏覽器的機會，但
            - code [ref=f4e271]: code
            - text: 本身也會經過瀏覽器，因此不是單靠使用
            - code [ref=f4e272]: code
            - text: 就安全。
          - list [ref=f4e273]:
            - listitem [ref=f4e274]:
              - strong [ref=f4e275]: PKCE：
              - text: Main 保存 verifier，只有持有 verifier 的 Main 才能用
              - code [ref=f4e276]: code
              - text: 換 Token；降低截取
              - code [ref=f4e277]: code
              - text: 後被他人兌換的風險。
            - listitem [ref=f4e278]:
              - strong [ref=f4e279]:
                - code [ref=f4e280]: state
                - text: ：
              - text: 讓 Main 核對 callback 是否對應自己發起的登入，防止偽造或串錯登入回呼。
            - listitem [ref=f4e281]:
              - strong [ref=f4e282]: 精確登記 callback URL：
              - text: 限制 Auth Service 將登入結果送回哪個 Main 網址。
            - listitem [ref=f4e283]:
              - strong [ref=f4e284]: JWT 驗證：
              - text: Main 檢查簽章、
              - code [ref=f4e285]: iss
              - text: 、
              - code [ref=f4e286]: aud
              - text: 、有效期限與本次登入的
              - code [ref=f4e287]: nonce
              - text: 。無論 JWT 是透過
              - code [ref=f4e288]: code
              - text: 交換取得或直接收到，都需要驗證。
            - listitem [ref=f4e289]:
              - strong [ref=f4e290]: Main Session：
              - text: 驗證成功後，Main 建立自己的 Session Cookie；後續由 Main 以 Session 識別使用者並檢查庫存管理系統權限。
          - paragraph [ref=f4e291]:
            - text: 因此，
            - code [ref=f4e292]: code
            - text: 的主要安全作用是讓 Token 留在 Main 後端與 Auth Service 之間，並與 PKCE 等檢查搭配保護交換流程；它不會取代 Main 對 JWT 的驗證。以上是暫定的標準流程方向，實際採用方式仍要依院內 Auth Service 支援的協定及設定確認。
          - heading "雙方需準備的項目" [level=4] [ref=f4e293]
          - region "SSO 整合分工，可左右捲動" [ref=f4e294]:
            - table [ref=f4e295]:
              - rowgroup [ref=f4e296]:
                - row [ref=f4e297]:
                  - columnheader "院內登入服務提供／確認" [ref=f4e298]
                  - columnheader "庫存管理系統實作（端點為建議名稱）" [ref=f4e299]
              - rowgroup [ref=f4e300]:
                - row [ref=f4e301]:
                  - cell "OIDC discovery URL、發行者資訊" [ref=f4e302]
                  - cell [ref=f4e303]:
                    - code [ref=f4e304]: /api/auth/login
                    - text: ：建立登入請求並導向登入服務
                - row [ref=f4e305]:
                  - cell "Client ID、必要時 Client Secret、支援 PKCE S256" [ref=f4e306]
                  - cell [ref=f4e307]:
                    - code [ref=f4e308]: /api/auth/callback
                    - text: ：交換授權碼、驗證登入結果並建立 Session
                - row [ref=f4e309]:
                  - cell "登記完整且精確匹配的 callback URL" [ref=f4e310]
                  - cell [ref=f4e311]:
                    - code [ref=f4e312]: /api/auth/me
                    - text: ：回傳目前使用者與庫存管理系統權限
                - row [ref=f4e313]:
                  - cell "登出端點與是否支援跨系統登出" [ref=f4e314]
                  - cell [ref=f4e315]:
                    - code [ref=f4e316]: /api/auth/logout
                    - text: ：清除庫存管理系統 Session；是否連動院內登出另行確認
                - row [ref=f4e317]:
                  - cell "使用者識別欄位、群組或角色資訊" [ref=f4e318]
                  - cell [ref=f4e319]:
                    - text: 以登入服務的發行者與使用者識別（
                    - code [ref=f4e320]: iss
                    - text: ＋
                    - code [ref=f4e321]: sub
                    - text: ）對應庫存管理系統帳號，再套用操作權限
          - generic [ref=f4e322]:
            - status [ref=f4e323]: 第 1–5 筆，共 5 筆
            - button "匯出 Excel (.xlsx)" [ref=f4e324]
            - generic [ref=f4e325]:
              - text: 每頁筆數
              - combobox "每頁筆數" [ref=f4e327]:
                - option "5" [selected]
                - option "10"
                - option "20"
                - option "50"
            - navigation "表格分頁" [ref=f4e328]:
              - button "上一頁" [disabled]
              - generic [ref=f4e329]:
                - text: 頁碼
                - generic [ref=f4e330]:
                  - combobox "頁碼 ／ 1 頁" [disabled]:
                    - option "1" [selected]
                - generic [ref=f4e331]: ／ 1 頁
              - button "下一頁" [disabled]
            - status
          - heading "驗證與登入狀態處理" [level=4] [ref=f4e332]
          - list [ref=f4e333]:
            - listitem [ref=f4e334]: 使用成熟的 OIDC 用戶端套件，設定 discovery、Client ID、必要的 Client Secret 及固定 callback URL。Client Secret 留在後端設定，不送至 React。
            - listitem [ref=f4e335]:
              - text: 發起登入時產生並保存
              - code [ref=f4e336]: state
              - text: 、PKCE verifier／challenge 與
              - code [ref=f4e337]: nonce
              - text: ，回呼時依協定驗證，並處理取消登入、交換失敗與過期授權碼。
            - listitem [ref=f4e338]:
              - text: 驗證 ID Token 的簽章、發行者
              - code [ref=f4e339]: iss
              - text: 、接收對象
              - code [ref=f4e340]: aud
              - text: 、有效期限及
              - code [ref=f4e341]: nonce
              - text: ；僅解析 Token 內容不足以完成驗證。
            - listitem [ref=f4e342]:
              - text: 成功後建立或更新庫存管理系統自己的 Session，重新產生 Session ID；Session Cookie 設定
              - code [ref=f4e343]: HttpOnly
              - text: 、
              - code [ref=f4e344]: Secure
              - text: 。
              - code [ref=f4e345]: SameSite
              - text: 依實際回呼方式設定；使用 Cookie 的修改 API 另行處理 CSRF。
            - listitem [ref=f4e346]: Session 過期後重新導向登入服務；若院內登入狀態仍有效，通常可直接返回。庫存管理系統登出與所有系統一起登出是不同需求，需先確認。
            - listitem [ref=f4e347]: 身分驗證成功後，HIS 修改、OTC 入出庫及盤點等權限仍由庫存管理系統後端檢查。
          - paragraph [ref=f4e348]: 若院內只有 LDAP，需要另外提供將 LDAP 帳號整合到 OIDC 的身分服務；若既有 SSO 只支援 SAML，則配合其協定選用成熟套件。先取得院內登入服務的協定、整合文件與測試帳號，再決定實作細節。
          - heading "標準參考" [level=4] [ref=f4e349]
          - list [ref=f4e350]:
            - listitem [ref=f4e351]:
              - link "OpenID Connect Core" [ref=f4e352] [cursor=pointer]:
                - /url: https://www.openid.net/specs/openid-connect-core-1_0.html
              - text: ：登入流程與 ID Token 驗證。
            - listitem [ref=f4e353]:
              - link "RFC 9700：OAuth 2.0 Security Best Current Practice" [ref=f4e354] [cursor=pointer]:
                - /url: https://www.rfc-editor.org/rfc/rfc9700.html
              - text: ：PKCE 與 callback URL 等安全要求。
            - listitem [ref=f4e355]:
              - link "RFC 10017：OAuth 2.0 for Browser-Based Applications" [ref=f4e356] [cursor=pointer]:
                - /url: https://www.rfc-editor.org/rfc/rfc10017.html
              - text: ：瀏覽器應用與後端的登入架構；同網域應用亦可於 OIDC 登入後自行維護 Session。
        - generic [ref=f4e357]:
          - heading "7. 待討論的決策" [level=2] [ref=f4e358]
          - heading "表格 Excel 匯出（格式待討論）" [level=3] [ref=f4e359]
          - paragraph [ref=f4e360]: 每一個表格皆需 Excel 匯出，暫採 .xlsx。正式格式、欄位順序、版型、日期格式、工作表分組與是否包含篩選條件／批次資訊仍需與使用者討論。Demo 匯出目前篩選結果的全部分頁，不含操作按鈕或唯讀提示；料號、條碼與電話保留文字型別。匯出在瀏覽器完成，不上傳資料。
          - heading "盤點批次期間與操作歷程" [level=3] [ref=f4e361]
          - paragraph [ref=f4e362]:
            - text: 分為兩個路由：
            - link "歷史盤點紀錄" [ref=f4e363] [cursor=pointer]:
              - /url: /demo/stocktake/history
            - text: 只查已結束批次；
            - link "現有盤點週期" [ref=f4e364] [cursor=pointer]:
              - /url: /demo/stocktake/current
            - text: 只查與操作進行中批次。高權限歷史更正僅在歷史路由執行，歷史頁不提供掃碼或新建現有批次。正式 API 亦須依批次狀態隔離讀寫。
          - paragraph [ref=f4e365]: 每次盤點為開始至結束的一段期間，記錄固定開始／結束時間及人員。保留新增、掃描、儲存或取消編輯、移除、調整，以及同工作區期間內的入出庫與領用操作。操作紀錄包含時間、種類、料號、原值、新值、說明、結果與填寫人員；移除明細不刪除歷程。
          - paragraph [ref=f4e366]: 實盤需人工填寫；草稿可修改，全部明細填妥並勾選後整批確認送出。送出前一次驗證全部帳面庫存，成功後記錄送出時間／人員、結束期間並鎖定全部明細，不能再修改、移除或重複送出。
          - paragraph [ref=f4e367]: 批次結束後仍可查閱，後續操作不加入已結束期間。Demo 僅在記憶體保存，正式版需後端持久化與狀態／權限驗證；保留期限與更正規則待確認。
          - heading "高權限資料修改與歷史更正" [level=3] [ref=f4e368]
          - paragraph [ref=f4e369]: 整個盤點批次一次送出並鎖定所有明細，一般人員不可修改。高權限可修改既有資料；已送出盤點則以獨立歷史更正保存原因、原送出值、更正前後值、時間與人員。原批次仍鎖定，不重開期間、不刪歷程。Demo 不回溯調整現庫存，正式對帳與庫存更正流程待確認。
          - paragraph [ref=f4e370]: 登入權限選單僅為展示；正式高權限由 NAS LDAP 群組映射並由後端驗證，具體群組及欄位權限待確認。
          - heading "LDAP 登入、群組權限與忘記密碼" [level=3] [ref=f4e371]
          - paragraph [ref=f4e372]: 已選擇NAS 的 LDAP 帳號驗證與 LDAP 群組對應系統角色／操作權限。具體群組、可修改欄位與料號啟用／停用權限需與使用者確認；是否另需料號可用清單仍待業務確認。
          - list [ref=f4e373]:
            - listitem [ref=f4e374]: 後端連線 LDAP、驗證身分並取得群組，每次 API 操作檢查權限；目前靜態 Demo 尚未串接。
            - listitem [ref=f4e375]: 忘記密碼介面填寫 LDAP 帳號與登記信箱；實際重設由院內身分管理服務或管理員提供，服務入口及權限待確認。
            - listitem [ref=f4e376]: Demo 僅展示申請與返回登入，不查帳號、不寄信、不修改密碼。正式回應不揭露帳號是否存在，重設連結需單次、限時並限制申請頻率。
            - listitem [ref=f4e377]: LDAP 連線 TLS、群組欄位與角色映射需在整合前確認。
          - paragraph [ref=f4e378]:
            - text: 參考：
            - link "LDAP 認證規範" [ref=f4e379] [cursor=pointer]:
              - /url: https://www.rfc-editor.org/rfc/rfc4513
            - text: 、
            - link "OWASP 忘記密碼流程" [ref=f4e380] [cursor=pointer]:
              - /url: https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html
            - text: 。
          - heading "登入範圍需先確認" [level=3] [ref=f4e381]
          - paragraph [ref=f4e382]: 請確認：此處的 SSO 是指庫存管理系統同一個系統內，HIS、OTC 等功能共用一次登入，還是庫存管理系統與其他獨立系統之間的跨系統單一登入？
          - paragraph [ref=f4e383]: 若是同一個系統，請確認各功能是否共用登入狀態及各自的操作權限；若是不同系統，請列出要整合的系統、既有驗證服務，以及登入狀態或 Token 如何取得與驗證。LDAP 指 NAS 的權限管理，作為帳號與群組權限來源，實際群組與角色映射需確認。
          - region "7. 待討論的決策，可左右捲動" [ref=f4e384]:
            - table [ref=f4e385]:
              - rowgroup [ref=f4e386]:
                - row [ref=f4e387]:
                  - columnheader "項目" [ref=f4e388]
                  - columnheader "目前狀態" [ref=f4e389]
                  - columnheader "影響" [ref=f4e390]
              - rowgroup [ref=f4e391]:
                - row [ref=f4e392]:
                  - cell "OTC 資料庫" [ref=f4e393]
                  - cell "尚未選定" [ref=f4e394]
                  - cell "資料庫連線、ORM、migration、併發及備份" [ref=f4e395]
                - row [ref=f4e396]:
                  - cell "HIS 串接" [ref=f4e397]
                  - cell "尚未確認是直接連資料庫或 API" [ref=f4e398]
                  - cell "整合實作、回寫與錯誤處理" [ref=f4e399]
                - row [ref=f4e400]:
                  - cell "登入與權限" [ref=f4e401]
                  - cell "採 NAS LDAP 權限管理；群組映射與跨系統 SSO 範圍待確認" [ref=f4e402]
                  - cell "認證、session／token、角色與安全設定" [ref=f4e403]
                - row [ref=f4e404]:
                  - cell "OTC 欄位與單位" [ref=f4e405]
                  - cell "待確認" [ref=f4e406]
                  - cell "schema、資料表及入出庫驗證" [ref=f4e407]
                - row [ref=f4e408]:
                  - cell "領用與耗用關係" [ref=f4e409]
                  - cell "待確認" [ref=f4e410]
                  - cell "扣庫時點與避免重複扣庫" [ref=f4e411]
          - generic [ref=f4e412]:
            - status [ref=f4e413]: 第 1–5 筆，共 8 筆
            - button "匯出 Excel (.xlsx)" [ref=f4e414]
            - generic [ref=f4e415]:
              - text: 每頁筆數
              - combobox "每頁筆數" [ref=f4e417]:
                - option "5" [selected]
                - option "10"
                - option "20"
                - option "50"
            - navigation "表格分頁" [ref=f4e418]:
              - button "上一頁" [disabled]
              - generic [ref=f4e419]:
                - text: 頁碼
                - combobox "頁碼 ／ 2 頁" [ref=f4e421]:
                  - option "1" [selected]
                  - option "2"
                - generic [ref=f4e422]: ／ 2 頁
              - button "下一頁" [ref=f4e423]
            - status
        - generic [ref=f4e424]:
          - heading "8. 後續實作驗證方向" [level=2] [ref=f4e425]
          - paragraph [ref=f4e426]: 這些是建立系統時的驗證目標，目前尚未執行：
          - list [ref=f4e427]:
            - listitem [ref=f4e428]: 前端：型別檢查，以及表單錯誤、提交失敗、重複點擊和成功後更新的操作驗證。
            - listitem [ref=f4e429]: API：有效／無效輸入、未登入、權限不足及一致的錯誤回應。
            - listitem [ref=f4e430]: OTC：入庫成功、交易中途失敗後回復、多人同時異動及重複提交。
            - listitem [ref=f4e431]: HIS：以 mock 驗證查詢、回寫失敗及逾時，不直接修改院內真實資料作為測試。
            - listitem [ref=f4e432]: 盤點：基準庫存、期間異動、差異計算及不同來源的調整責任。
            - listitem [ref=f4e433]: 部署：瀏覽器至 API 的連線、多人登入隔離、日誌及備份還原。
        - generic [ref=f4e434]:
          - heading "9. 開發規格準備清單" [level=2] [ref=f4e435]
          - paragraph [ref=f4e436]: 對應規劃主頁的六項確認事項。需求目前為「待確認」，開發文件為「待補開發規格」；列出準備內容不代表已定案或已完成實作。確認結果由文件維護，本頁不提供勾選或回答保存功能。
          - paragraph [ref=f4e437]:
            - link "返回客戶需求確認摘要" [ref=f4e438] [cursor=pointer]:
              - /url: /#development-readiness
          - heading [level=3] [ref=f4e441]:
            - button "01 · 第一版範圍" [ref=f4e442] [cursor=pointer]
          - generic [ref=f4e444]:
            - heading [level=3] [ref=f4e445]:
              - button "02 · 欄位與資料模型" [expanded] [ref=f4e446] [cursor=pointer]
            - region "02 · 欄位與資料模型" [ref=f4e447]:
              - generic [ref=f4e448]:
                - paragraph [ref=f4e449]:
                  - generic [ref=f4e450]: 待補開發規格
                  - text: ·
                  - link "對應主頁需求：待確認" [ref=f4e451] [cursor=pointer]:
                    - /url: /#confirmation-fields
                - list [ref=f4e452]:
                  - listitem [ref=f4e453]: 整理欄位名稱、用途、型別、必填、空值、長度、數量精度、單位、可修改範圍與驗證條件。
                  - listitem [ref=f4e454]: 標明資料來源、HIS／OTC 的維護責任，以及廠商、品項、作業單與異動紀錄的關聯。
                  - listitem [ref=f4e455]: 確認採購、入庫、領用與耗用是否需要單位換算，並確認批號／效期／倉庫是否影響庫存識別。
                  - listitem [ref=f4e456]: 產出欄位規格表與資料關聯圖，再依已確認的規則設計資料表。
          - heading [level=3] [ref=f4e459]:
            - button "03 · 角色與權限" [ref=f4e460] [cursor=pointer]
          - heading [level=3] [ref=f4e463]:
            - button "04 · 作業與狀態" [ref=f4e464] [cursor=pointer]
          - heading [level=3] [ref=f4e467]:
            - button "05 · 異常處理與 API 契約" [ref=f4e468] [cursor=pointer]
          - heading [level=3] [ref=f4e471]:
            - button "06 · 驗收與追溯" [ref=f4e472] [cursor=pointer]
          - heading [level=3] [ref=f4e475]:
            - button "共通準備 · 整合與部署" [ref=f4e476] [cursor=pointer]
          - heading "OTC 入庫規格整理 · 待確認範例" [level=3] [ref=f4e477]
          - paragraph [ref=f4e478]: 以下只示範整理方式，不預先決定實際欄位、API 端點、請求格式或庫存識別維度。數量 10 是驗收示例，並非正式作業限制。
          - region "OTC 入庫待確認範例，可左右捲動" [ref=f4e479]:
            - table [ref=f4e480]:
              - rowgroup [ref=f4e481]:
                - row [ref=f4e482]:
                  - columnheader "對應項目" [ref=f4e483]
                  - columnheader "整理方式" [ref=f4e484]
              - rowgroup [ref=f4e485]:
                - row [ref=f4e486]:
                  - rowheader "01 · 範圍與畫面" [ref=f4e487]
                  - cell "對應規劃板「OTC 掃碼入庫」的掃碼、已有品項、未建檔補建及結果畫面；先確認第一版是否包含補建品項。" [ref=f4e488]
                - row [ref=f4e489]:
                  - rowheader "02 · 欄位" [ref=f4e490]
                  - cell "先確認品項如何識別、數量與單位如何表達；批號、效期、廠商單號、倉庫或儲位是否必填，由需求決定。" [ref=f4e491]
                - row [ref=f4e492]:
                  - rowheader "03 · 權限" [ref=f4e493]
                  - cell "分別確認誰可入庫、誰可補建品項，以及完成後誰可更正或撤銷。" [ref=f4e494]
                - row [ref=f4e495]:
                  - rowheader "04 · 規則" [ref=f4e496]
                  - cell "確認何時入帳、是否需審核、庫存及異動紀錄如何一起保存，以及誤入庫如何處理。" [ref=f4e497]
                - row [ref=f4e498]:
                  - rowheader "05 · API 與異常" [ref=f4e499]
                  - cell "依前述答案定義請求、回應、權限與錯誤；確認同次提交如何識別、失敗是否可重試及多人異動如何處理。" [ref=f4e500]
          - generic [ref=f4e501]:
            - status [ref=f4e502]: 第 1–5 筆，共 6 筆
            - button "匯出 Excel (.xlsx)" [ref=f4e503]
            - generic [ref=f4e504]:
              - text: 每頁筆數
              - combobox "每頁筆數" [ref=f4e506]:
                - option "5" [selected]
                - option "10"
                - option "20"
                - option "50"
            - navigation "表格分頁" [ref=f4e507]:
              - button "上一頁" [disabled]
              - generic [ref=f4e508]:
                - text: 頁碼
                - combobox "頁碼 ／ 2 頁" [ref=f4e510]:
                  - option "1" [selected]
                  - option "2"
                - generic [ref=f4e511]: ／ 2 頁
              - button "下一頁" [ref=f4e512]
            - status
          - paragraph [ref=f4e513]:
            - link "查看畫面規劃板" [ref=f4e514] [cursor=pointer]:
              - /url: /board
            - text: ·
            - link "對照既有 OTC 入庫資料流" [ref=f4e515] [cursor=pointer]:
              - /url: "#section-5"
        - generic [ref=f4e516]:
          - heading "參考資料" [level=2] [ref=f4e517]
          - list [ref=f4e518]:
            - listitem [ref=f4e519]:
              - link "FastAPI：Bigger Applications — Multiple Files" [ref=f4e520] [cursor=pointer]:
                - /url: https://fastapi.tiangolo.com/tutorial/bigger-applications/
              - text: ：
              - code [ref=f4e521]: APIRouter
              - text: 的模組拆分與組合方式；本文件的業務分區及 controller／service／資料存取層分工是庫存管理系統的設計建議。
            - listitem [ref=f4e522]:
              - link "React：Thinking in React" [ref=f4e523] [cursor=pointer]:
                - /url: https://react.dev/learn/thinking-in-react
              - text: ：元件拆分及 state 歸屬的基本思路；不代表 React 要求本文件的目錄格式。
  - contentinfo [ref=f4e524]:
    - generic [ref=f4e525]: 庫存管理系統 · 程式架構規劃
    - link "Markdown 原始文件 ↗" [ref=f4e526] [cursor=pointer]:
      - /url: /@fs/C:/Users/zanew/Documents/GitHub/Fanding/docs/architecture.md
    - link "← 返回功能規劃" [ref=f4e527] [cursor=pointer]:
      - /url: /
```

# Test source

```ts
  1   | const { test, expect } = require("../test-api.cjs");
  2   | 
  3   | test.beforeEach(async ({ page }) => {
  4   |   await page.clock.setFixedTime(new Date("2026-10-15T04:00:00Z"));
  5   | });
  6   | 
  7   | test("SPA 跨頁不重載並保留登入及新增資料", async ({ page }) => {
  8   |   const reduxErrors = [];
  9   |   page.on("console", (message) => {
  10  |     if (/non-serializable|A state mutation was detected/i.test(message.text()))
  11  |       reduxErrors.push(message.text());
  12  |   });
  13  |   await page.goto("/demo/vendors");
  14  |   await page.locator("#login-form button[type=submit]").click();
  15  |   await expect(page.locator("#content h2")).toHaveText("廠商資料維護");
  16  |   await page.locator("[data-action=add]").click();
  17  |   await page.locator("#editor [name=name]").fill("SPA 保留資料測試");
  18  |   await page.locator("#editor [name=phone]").fill("02-0000-1234");
  19  |   await page.locator("#editor-form button[type=submit]").click();
  20  |   await expect(page.locator("#editor")).toBeHidden();
  21  |   await page.evaluate(() => {
  22  |     window.__spaDocument = "same-document";
  23  |   });
  24  |   const documents = [];
  25  |   page.on("request", (request) => {
  26  |     if (request.isNavigationRequest() && request.frame() === page.mainFrame())
  27  |       documents.push(request.url());
  28  |   });
  29  |   if (page.viewportSize().width <= 800)
  30  |     await page.locator("#menu-toggle").click();
  31  |   await page.locator('.planning-link[href="/"]').click();
  32  |   await expect(page.locator("h1")).toBeVisible();
  33  |   await page.locator('nav a[href="/architecture"]').click();
  34  |   await expect(page).toHaveURL(/\/architecture$/);
  35  |   await expect(page.locator(".document-layout")).toBeVisible();
  36  |   await page.locator('nav a[href="/board"]').click();
  37  |   await expect(page.locator("#page-title")).not.toBeEmpty();
  38  |   await page.locator('nav a[href="/demo"]').click();
  39  |   await expect(page.locator("#workspace")).toBeVisible();
  40  |   if (page.viewportSize().width <= 800)
  41  |     await page.locator("#menu-toggle").click();
  42  |   await page.locator("[data-module=vendors]").click();
  43  |   await page.locator("#search").fill("SPA 保留資料測試");
  44  |   await expect(page.locator("#list-table")).toContainText("SPA 保留資料測試");
  45  |   expect(await page.evaluate(() => window.__spaDocument)).toBe("same-document");
  46  |   expect(documents).toEqual([]);
  47  |   expect(reduxErrors, "Redux 序列化與不可變檢查必須通過").toEqual([]);
  48  |   await page.addStyleTag({ content: "#notice{visibility:hidden!important}" });
  49  |   await expect(page).toHaveScreenshot("spa-retained-vendor.png");
  50  | });
  51  | 
  52  | test("SPA 直接開啟與重新整理盤點路徑及舊連結", async ({ page }) => {
  53  |   await page.goto("/demo/stocktake/history");
  54  |   await expect(page.locator("#login-form")).toBeVisible();
  55  |   await page.locator("#login-form button[type=submit]").click();
  56  |   await expect(page.locator("#content h2")).toHaveText("歷史盤點紀錄");
  57  |   await page.reload();
  58  |   await expect(page).toHaveURL(/\/demo\/stocktake\/history$/);
  59  |   await expect(page.locator("#login-form")).toBeVisible();
  60  |   await page.goto("/demo.html?embed=1#/stocktake/current");
  61  |   await expect(page).toHaveURL(/\/demo\/stocktake\/current\?embed=1$/);
  62  |   await expect(page.locator("#login-form")).toBeVisible();
  63  |   await page.locator("#login-form button[type=submit]").click();
  64  |   await expect(page.locator("#content h2")).toHaveText("現有盤點週期");
  65  |   await page.addStyleTag({ content: "#notice{visibility:hidden!important}" });
  66  |   await expect(page.locator("#content")).toHaveScreenshot(
  67  |     "spa-stocktake-direct.png",
  68  |   );
  69  |   await page.goto("/architecture.html#preparation");
  70  |   await expect(page).toHaveURL(/\/architecture#preparation$/);
  71  |   await expect(page.locator("#preparation")).toBeInViewport();
  72  |   await page.goto("/#development-readiness");
  73  |   await page.locator('a[href="/architecture#prep-fields"]').click();
  74  |   await expect(page.locator("#prep-fields")).toBeInViewport();
  75  |   await expect(page.locator("#prep-fields")).toHaveAttribute(
  76  |     "data-state",
  77  |     "open",
  78  |   );
> 79  |   await expect(page.locator("#prep-fields")).toHaveScreenshot(
      |                                              ^ Error: expect(locator).toHaveScreenshot(expected) failed
  80  |     "spa-document-anchor.png",
  81  |   );
  82  |   await page.locator('#prep-fields a[href="/#confirmation-fields"]').click();
  83  |   await expect(page.locator("#confirmation-fields")).toBeInViewport();
  84  |   await page.goto("/architecture/");
  85  |   await expect(page.locator("h1")).toBeVisible();
  86  |   await expect(page.locator("body")).toHaveClass("planning-page");
  87  |   await page.goto("/demo/stocktake/history/");
  88  |   await page.locator("#login-form button[type=submit]").click();
  89  |   await expect(page.locator("#content h2")).toHaveText("歷史盤點紀錄");
  90  | });
  91  | 
  92  | test("SPA 找不到頁面可返回首頁", async ({ page }) => {
  93  |   await page.goto("/demo/missing-module");
  94  |   await expect(page.getByRole("heading", { name: "找不到頁面" })).toBeVisible();
  95  |   await expect(page).toHaveScreenshot("spa-not-found.png");
  96  |   await page.getByRole("link", { name: "返回系統規劃" }).click();
  97  |   await expect(page).toHaveURL("/");
  98  |   await expect(page.locator("h1")).toBeVisible();
  99  | });
  100 | 
  101 | test("SPA 頁面載入失敗可重新載入重試", async ({ page }) => {
  102 |   await page.route("**/src/pages/Architecture/Home.tsx*", (route) =>
  103 |     route.abort(),
  104 |   );
  105 |   await page.goto("/");
  106 |   await page.locator('nav a[href="/architecture"]').click();
  107 |   await expect(
  108 |     page.getByRole("heading", { name: "畫面載入失敗" }),
  109 |   ).toBeVisible();
  110 |   await expect(page).toHaveScreenshot("spa-load-error.png");
  111 |   await page.unroute("**/src/pages/Architecture/Home.tsx*");
  112 |   await page.getByRole("button", { name: "重新載入" }).click();
  113 |   await expect(page).toHaveURL(/\/architecture$/);
  114 |   await expect(page.locator("h1")).toBeVisible();
  115 |   await expect(page.getByRole("heading", { name: "畫面載入失敗" })).toHaveCount(
  116 |     0,
  117 |   );
  118 | });
  119 | 
  120 | test("SPA 延遲載入顯示狀態並恢復頁面", async ({ page }) => {
  121 |   let resume;
  122 |   const pending = new Promise((resolve) => {
  123 |     resume = resolve;
  124 |   });
  125 |   await page.route("**/src/pages/Architecture/Home.tsx*", async (route) => {
  126 |     await pending;
  127 |     await route.continue();
  128 |   });
  129 |   await page.goto("/");
  130 |   await page.locator('nav a[href="/architecture"]').click();
  131 |   await expect(
  132 |     page.getByRole("status").filter({ hasText: "正在載入畫面…" }),
  133 |   ).toBeVisible();
  134 |   try {
  135 |     await expect(page).toHaveScreenshot("spa-loading.png");
  136 |   } finally {
  137 |     resume();
  138 |   }
  139 |   await expect(page.locator("h1")).toBeVisible();
  140 |   await expect(
  141 |     page.getByRole("status").filter({ hasText: "正在載入畫面…" }),
  142 |   ).toHaveCount(0);
  143 | });
  144 | 
```