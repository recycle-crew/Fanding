# 方鼎程式架構規劃

更新日期：2026-10-14  
狀態：架構討論草案，尚未建立 React／FastAPI 正式專案。

本文件整理方鼎 HIS 與 OTC 庫存系統的技術方向、程式碼結構和責任邊界。目錄與檔名是後續開發的建議起點；資料庫、HIS 串接方式及部分業務規則仍待確認，不代表已完成實作。

## 1. 已確認的方向

| 項目 | 決定 |
|---|---|
| 前端 | React＋TypeScript |
| 後端 | Python＋FastAPI |
| 使用方式 | 院內多人共用，集中部署，透過瀏覽器操作 |
| 功能分區 | HIS 與 OTC 分開呈現；另有登入、廠商及盤點模組 |
| HIS 扣庫 | 由 HIS 執行 |
| 本次交付 | 架構文件 |

目前目錄中的 `index.html`、`demo.html` 與 `board.html` 是既有規劃及示範素材，不是下述 React／FastAPI 架構的正式實作。

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
fangding/
├─ frontend/
│  ├─ package.json
│  ├─ tsconfig.json
│  └─ src/
│     ├─ app/                    # 程式入口、路由、整體版面
│     ├─ features/               # 依業務分區
│     │  ├─ auth/
│     │  ├─ suppliers/
│     │  ├─ his/
│     │  ├─ otc/
│     │  └─ stocktaking/
│     ├─ components/
│     │  └─ ui/                  # 跨模組共用的介面元件
│     └─ api/                    # HTTP 設定與通用錯誤處理
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

後端 `app/` 與其下所有 Python 套件目錄統一放置 `__init__.py`，內容可為空。文件、靜態資源等非 Python 套件目錄不需要放置。上述目錄是規劃，不要求在沒有實作需求時先建立空目錄。前端建置工具、套件版本、Python 版本及套件管理工具在建立專案時另行確認。

### 前端模組

以 OTC 入庫作為責任分配範例：

```text
frontend/src/features/otc/
├─ pages/
│  └─ ReceiptPage.tsx           # 資料載入、表單狀態、驗證及提交流程
├─ components/
│  └─ ReceiptForm.tsx           # 入庫表單介面
├─ api.ts                      # OTC API 請求及回應邊界
└─ types.ts                    # OTC 使用的具體型別
```

- `app/` 組合頁面及版面；業務操作留在對應 `features/`。
- 單一頁面的載入、提交與狀態由該頁面擁有；只有形成清楚的共用行為或獨立元件責任時才拆出。
- `components/ui/` 放跨模組共用元件；OTC 專用表單留在 OTC 模組。
- `api/` 處理連線及通用錯誤，不包含入庫規則或頁面狀態。
- 前端型別按業務模組歸屬；不建立涵蓋所有領域的通用型別雜物檔。

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

| 方鼎位置 | 責任 | IA_Map 對照 |
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
  → OTC api.ts
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

適用前提：已確認需要跨不同系統單一登入，且院內既有登入服務支援 OpenID Connect（OIDC）。建議採 Authorization Code Flow＋PKCE，由 FastAPI 處理授權碼交換與登入結果驗證，React 使用方鼎自己的 Session Cookie。此為建議方案，院內協定、服務與參數尚待確認，尚未實作。

若 HIS、OTC 只是同一個方鼎網站的功能頁面，可共用方鼎登入狀態；是否另外串接院內 SSO，取決於是否需要沿用其他系統的登入狀態。

#### 跨網域登入流程

以下網域僅為說明範例：方鼎使用 `app.example.com`，統一登入服務使用 `login.example.org`。

```text
瀏覽器／React          方鼎 FastAPI                 統一登入服務
     │                      │                            │
     ├─ /api/auth/login ───→│                            │
     │←─ 導向登入服務 ──────┤                            │
     ├─ 帶登入服務 Cookie ──────────────────────────────→│
     │                      │          已登入：直接通過；未登入：要求登入
     │←─ 導回方鼎 callback，帶一次性 code 與 state ──────┤
     ├─ /api/auth/callback →│                            │
     │                      ├─ code＋PKCE 交換 Token ───→│
     │                      │←─ ID Token／Access Token ──┤
     │                      │ 驗證結果，建立方鼎 Session  │
     │←─ 方鼎 Session Cookie┤                            │
     ├─ 後續 API 帶方鼎 Cookie →│                        │
```

兩個網域各自持有自己的 Cookie，透過瀏覽器導向與一次性授權碼交換銜接。方鼎不需要讀取登入服務的 Cookie，也不以共享跨網域 Cookie 作為設計前提。React 與方鼎 API 建議部署在同一個網站入口，以 `/api` 存取後端。

授權碼（code）是短效、一次性的交換憑證；ID Token 用來表達驗證後的使用者身分；Access Token 用來存取其允許的 API。方鼎的 Session Cookie 保存本系統的登入識別，各項用途分開。若需要保存 Access Token 或 Refresh Token，放在後端，瀏覽器只取得方鼎的 Session Cookie。

#### 安全性：驗證身分與傳遞登入結果是兩件事

Auth Service 負責驗證使用者身分；Main 不會重新驗使用者密碼。Main 仍需確認收到的登入證明可信、確實由預期的 Auth Service 簽發、是發給 Main 使用且仍在有效期限內。這是驗證登入證明，不是重做身分驗證。

若 Auth Service 直接把 JWT 交給瀏覽器再帶回 Main，Main 仍可驗證該 JWT；但 Token 會經過瀏覽器，因此必須降低它被瀏覽器端程式、網址或其他客戶端位置讀取與重送的風險。直接傳遞 JWT 並非不能使用，仍須依協定正確驗證及保護 Token。

Authorization Code Flow 讓瀏覽器只把短效的一次性 `code` 帶回 Main；Main 的後端再直接向 Auth Service 交換 ID Token／Access Token。這會減少 Token 暴露給瀏覽器的機會，但 `code` 本身也會經過瀏覽器，因此不是單靠使用 `code` 就安全。

- **PKCE**：Main 保存 verifier，只有持有 verifier 的 Main 才能用 `code` 換 Token；降低截取 `code` 後被他人兌換的風險。
- **`state`**：讓 Main 核對 callback 是否對應自己發起的登入，防止偽造或串錯登入回呼。
- **精確登記 callback URL**：限制 Auth Service 將登入結果送回哪個 Main 網址。
- **JWT 驗證**：Main 檢查簽章、`iss`、`aud`、有效期限與本次登入的 `nonce`。無論 JWT 是透過 `code` 交換取得或直接收到，都需要驗證。
- **Main Session**：驗證成功後，Main 建立自己的 Session Cookie；後續由 Main 以 Session 識別使用者並檢查方鼎權限。

因此，`code` 的主要安全作用是讓 Token 留在 Main 後端與 Auth Service 之間，並與 PKCE 等檢查搭配保護交換流程；它不會取代 Main 對 JWT 的驗證。以上是暫定的標準流程方向，實際採用方式仍要依院內 Auth Service 支援的協定及設定確認。

#### 雙方需準備的項目

| 院內登入服務提供／確認 | 方鼎實作（端點為建議名稱） |
|---|---|
| OIDC discovery URL、發行者資訊 | `/api/auth/login`：建立登入請求並導向登入服務 |
| Client ID、必要時 Client Secret、支援 PKCE S256 | `/api/auth/callback`：交換授權碼、驗證登入結果並建立 Session |
| 登記完整且精確匹配的 callback URL | `/api/auth/me`：回傳目前使用者與方鼎權限 |
| 登出端點與是否支援跨系統登出 | `/api/auth/logout`：清除方鼎 Session；是否連動院內登出另行確認 |
| 使用者識別欄位、群組或角色資訊 | 以登入服務的發行者與使用者識別（`iss`＋`sub`）對應方鼎帳號，再套用操作權限 |

#### 驗證與登入狀態處理

- 使用成熟的 OIDC 用戶端套件，設定 discovery、Client ID、必要的 Client Secret 及固定 callback URL。Client Secret 留在後端設定，不送至 React。
- 發起登入時產生並保存 `state`、PKCE verifier／challenge 與 `nonce`，回呼時依協定驗證，並處理取消登入、交換失敗與過期授權碼。
- 驗證 ID Token 的簽章、發行者 `iss`、接收對象 `aud`、有效期限及 `nonce`；僅解析 Token 內容不足以完成驗證。
- 成功後建立或更新方鼎自己的 Session，重新產生 Session ID；Session Cookie 設定 `HttpOnly`、`Secure`。`SameSite` 依實際回呼方式設定；使用 Cookie 的修改 API 另行處理 CSRF。
- Session 過期後重新導向登入服務；若院內登入狀態仍有效，通常可直接返回。方鼎登出與所有系統一起登出是不同需求，需先確認。
- 身分驗證成功後，HIS 修改、OTC 入出庫及盤點等權限仍由方鼎後端檢查。

若院內只有 LDAP，需要另外提供將 LDAP 帳號整合到 OIDC 的身分服務；若既有 SSO 只支援 SAML，則配合其協定選用成熟套件。先取得院內登入服務的協定、整合文件與測試帳號，再決定實作細節。

#### 標準參考

- [OpenID Connect Core](https://www.openid.net/specs/openid-connect-core-1_0.html)：登入流程與 ID Token 驗證。
- [RFC 9700：OAuth 2.0 Security Best Current Practice](https://www.rfc-editor.org/rfc/rfc9700.html)：PKCE 與 callback URL 等安全要求。
- [RFC 10017：OAuth 2.0 for Browser-Based Applications](https://www.rfc-editor.org/rfc/rfc10017.html)：瀏覽器應用與後端的登入架構；同網域應用亦可於 OIDC 登入後自行維護 Session。

## 7. 待討論的決策

### 登入範圍需先確認

請確認：此處的 SSO 是指方鼎同一個系統內，HIS、OTC 等功能共用一次登入，還是方鼎與其他獨立系統之間的跨系統單一登入？

若是同一個系統，請確認各功能是否共用登入狀態及各自的操作權限；若是不同系統，請列出要整合的系統、既有驗證服務，以及登入狀態或 Token 如何取得與驗證。NAS LDAP 是否僅用於帳密驗證，也需另外確認。

| 項目 | 目前狀態 | 影響 |
|---|---|---|
| OTC 資料庫 | 尚未選定 | 資料庫連線、ORM、migration、併發及備份 |
| HIS 串接 | 尚未確認是直接連資料庫或 API | 整合實作、回寫與錯誤處理 |
| 登入與權限 | 待確認為同系統共用登入或跨系統 SSO；NAS LDAP 用途亦待確認 | 認證、session／token、角色與安全設定 |
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
<p><a href="../index.html#development-readiness">返回客戶需求確認摘要</a></p>
<details id="prep-scope">
<summary>01 · 第一版範圍</summary>
<p><span class="status">待補開發規格</span> · <a href="../index.html#confirmation-scope">對應主頁需求：待確認</a></p>
<ul>
<li>逐項列出第一版必做、延後與不包含的功能，對應目前功能模組及畫面。</li>
<li>將批號、效期、倉庫、報表與審核等未決項目列入討論，未確認前不列為交付承諾。</li>
<li>產出第一版交付清單；每項保留確認結果、確認人與確認日期。</li>
</ul>
</details>
<details id="prep-fields">
<summary>02 · 欄位與資料模型</summary>
<p><span class="status">待補開發規格</span> · <a href="../index.html#confirmation-fields">對應主頁需求：待確認</a></p>
<ul>
<li>整理欄位名稱、用途、型別、必填、空值、長度、數量精度、單位、可修改範圍與驗證條件。</li>
<li>標明資料來源、HIS／OTC 的維護責任，以及廠商、品項、作業單與異動紀錄的關聯。</li>
<li>確認採購、入庫、領用與耗用是否需要單位換算，並確認批號／效期／倉庫是否影響庫存識別。</li>
<li>產出欄位規格表與資料關聯圖，再依已確認的規則設計資料表。</li>
</ul>
</details>
<details id="prep-permissions">
<summary>03 · 角色與權限</summary>
<p><span class="status">待補開發規格</span> · <a href="../index.html#confirmation-permissions">對應主頁需求：待確認</a></p>
<ul>
<li>列出實際使用角色及各模組的查詢、新增、修改、停用、撤銷、審核與庫存調整權限。</li>
<li>確認是否限制院區、部門或倉庫，以及 HIS 可修改欄位是否依角色不同。</li>
<li>產出操作權限表，對應畫面操作與後端 API 檢查；隱藏按鈕不能取代後端權限驗證。</li>
</ul>
</details>
<details id="prep-rules">
<summary>04 · 作業與狀態</summary>
<p><span class="status">待補開發規格</span> · <a href="../index.html#confirmation-rules">對應主頁需求：待確認</a></p>
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
<p><span class="status">待補開發規格</span> · <a href="../index.html#confirmation-failures">對應主頁需求：待確認</a></p>
<ul>
<li>列出未知條碼、庫存不足、未登入、權限不足、HIS 逾時／回寫失敗、重複提交及多人修改等情境。</li>
<li>各情境記錄提示內容、資料是否改變、是否可重試，以及使用者下一步；重試不可造成重複入出庫。</li>
<li>API 契約需定義請求與回應欄位、錯誤格式、權限、日期／空值／數量單位，以及重複提交與併發處理。</li>
<li>產出異常情境清單與 API 契約，串起前端提示、後端驗證與資料交易。具體端點及欄位尚未定案。</li>
</ul>
</details>
<details id="prep-acceptance">
<summary>06 · 驗收與追溯</summary>
<p><span class="status">待補開發規格</span> · <a href="../index.html#confirmation-acceptance">對應主頁需求：待確認</a></p>
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

## 參考資料

- [FastAPI：Bigger Applications — Multiple Files](https://fastapi.tiangolo.com/tutorial/bigger-applications/)：`APIRouter` 的模組拆分與組合方式；本文件的業務分區及 controller／service／資料存取層分工是方鼎的設計建議。
- [React：Thinking in React](https://react.dev/learn/thinking-in-react)：元件拆分及 state 歸屬的基本思路；不代表 React 要求本文件的目錄格式。
