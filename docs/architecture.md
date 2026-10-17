# 庫存管理系統程式架構規劃

更新日期：2026-10-16

狀態：展示前端已改為 React＋TypeScript／Vite；FastAPI、正式資料連線及身分整合仍為架構規劃。

本文件整理庫存管理系統 HIS 與 OTC 庫存系統的技術方向、程式碼結構和責任邊界。目錄與檔名是後續開發的建議起點；資料庫、HIS 串接方式及部分業務規則仍待確認，不代表已完成實作。

## 1. 已確認的方向

| 項目 | 決定 |
|---|---|
| 前端 | React＋TypeScript |
| 後端 | Python＋FastAPI |
| 使用方式 | 院內多人共用，集中部署，透過瀏覽器操作 |
| 功能分區 | HIS 與 OTC 分開呈現；另有登入、廠商及盤點模組 |
| HIS 扣庫 | 由 HIS 執行 |
| 本次交付 | 全站 React 展示前端、靜態 build 與瀏覽器驗證 |

目前 `frontend/index.html` 是唯一 HTML 入口，頁面與互動使用 React 元件及 React Router 實作。根目錄 `npm run build` 產出 `frontend/dist/`，只含一份 HTML；`/`、`/architecture`、`/board`、`/demo` 由前端路由切換。展示資料透過路由上層的 Redux store 保存在記憶體，站內切換保留、重新整理重置，不是正式登入或後端整合。部署時需將非既存檔案／目錄的頁面請求回退到 `/index.html`；目前 base 為網站根路徑 `/`。

前端依 IA_Map 的 IA.Client 組織：`src/main.tsx` 掛載 React、Redux Provider 與 Router；`App.tsx` 提供全站外殼與路由保護，`pages` 放頁面，`features` 放功能元件及業務規則，`router/routes` 放模組路由，`store` 使用 Redux Toolkit，`types` 依領域保存型別，`helpers` 放篩選與 Excel 匯出，`styles` 集中樣式，`components/layout` 與 `components/ui` 提供共用介面。`@/` 對應 src。正式 API、NAS／HIS 與後端仍為規劃。

前端套件、Vite、Playwright、tests 與 scripts 均位於 frontend；根目錄透過 npm workspace 轉送原有指令，正式產物為 `frontend/dist/`。Redux `store/index.ts` 組合 store，`store/hooks.ts` 提供有型別的 dispatch／selector，`store/demo.ts` 管理現有展示資料與跨元件操作狀態；頁面已有的密碼輸入、選單與版面等局部狀態仍由元件持有。尚無正式需求的 global／auth slice 不先建立。

## 2. 系統與部署邊界

```text
院內使用者的瀏覽器
        │
        ▼
React＋TypeScript
        │ HTTP API
        ▼
Python＋FastAPI
        ├─ 本系統資料庫：OTC 等本系統管理資料
        └─ HIS 整合介面：HIS 資料查詢及允許的回寫
```

瀏覽器只透過 FastAPI 存取業務資料。資料庫連線、HIS 存取、登入驗證及庫存異動規則由後端處理；連線帳密與金鑰不送到前端，也不寫入 Git。

建議正式部署以同一個網站入口提供 React 靜態檔及 `/api` 路徑，由院內反向代理轉送 API 請求至 FastAPI。實際伺服器作業系統、代理產品、HTTPS 憑證及登入環境仍待確認。開發時可分開啟動前後端；開發埠號不作為正式部署契約。

先以單一後端應用承載各業務模組。集中部署與多人共用不等於需要微服務；後續依實際負載決定程序數量及擴充方式。

## 3. 建議目錄結構

```text
Fanding/
├─ package.json                # npm workspace 指令入口
├─ package-lock.json           # workspace 依賴鎖定
├─ frontend/
│  ├─ package.json
│  ├─ index.html               # SPA 唯一 HTML 入口
│  ├─ vite.config.ts
│  ├─ playwright.config.js
│  ├─ tests/                   # 瀏覽器案例與截圖基準
│  ├─ scripts/                 # 畫面擷取與正式產物驗證
│  ├─ tsconfig.json
│  └─ src/
│     ├─ main.tsx              # 掛載 React、Redux Provider 與 Router
│     ├─ App.tsx               # 全站外殼與路由保護
│     ├─ pages/
│     │  ├─ Planning/          # Layout.tsx、Home.tsx
│     │  ├─ Architecture/      # Layout.tsx、Home.tsx
│     │  ├─ Board/             # Layout.tsx、Home.tsx
│     │  ├─ Demo/              # Layout.tsx 版型選擇、Home.tsx 頁面流程
│     │  └─ Error/             # Layout.tsx、NotFound.tsx
│     ├─ features/             # demo 功能與交易、planning 場景
│     ├─ components/
│     │  ├─ layout/            # 側欄與版面元件
│     │  └─ ui/                # 表格、篩選表單與視窗
│     ├─ router/               # index.tsx、routes 分模組路由
│     ├─ store/                # Redux store、typed hooks、展示 slice
│     ├─ constants/            # 模組路徑契約
│     ├─ helpers/              # 庫存篩選與 Excel 匯出
│     ├─ styles/               # tailwind.css、layout、themes；全站 Tailwind CSS
│     ├─ types/                # demo、inventory、suppliers、otc、stocktaking
│     └─ api/server/           # 正式串接時新增，目前未建立
├─ backend/
│  ├─ pyproject.toml
│  ├─ app/
│  │  ├─ __init__.py
│  │  ├─ main.py                 # 建立 FastAPI、註冊模組路由
│  │  ├─ core/                   # 設定、登入與權限依賴
│  │  │  └─ __init__.py
│  │  ├─ db/                     # 本系統資料庫連線與交易資源
│  │  │  └─ __init__.py
│  │  ├─ integrations/
│  │  │  ├─ __init__.py
│  │  │  └─ his/                 # HIS 存取與來源欄位轉換
│  │  │     └─ __init__.py
│  │  ├─ controllers/                 # HTTP API 入口
│  │  │  ├─ __init__.py
│  │  │  ├─ auth.py
│  │  │  ├─ suppliers.py
│  │  │  ├─ his.py
│  │  │  ├─ otc.py
│  │  │  └─ stocktaking.py
│  │  ├─ services/                 # 業務規則與交易流程
│  │  │  ├─ __init__.py
│  │  │  ├─ auth.py
│  │  │  ├─ suppliers.py
│  │  │  ├─ his.py
│  │  │  ├─ otc.py
│  │  │  └─ stocktaking.py
│  │  ├─ repositories/           # 資料庫查詢與寫入
│  │  │  ├─ __init__.py
│  │  │  ├─ auth.py
│  │  │  ├─ suppliers.py
│  │  │  ├─ his.py
│  │  │  ├─ otc.py
│  │  │  └─ stocktaking.py
│  │  ├─ dto/                    # 層間傳遞及 API 請求／回應型別
│  │  │  ├─ __init__.py
│  │  │  └─ otc.py
│  │  └─ entities/               # 採用 ORM 時的資料表映射
│  │     ├─ __init__.py
│  │     └─ otc.py
│  └─ tests/                     # 對應業務模組的後端測試
└─ docs/
   └─ architecture.md
```

後端 `app/` 與其下所有 Python 套件目錄統一放置 `__init__.py`，內容可為空。文件、靜態資源等非 Python 套件目錄不需要放置。後端目錄仍為規劃，不要求在沒有實作需求時先建立空目錄。展示前端已採 Vite，套件版本固定於 frontend/package.json 與根目錄 package-lock.json；Python 版本及後端套件管理工具仍待確認。

### 前端模組

以 OTC 入庫作為責任分配範例：

```text
frontend/src/
├─ pages/Otc/Layout.tsx        # OTC 模組外殼，以 Outlet 承載子頁（規劃）
├─ pages/Otc/Receipt.tsx        # 正式入庫頁面（規劃）
├─ features/otc/ReceiptForm.tsx # OTC 專用表單（規劃）
├─ router/routes/otcRoutes.tsx  # OTC 路由（規劃）
├─ api/server/otc.ts           # OTC HTTP 請求（規劃）
└─ types/otc/index.ts          # OTC 領域型別（已建立）
```

- `App.tsx` 承接全站路由保護與載入狀態。每個 `pages/{Module}/` 沿用 IA_Map 的 Layout／Home 慣例，父路由掛載 `Layout.tsx`，由 `<Outlet />` 呈現 Home 或其他子頁；沒有額外外殼的路由模組仍保留 Layout 作為子路由入口。
- 各頁面的 Layout 只呼叫 BaseLayout 並指定版型；BaseLayout 組合共用 Header、Sidebar、Footer，以 Outlet 承載 Home，不傳遞業務 context。Home／其他子頁擁有具體內容及操作流程；Demo 的登入、密碼重設、橫幅、通知、對話框、分頁及展示初始化均由 Home 管理。側欄自行處理導覽與登出，未完成表單由 App 的路由 blocker 保護；功能元件及業務規則留在對應 `features/`。
- 單一頁面的載入、提交與狀態由該頁面擁有；只有形成清楚的共用行為或獨立元件責任時才拆出。
- `components/ui/` 放 shadcn/ui 原始碼與跨模組共用的 BaseDataTable／BaseFilterForm／BaseModal；設定在 `frontend/components.json`，客製規則見 [shadcn/ui 慣例](shadcn-ui.md)。OTC 專用表單留在 OTC 模組。
- `api/server/` 在正式串接時處理 HTTP 請求，不包含入庫規則或頁面狀態。
- 前端型別按業務模組歸屬；不建立涵蓋所有領域的通用型別雜物檔。
- 全站樣式由 Tailwind CSS 4 與官方 Vite plugin 編譯。`styles/tailwind.css` 定義 shadcn theme 與 RWD token；Layout、頁面與共用元件可直接使用無前綴 utilities，重複語意樣式以 `@reference`／`@apply` 放在 components layer。保留原生表單驗證與特殊 CSS 效果，版面調整的執行時數值仍用 style。
- 全頁支援 320／390／768／1440px；表格在自己的容器水平捲動，手機導覽可開關，表單與視窗依斷點調整。斷點兩側與實際瀏覽器截圖依 `docs/ui-testing.md` 驗證。

### 後端分層（沿用 IA_Map）

沿用 IA_Map 依技術層分組的方式，各層再依業務功能拆檔。Python 目錄與檔案採小寫及底線命名；以下以 OTC 為例：

```text
backend/app/
├─ controllers/
│  ├─ __init__.py
│  └─ otc.py                     # OTC API 入口
├─ services/
│  ├─ __init__.py
│  └─ otc.py                     # OTC 業務規則與交易流程
├─ repositories/
│  ├─ __init__.py
│  └─ otc.py                     # OTC 資料庫查詢與寫入
├─ dto/
│  ├─ __init__.py
│  └─ otc.py                     # OTC 層間傳遞及 API 請求／回應型別
└─ entities/
   ├─ __init__.py
   └─ otc.py                     # 採用 ORM 時的資料表映射
```

| 庫存管理系統位置 | 責任 | IA_Map 對照 |
|---|---|---|
| `controllers/otc.py` | HTTP 端點、取得登入者、套用權限依賴、呼叫作業及回應 | `IA.Server/Controllers/` |
| `services/otc.py` | 入出庫規則、跨資料操作及交易流程 | `IA.Services/` |
| `repositories/otc.py` | 明確的資料庫查詢與寫入 | `IA.DataAccess/`，例如 `WeeklyProgressDao.cs` |
| `dto/otc.py` | 層間傳遞及 API 請求／回應型別、欄位驗證 | `IA.DataModels/Models/` |
| `entities/otc.py` | 採用 ORM 時的資料表映射 | `IA.DataModels/Entities/` |

由 `main.py` 組合各 controller 的 `APIRouter`。FastAPI 的路由功能放在 `controllers/`；層間傳遞型別及 API 請求／回應 DTO 放在 `dto/`。資料庫尚未選定，因此 `entities/`、ORM 及 migration 工具目前只保留設計位置。

一般業務流程由 controller 呼叫 service，再由 service 呼叫 repository。Repository 封裝具體查詢，避免預先建立通用 CRUD 基底類別。交易由 service 掌握，repository 不各自提交同一筆入庫流程中的部分寫入。

## 4. 業務模組與資料責任

| 模組 | 責任 | 需確認的邊界 |
|---|---|---|
| `auth` | 使用者身分、登入及權限 | 同系統共用登入或跨系統 SSO、NAS LDAP 用途、角色與操作權限 |
| `suppliers` | 廠商查詢與維護 | HIS／OTC 是否共用、資料來源、停用與刪除規則 |
| `his` | HIS 藥品查詢、允許欄位的修改與回寫 | 可寫欄位、讀寫介面及失敗處理 |
| `otc` | OTC 品項、入庫、出庫／耗用及領用 | 欄位、單位、扣庫時點與撤銷方式 |
| `stocktaking` | 盤點批次、實際數量輸入及差異計算 | 庫存基準、盤點期間異動、審核與調整方式 |

`controllers/his.py` 提供 HIS 作業 API，`services/his.py` 處理業務流程；`integrations/his` 處理外部 HIS 的連線、來源欄位轉換與讀寫。HIS 連線或欄位細節不散落到其他模組。

盤點模組不自行建立另一套扣庫規則。OTC 差異調整交給 OTC 的庫存異動作業；HIS 調整如何交由 HIS 執行仍待確認。HIS 與本系統資料庫也不能直接假設可共用同一筆交易，跨系統失敗與重試方式需配合 HIS 能力設計。

## 5. OTC 入庫資料流範例

以下是架構說明，不是已定案的 API 或業務規格。

```text
ReceiptPage
  → api/server/otc.ts
  → controllers/otc.py
  → services/otc.py
  → repositories/otc.py
  → 本系統資料庫
  → 回應入庫結果
  → 頁面更新庫存及異動資訊
```

1. 使用者掃描或輸入條碼，查詢 OTC 品項。找不到時提示新增；新增所需欄位及權限仍待確認。
2. 頁面收集入庫資訊並提供輸入提示。後端重新驗證數量、品項及權限，前端驗證不能取代後端驗證。
3. 入庫作業在同一筆資料庫交易中更新庫存並保存異動紀錄。任一步驟失敗就回復，避免只更新庫存或只留下紀錄。
4. 成功後回傳後端確認的結果，頁面重新取得或更新相關資訊；瀏覽器顯示的舊庫存不作為寫入依據。

多人同時入出庫時，需以資料庫能力保護庫存更新；鎖定、原子更新或版本檢查的方式在資料庫選定後決定。重複提交也需由後端防止同一筆作業重複入庫，不能只靠停用按鈕；識別方式及有效期限待 API 設計時確認。

## 6. API 與資料契約方向

- 建議 HTTP API 統一從 `/api` 提供，各業務模組有各自路由；端點名稱、版本策略及欄位尚未定案。
- 後端以明確的 request／response schema 定義契約；前端依契約使用具體 TypeScript 型別。
- TypeScript 型別不等於執行時驗證；外部輸入及回應依需要在邊界驗證。
- 欄位命名、日期、數量精度、單位、空值及錯誤格式需在 API 設計時共同確認，不使用遞迴轉換或猜測欄位名稱的方式掩蓋差異。
- 身分及權限在後端檢查；畫面隱藏按鈕只是操作提示。
- HIS 暫時無法讀寫時，需讓使用者知道操作失敗；是否允許快取及重試，依 HIS 契約確認。

### 跨系統 SSO 建議方案：OIDC

適用前提：已確認需要跨不同系統單一登入，且院內既有登入服務支援 OpenID Connect（OIDC）。建議採 Authorization Code Flow＋PKCE，由 FastAPI 處理授權碼交換與登入結果驗證，React 使用庫存管理系統自己的 Session Cookie。此為建議方案，院內協定、服務與參數尚待確認，尚未實作。

若 HIS、OTC 只是同一個庫存管理系統網站的功能頁面，可共用庫存管理系統登入狀態；是否另外串接院內 SSO，取決於是否需要沿用其他系統的登入狀態。

#### 跨網域登入流程

以下網域僅為說明範例：庫存管理系統使用 `app.example.com`，統一登入服務使用 `login.example.org`。

```text
瀏覽器／React          庫存管理系統 FastAPI                 統一登入服務
     │                      │                            │
     ├─ /api/auth/login ───→│                            │
     │←─ 導向登入服務 ──────┤                            │
     ├─ 帶登入服務 Cookie ──────────────────────────────→│
     │                      │          已登入：直接通過；未登入：要求登入
     │←─ 導回庫存管理系統 callback，帶一次性 code 與 state ──────┤
     ├─ /api/auth/callback →│                            │
     │                      ├─ code＋PKCE 交換 Token ───→│
     │                      │←─ ID Token／Access Token ──┤
     │                      │ 驗證結果，建立庫存管理系統 Session  │
     │←─ 庫存管理系統 Session Cookie┤                            │
     ├─ 後續 API 帶庫存管理系統 Cookie →│                        │
```

兩個網域各自持有自己的 Cookie，透過瀏覽器導向與一次性授權碼交換銜接。庫存管理系統不需要讀取登入服務的 Cookie，也不以共享跨網域 Cookie 作為設計前提。React 與庫存管理系統 API 建議部署在同一個網站入口，以 `/api` 存取後端。

授權碼（code）是短效、一次性的交換憑證；ID Token 用來表達驗證後的使用者身分；Access Token 用來存取其允許的 API。庫存管理系統的 Session Cookie 保存本系統的登入識別，各項用途分開。若需要保存 Access Token 或 Refresh Token，放在後端，瀏覽器只取得庫存管理系統的 Session Cookie。

#### 安全性：驗證身分與傳遞登入結果是兩件事

Auth Service 負責驗證使用者身分；Main 不會重新驗使用者密碼。Main 仍需確認收到的登入證明可信、確實由預期的 Auth Service 簽發、是發給 Main 使用且仍在有效期限內。這是驗證登入證明，不是重做身分驗證。

若 Auth Service 直接把 JWT 交給瀏覽器再帶回 Main，Main 仍可驗證該 JWT；但 Token 會經過瀏覽器，因此必須降低它被瀏覽器端程式、網址或其他客戶端位置讀取與重送的風險。直接傳遞 JWT 並非不能使用，仍須依協定正確驗證及保護 Token。

Authorization Code Flow 讓瀏覽器只把短效的一次性 `code` 帶回 Main；Main 的後端再直接向 Auth Service 交換 ID Token／Access Token。這會減少 Token 暴露給瀏覽器的機會，但 `code` 本身也會經過瀏覽器，因此不是單靠使用 `code` 就安全。

- **PKCE**：Main 保存 verifier，只有持有 verifier 的 Main 才能用 `code` 換 Token；降低截取 `code` 後被他人兌換的風險。
- **`state`**：讓 Main 核對 callback 是否對應自己發起的登入，防止偽造或串錯登入回呼。
- **精確登記 callback URL**：限制 Auth Service 將登入結果送回哪個 Main 網址。
- **JWT 驗證**：Main 檢查簽章、`iss`、`aud`、有效期限與本次登入的 `nonce`。無論 JWT 是透過 `code` 交換取得或直接收到，都需要驗證。
- **Main Session**：驗證成功後，Main 建立自己的 Session Cookie；後續由 Main 以 Session 識別使用者並檢查庫存管理系統權限。

因此，`code` 的主要安全作用是讓 Token 留在 Main 後端與 Auth Service 之間，並與 PKCE 等檢查搭配保護交換流程；它不會取代 Main 對 JWT 的驗證。以上是暫定的標準流程方向，實際採用方式仍要依院內 Auth Service 支援的協定及設定確認。

#### 雙方需準備的項目

| 院內登入服務提供／確認 | 庫存管理系統實作（端點為建議名稱） |
|---|---|
| OIDC discovery URL、發行者資訊 | `/api/auth/login`：建立登入請求並導向登入服務 |
| Client ID、必要時 Client Secret、支援 PKCE S256 | `/api/auth/callback`：交換授權碼、驗證登入結果並建立 Session |
| 登記完整且精確匹配的 callback URL | `/api/auth/me`：回傳目前使用者與庫存管理系統權限 |
| 登出端點與是否支援跨系統登出 | `/api/auth/logout`：清除庫存管理系統 Session；是否連動院內登出另行確認 |
| 使用者識別欄位、群組或角色資訊 | 以登入服務的發行者與使用者識別（`iss`＋`sub`）對應庫存管理系統帳號，再套用操作權限 |

#### 驗證與登入狀態處理

- 使用成熟的 OIDC 用戶端套件，設定 discovery、Client ID、必要的 Client Secret 及固定 callback URL。Client Secret 留在後端設定，不送至 React。
- 發起登入時產生並保存 `state`、PKCE verifier／challenge 與 `nonce`，回呼時依協定驗證，並處理取消登入、交換失敗與過期授權碼。
- 驗證 ID Token 的簽章、發行者 `iss`、接收對象 `aud`、有效期限及 `nonce`；僅解析 Token 內容不足以完成驗證。
- 成功後建立或更新庫存管理系統自己的 Session，重新產生 Session ID；Session Cookie 設定 `HttpOnly`、`Secure`。`SameSite` 依實際回呼方式設定；使用 Cookie 的修改 API 另行處理 CSRF。
- Session 過期後重新導向登入服務；若院內登入狀態仍有效，通常可直接返回。庫存管理系統登出與所有系統一起登出是不同需求，需先確認。
- 身分驗證成功後，HIS 修改、OTC 入出庫及盤點等權限仍由庫存管理系統後端檢查。

若院內只有 LDAP，需要另外提供將 LDAP 帳號整合到 OIDC 的身分服務；若既有 SSO 只支援 SAML，則配合其協定選用成熟套件。先取得院內登入服務的協定、整合文件與測試帳號，再決定實作細節。

#### 標準參考

- [OpenID Connect Core](https://www.openid.net/specs/openid-connect-core-1_0.html)：登入流程與 ID Token 驗證。
- [RFC 9700：OAuth 2.0 Security Best Current Practice](https://www.rfc-editor.org/rfc/rfc9700.html)：PKCE 與 callback URL 等安全要求。
- [RFC 10017：OAuth 2.0 for Browser-Based Applications](https://www.rfc-editor.org/rfc/rfc10017.html)：瀏覽器應用與後端的登入架構；同網域應用亦可於 OIDC 登入後自行維護 Session。

## 7. 待討論的決策

### 表格 Excel 匯出（格式待討論）

每一個表格皆需支援 Excel 匯出，暫採 `.xlsx`；正式格式、欄位順序、版型、日期格式、工作表分組與是否包含篩選條件／批次資訊仍需與使用者討論。

目前 Demo 匯出當前篩選結果的全部分頁，移除操作按鈕及唯讀提示。料號、條碼、電話保留文字型別；數量欄位使用數值。使用本機 SheetJS 套件於首次匯出時載入，匯出在瀏覽器完成，不上傳資料。

### 盤點批次期間與操作歷程

盤點分為兩個獨立路由：`/stocktake/history` 只查已結束批次，`/stocktake/current` 只查與操作進行中的週期。展示 SPA 使用 React Router 路徑 `/demo/stocktake/history`、`/demo/stocktake/current`，並在登入後進入指定頁面。歷史頁不接受掃碼、新建或送出現有批次；高權限更正只在歷史頁執行。正式 API 亦須依批次狀態隔離查詢與寫入，不只依靠前端頁面區分。

已確認：每次盤點是一段從開始到結束的期間，需記錄期間內的操作，不能只保留最終實盤與差異。

- 每個 HIS／OTC 批次有獨立識別、固定開始／結束時間及開始／結束人員；同工作區一次只開一個批次。
- 紀錄新增與重複掃描品項、儲存或取消實盤編輯、移除、盤點調整，以及期間內同工作區的入出庫與領用異動；移除明細不刪除歷程。
- 紀錄包含批次、操作時間、操作種類、料號、原值、新值、說明、結果與填寫人員。
- 實盤數量需人工填寫；獨立編輯頁保存草稿，送出前可重填，重填後需重新勾選確認。全部明細填妥並確認後整批二次確認送出，記錄送出時間／人員、結束期間並鎖定所有明細；不能修改、移除、取消確認或重複送出。送出前須一次驗證全部帳面庫存，避免部分完成。空白批次可結束；未送出的明細不能直接結束。
- Demo 僅將批次與紀錄保存在記憶體，重新整理會重置。正式版需由後端持久保存紀錄，並驗證批次狀態、登入身分及庫存併發；紀錄保留期限與更正規則待確認。

### 高權限資料修改與歷史更正

已確認：整個盤點批次一次送出並鎖定所有明細，一般人員不能修改。高權限人員可修改既有資料；已送出盤點改走獨立歷史更正流程，必填原因並追加原送出值、更正前後值、時間與人員。原批次與送出紀錄維持鎖定，不重開期間、不刪除歷程。Demo 不回溯調整目前庫存；正式對帳與庫存更正流程需確認。

Demo 登入選單僅展示一般／高權限差異，不能作正式授權。正式高權限須由 NAS LDAP 群組映射，後端每次讀寫驗證並持久保存修改／更正紀錄；實際群組與可修改欄位仍需確認。

### LDAP 登入、群組權限與忘記密碼

已選擇以NAS 的 LDAP 帳號驗證身分，並以 LDAP 群組對應庫存管理系統角色／操作權限，控制既有資料修改與料號啟用／停用；具體群組、角色和權限表仍需與使用者確認。設定檔不作為瀏覽器端的授權依據，是否另需料號可用清單仍待業務確認。

- 正式流程由後端連線 LDAP、驗證帳號並取得群組，再檢查每次 API 操作的權限；Demo 尚未串接，不以輸入的帳號字串推定實際權限。
- 忘記密碼介面收集 LDAP 帳號與登記信箱，密碼重設由院內身分管理服務或管理員提供。仍需確認是否有重設入口、信箱屬性、服務權限與人工協助流程。
- Demo 僅展示申請與返回登入，不查帳號、不寄信、不修改密碼。正式回應不得揭露帳號是否存在；若提供重設連結，需驗證單次且有期限的 token 並限制申請頻率。
- 正式連線的 TLS、LDAP 群組欄位及登入 session 設定，在整合前確認。

參考：[LDAP 認證規範 RFC 4513](https://www.rfc-editor.org/rfc/rfc4513)、[OWASP 忘記密碼流程](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)。

### 登入範圍需先確認

請確認：此處的 SSO 是指庫存管理系統同一個系統內，HIS、OTC 等功能共用一次登入，還是庫存管理系統與其他獨立系統之間的跨系統單一登入？

若是同一個系統，請確認各功能是否共用登入狀態及各自的操作權限；若是不同系統，請列出要整合的系統、既有驗證服務，以及登入狀態或 Token 如何取得與驗證。LDAP 指 NAS 的權限管理，作為帳號與群組權限來源，實際群組與角色映射需確認。

| 項目 | 目前狀態 | 影響 |
|---|---|---|
| OTC 資料庫 | 尚未選定 | 資料庫連線、ORM、migration、併發及備份 |
| HIS 串接 | 尚未確認是直接連資料庫或 API | 整合實作、回寫與錯誤處理 |
| 登入與權限 | 採 NAS LDAP 權限管理；群組映射與跨系統 SSO 範圍待確認 | 認證、session／token、角色與安全設定 |
| OTC 欄位與單位 | 待確認 | schema、資料表及入出庫驗證 |
| 領用與耗用關係 | 待確認 | 扣庫時點與避免重複扣庫 |
| 批號、效期、倉庫 | 待確認 | 庫存識別維度與作業流程 |
| 盤點調整 | 待確認 | 基準快照、審核及 HIS／OTC 調整 |
| 部署與維運 | 已確認集中部署，環境待確認 | HTTPS、服務啟動、日誌及備份還原 |

## 8. 後續實作驗證方向

這些是建立系統時的驗證目標，目前尚未執行：

- 前端：型別檢查，以及表單錯誤、提交失敗、重複點擊和成功後更新的操作驗證。
- API：有效／無效輸入、未登入、權限不足及一致的錯誤回應。
- OTC：入庫成功、交易中途失敗後回復、多人同時異動及重複提交。
- HIS：以 mock 驗證查詢、回寫失敗及逾時，不直接修改院內真實資料作為測試。
- 盤點：基準庫存、期間異動、差異計算及不同來源的調整責任。
- 部署：瀏覽器至 API 的連線、多人登入隔離、日誌及備份還原。

## 9. 開發規格準備清單

<p>對應規劃主頁的六項確認事項。需求目前為「待確認」，開發文件為「待補開發規格」；列出準備內容不代表已定案或已完成實作。確認結果由文件維護，本頁不提供勾選或回答保存功能。</p>
<p><a href="../frontend/index.html#development-readiness">返回客戶需求確認摘要</a></p>
<details id="prep-scope">
<summary>01 · 第一版範圍</summary>
<p><span class="status">待補開發規格</span> · <a href="../frontend/index.html#confirmation-scope">對應主頁需求：待確認</a></p>
<ul>
<li>逐項列出第一版必做、延後與不包含的功能，對應目前功能模組及畫面。</li>
<li>將批號、效期、倉庫、報表與審核等未決項目列入討論，未確認前不列為交付承諾。</li>
<li>產出第一版交付清單；每項保留確認結果、確認人與確認日期。</li>
</ul>
</details>
<details id="prep-fields">
<summary>02 · 欄位與資料模型</summary>
<p><span class="status">待補開發規格</span> · <a href="../frontend/index.html#confirmation-fields">對應主頁需求：待確認</a></p>
<ul>
<li>整理欄位名稱、用途、型別、必填、空值、長度、數量精度、單位、可修改範圍與驗證條件。</li>
<li>標明資料來源、HIS／OTC 的維護責任，以及廠商、品項、作業單與異動紀錄的關聯。</li>
<li>確認採購、入庫、領用與耗用是否需要單位換算，並確認批號／效期／倉庫是否影響庫存識別。</li>
<li>產出欄位規格表與資料關聯圖，再依已確認的規則設計資料表。</li>
</ul>
</details>
<details id="prep-permissions">
<summary>03 · 角色與權限</summary>
<p><span class="status">待補開發規格</span> · <a href="../frontend/index.html#confirmation-permissions">對應主頁需求：待確認</a></p>
<ul>
<li>列出實際使用角色及各模組的查詢、新增、修改、停用、撤銷、審核與庫存調整權限。</li>
<li>確認是否限制院區、部門或倉庫，以及 HIS 可修改欄位是否依角色不同。</li>
<li>產出操作權限表，對應畫面操作與後端 API 檢查；隱藏按鈕不能取代後端權限驗證。</li>
</ul>
</details>
<details id="prep-rules">
<summary>04 · 作業與狀態</summary>
<p><span class="status">待補開發規格</span> · <a href="../frontend/index.html#confirmation-rules">對應主頁需求：待確認</a></p>
<ul>
<li>定義各作業需要的狀態與可執行操作，確認是否需要審核、何時完成、何時扣庫。</li>
<li>釐清領用與耗用的關係，避免同一筆作業重複扣庫；確認撤銷、更正、退回與歷程保留方式。</li>
<li>確認盤點基準、盤點期間入出庫、差異審核與調整方式，分別標示 HIS／OTC 責任。</li>
<li>產出作業規則與狀態流程。HIS 日常扣庫由 HIS 執行；HIS 盤點如何交由 HIS 調整仍待確認。</li>
<li>Demo 的領用立即扣庫及 HIS 盤點直接調整僅為展示假設。</li>
</ul>
</details>
<details id="prep-failures">
<summary>05 · 異常處理與 API 契約</summary>
<p><span class="status">待補開發規格</span> · <a href="../frontend/index.html#confirmation-failures">對應主頁需求：待確認</a></p>
<ul>
<li>列出未知條碼、庫存不足、未登入、權限不足、HIS 逾時／回寫失敗、重複提交及多人修改等情境。</li>
<li>各情境記錄提示內容、資料是否改變、是否可重試，以及使用者下一步；重試不可造成重複入出庫。</li>
<li>API 契約需定義請求與回應欄位、錯誤格式、權限、日期／空值／數量單位，以及重複提交與併發處理。</li>
<li>產出異常情境清單與 API 契約，串起前端提示、後端驗證與資料交易。具體端點及欄位尚未定案。</li>
</ul>
</details>
<details id="prep-acceptance">
<summary>06 · 驗收與追溯</summary>
<p><span class="status">待補開發規格</span> · <a href="../frontend/index.html#confirmation-acceptance">對應主頁需求：待確認</a></p>
<ul>
<li>每個驗收案例列出操作前提、測試資料、操作步驟、預期畫面與資料結果。</li>
<li>同時涵蓋成功、無效輸入、權限不足、失敗後資料不變、重複提交及多人異動。</li>
<li>以需求編號對應規劃板的分類／Frame、欄位、作業規則、API 與驗收案例；Frame 編號需連同分類記錄。</li>
<li>定案時記錄確認人、確認日期與版本；需求變更時更新受影響的畫面、契約與驗收案例。</li>
<li>產出客戶驗收案例與需求對照表；Demo 操作成功不代表正式 API、資料庫或院內整合已驗收。</li>
</ul>
</details>
<details id="prep-integration">
<summary>共通準備 · 整合與部署</summary>
<p><span class="status">待補開發規格</span> · 支援上述六項需求的技術準備</p>
<ul>
<li>取得院內登入方式、HIS 讀寫介面與允許回寫範圍；確認測試環境、帳號及失敗處理能力。</li>
<li>確認 OTC 資料庫、既有資料匯入來源、初始庫存基準與資料核對方式。</li>
<li>確認部署環境、HTTPS、設定與憑證管理、日誌、備份還原及維運責任。</li>
<li>產出整合契約、部署與資料匯入計畫、備份還原驗證方式；沿用集中部署與 React／FastAPI 的已確認方向。</li>
</ul>
<p><a href="../architecture.html#section-7">查看既有待討論決策</a></p>
</details>
<h3 id="receipt-spec-example">OTC 入庫規格整理 · 待確認範例</h3>
<p>以下只示範整理方式，不預先決定實際欄位、API 端點、請求格式或庫存識別維度。數量 10 是驗收示例，並非正式作業限制。</p>
<div class="table-wrap" tabindex="0" role="region" aria-label="OTC 入庫待確認範例，可左右捲動">
<table><thead><tr><th scope="col">對應項目</th><th scope="col">整理方式</th></tr></thead><tbody>
<tr><th scope="row">01 · 範圍與畫面</th><td>對應規劃板「OTC 掃碼入庫」的掃碼、已有品項、未建檔補建及結果畫面；先確認第一版是否包含補建品項。</td></tr>
<tr><th scope="row">02 · 欄位</th><td>先確認品項如何識別、數量與單位如何表達；批號、效期、廠商單號、倉庫或儲位是否必填，由需求決定。</td></tr>
<tr><th scope="row">03 · 權限</th><td>分別確認誰可入庫、誰可補建品項，以及完成後誰可更正或撤銷。</td></tr>
<tr><th scope="row">04 · 規則</th><td>確認何時入帳、是否需審核、庫存及異動紀錄如何一起保存，以及誤入庫如何處理。</td></tr>
<tr><th scope="row">05 · API 與異常</th><td>依前述答案定義請求、回應、權限與錯誤；確認同次提交如何識別、失敗是否可重試及多人異動如何處理。</td></tr>
<tr><th scope="row">06 · 驗收</th><td>待確認案例：對已啟用品項，在已確認的庫存維度與單位下入庫 10；成功後庫存增加 10 並保留一筆異動。同次提交重送不再增加；交易中途失敗時庫存與紀錄皆不改變。審核需求若成立，依已確認的入帳時點調整此案例。</td></tr>
</tbody></table>
</div>
<p><a href="../board.html">查看畫面規劃板</a> · <a href="../architecture.html#section-5">對照既有 OTC 入庫資料流</a></p>

## 出入庫傳票與批次

進銷存／OTC 出入庫查詢的主要單位為傳票批次；盤點的核對單位為品項（料號），仍保留盤點週期與歷史紀錄，不以出入庫傳票切割盤點數量。總覽、入庫及出庫篩選首先提供 `voucherId`，可輸入完整編號或日期前綴，並與料號、人員、日期、動作及工作區條件取交集。未建立傳票的舊資料不納入指定批次；空白表示所有批次。建議選項由已入帳異動的批次編號提供，不混入未送出草稿或取消傳票。

總覽初始仍為當日所有資料；輸入批次時清除單日日期限制，避免歷史批次被當日預設遮蔽，使用者可再填日期。日期空白可查全部期間，重設回當日；出入庫頁保留明確填寫的起訖時間。各頁查詢條件獨立，查詢重設頁碼，Excel 匯出目前篩選後的全部明細。

- 一張傳票對應一個入庫或出庫批次，可包含多筆掃碼明細。按「建立傳票」開始；尚未選擇傳票時，第一筆加入明細也會自動建立草稿。
- 編號為本地建立日期 `YYYYMMDD` 加三碼流水號 `001`–`999`，例如 `20260101001`。當日入庫與出庫共用序列；翌日重新從 `001` 開始。建立日期與編號固定，跨日送出不改號，取消不回收號碼，超過 `999` 明確拒絕建立。
- 草稿可移除明細、取消或切換查閱；掃碼／補建品項加入草稿時不更新庫存。補建品項先以庫存 0 建立主檔，取消傳票仍保留主檔。
- 整批確認送出時重新驗證所有料號、數量、啟用狀態與出庫總量（重複料號累計）；任一驗證失敗，整批不更新。成功後更新庫存，每筆異動保存 `voucherId`，傳票記錄建立／送出人員與時間，送出明細鎖定且不可重複提交。
- 傳票明細與異動表沿用分頁、XLSX 匯出；舊展示資料以「未建立」標示，不補造歷史傳票。
- 目前只有記憶體 Demo。正式服務須在資料庫交易內分配每日序列、保證傳票編號唯一，並以交易及提交冪等控制整批庫存更新；瀏覽器本地序列不是多使用者的正式編號來源。

## 參考資料

- [FastAPI：Bigger Applications — Multiple Files](https://fastapi.tiangolo.com/tutorial/bigger-applications/)：`APIRouter` 的模組拆分與組合方式；本文件的業務分區及 controller／service／資料存取層分工是庫存管理系統的設計建議。
- [React：Thinking in React](https://react.dev/learn/thinking-in-react)：元件拆分及 state 歸屬的基本思路；不代表 React 要求本文件的目錄格式。

共用庫存篩選：`compileInventoryFilter` 編譯料號／人員／日期條件並驗證日期，`matchesInventoryFilter` 對明確的 materialNumber、person、timestamp 契約取交集，React `FilterForm` 管理各表的查詢草稿。料號與人員去除前後空白、不分大小寫、包含搜尋；空白表示所有。單日含本地 00:00 至下一日開始前，起訖時間含結束分鐘，可單邊填寫；有日期條件而缺少時間戳記的資料不納入。庫存總覽／出庫／入庫以填寫人員與 recordedAt 對應，領用表以領用人與 requisitionedAt 對應。四頁保存獨立條件，庫存總覽保留當日預設、動作／工作區條件，出庫保留分類及日期快捷；搜尋重設頁碼，XLSX 匯出篩選後全部分頁。

入庫／出庫共用條碼查詢：電腦進頁、取消或完成後自動聚焦條碼欄，掃碼槍以鍵盤方式輸入完整條碼並送 Enter；保留前導零，手動輸入也按 Enter。觸控裝置不強制聚焦，以「開啟相機掃碼」授權啟用相機，指定後鏡頭（facingMode exact environment），無後鏡頭時提示，不回退前鏡頭；ZXing Browser 0.2.1 多格式辨識套件首次使用才從本機 vendor 載入，辨識成功停止相機並呼叫同一查詢流程。關閉、切換頁面、登出、背景化及延後授權完成時釋放影像串流。HTTPS／localhost 與瀏覽器相機權限為必要條件；不申請音訊、不上傳影像。已驗證 DOM 操作與模擬串流生命週期，仍需實際手機鏡頭、印製條碼及掃碼槍驗收。

### OTC 歷史平均成本價

新增 OTC「歷史平均成本價」查詢頁，依已送出入庫傳票的料號與當次單價快照計算。2026-10-15 使用者確認採數量加權平均：入庫總金額除以入庫總數量（10 個 × 20 元＋30 個 × 40 元，平均 35 元）。這是歷史採購成本平均，出庫不納入，也不是現存庫存估價。

入庫明細可填「本次入庫單價」，每張新傳票都是新的交易資料，不修改既有品項成本價；留空沿用加入明細當時的主檔成本價，仍無值則保存 null。未建檔入庫沿用此次新建成本價。送出後保留當次品名、單位及成本快照，不隨主檔變更；草稿及取消不計算。零元是有效價格，缺少任何單價時該料號不顯示完整平均價，不能把未知成本當零。整數分及 BigInt 累計金額，除法後四捨五入至兩位小數。

篩選批次、料號、送出人員及送出日期後，平均價代表目前查詢範圍。摘要與原始入庫明細都有分頁及 XLSX 匯出。此展示仍為記憶體資料，重新整理會重置；正式後端須持久化不可變成本快照並在送出交易中驗證單價。
