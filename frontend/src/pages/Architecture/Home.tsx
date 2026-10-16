import { Link } from "react-router";
import React from "react";
import { TableFrame } from "@/components/ui/DataTable";
export function ArchitecturePage() {
  return (
    <main>
      <div className={"hero"}>
        <div>
          <div className={"eyebrow"}>{"CODE ARCHITECTURE / 程式架構規劃"}</div>
          <h1>
            {"從畫面到資料，"}
            <br />
            {"看清程式分工。"}
          </h1>
          <span className={"badge"}>{"架構討論草案 · 2026-10-14"}</span>
          <p className={"intro"}>
            {
              "前端以 React＋TypeScript 呈現操作，後端以 Python＋FastAPI 處理業務與資料存取。沿用 IA_Map 的 Controller、Service、Repository、DTO 與 Entity 分層，各層再依業務功能拆檔。"
            }
          </p>
          <a className={"button"} href={"#section-3"}>
            {"查看程式目錄 ↓"}
          </a>
        </div>
        {"\n"}
        <aside
          className={"system-map"}
          aria-label={
            "系統架構圖：瀏覽器透過 HTTP API 連接 FastAPI，再由後端存取資料庫及 HIS"
          }
        >
          <div className={"eyebrow"}>{"系統連線方向"}</div>
          <div className={"node"}>
            <strong>{"React＋TypeScript"}</strong>
            <small>{"院內使用者的瀏覽器 · 頁面與操作狀態"}</small>
          </div>
          <div className={"connector"}>{"↓ HTTP API /api"}</div>
          <div className={"node server"}>
            <strong>{"Python＋FastAPI"}</strong>
            <small>{"登入與權限 · 業務規則 · 交易流程"}</small>
          </div>
          <div className={"connector"}>{"↓ 由後端存取資料"}</div>
          <div className={"destinations"}>
            <div className={"node"}>
              <strong>{"本系統資料庫"}</strong>
              <small>
                {"OTC 等管理資料"}
                <br />
                {"資料庫選型待確認"}
              </small>
            </div>
            <div className={"node"}>
              <strong>{"HIS 整合介面"}</strong>
              <small>
                {"查詢與允許的回寫"}
                <br />
                {"扣庫由 HIS 執行"}
              </small>
            </div>
          </div>
        </aside>
      </div>
      {"\n"}
      <div
        className={
          "document-layout tw:grid tw:grid-cols-[220px_minmax(0,1fr)] tw:gap-[42px] tw:document:grid-cols-1 tw:document:gap-4 tw:print:block"
        }
      >
        <aside className={"contents"}>
          <p>{"閱讀導覽"}</p>
          <nav aria-label={"架構文件"}>
            <a href={"#section-1"}>{"1. 已確認的方向"}</a>
            <a href={"#section-2"}>{"2. 系統與部署邊界"}</a>
            <a href={"#section-3"}>{"3. 建議目錄結構"}</a>
            <a href={"#section-4"}>{"4. 業務模組與資料責任"}</a>
            <a href={"#section-5"}>{"5. OTC 入庫資料流範例"}</a>
            <a href={"#section-6"}>{"6. API 與資料契約方向"}</a>
            <a href={"#oidc-login"}>{"跨系統 SSO／OIDC 流程"}</a>
            <a href={"#section-7"}>{"7. 待討論的決策"}</a>
            <a href={"#section-8"}>{"8. 後續實作驗證方向"}</a>
            <a href={"#preparation"}>{"9. 開發規格準備清單"}</a>
            <a href={"#receipt-spec-example"}>{"OTC 入庫待確認範例"}</a>
            <a href={"#section-9"}>{"參考資料"}</a>
          </nav>
        </aside>
        <article className={"document"} id={"document"} aria-label={"架構文件"}>
          <p>
            {
              "更新日期：2026-10-16　狀態：展示前端已改為 React＋TypeScript／Vite；FastAPI、正式資料連線及身分整合仍為架構規劃。"
            }
          </p>
          <p>
            {
              "本文件整理庫存管理系統 HIS 與 OTC 庫存系統的技術方向、程式碼結構和責任邊界。目錄與檔名是後續開發的建議起點；資料庫、HIS 串接方式及部分業務規則仍待確認，不代表已完成實作。"
            }
          </p>
          <section id={"section-1"}>
            <h2>{"1. 已確認的方向"}</h2>
            <TableFrame
              tableKey="document-table-1"
              headers={
                <>
                  <tr>
                    <th scope={"col"}>{"項目"}</th>
                    <th scope={"col"}>{"決定"}</th>
                  </tr>
                </>
              }
              rows={[
                <tr>
                  <td>{"前端"}</td>
                  <td>{"React＋TypeScript"}</td>
                </tr>,
                <tr>
                  <td>{"後端"}</td>
                  <td>{"Python＋FastAPI"}</td>
                </tr>,
                <tr>
                  <td>{"使用方式"}</td>
                  <td>{"院內多人共用，集中部署，透過瀏覽器操作"}</td>
                </tr>,
                <tr>
                  <td>{"功能分區"}</td>
                  <td>{"HIS 與 OTC 分開呈現；另有登入、廠商及盤點模組"}</td>
                </tr>,
                <tr>
                  <td>{"HIS 扣庫"}</td>
                  <td>{"由 HIS 執行"}</td>
                </tr>,
                <tr>
                  <td>{"本次交付"}</td>
                  <td>{"全站 React 展示前端、靜態 build 與瀏覽器驗證"}</td>
                </tr>,
              ]}
              columns={2}
              region={"1. 已確認的方向，可左右捲動"}
            />
            <p>
              {"目前 frontend/ 僅保留單一 HTML 入口 "}
              <code>{"index.html"}</code>
              {
                "，由 React Router 切換規劃、架構、規劃板及 Demo。根目錄 npm run build 產出 frontend/dist/。展示資料透過 Redux store 保存在記憶體，站內切換保留，重新整理重置，不是正式登入或後端整合。"
              }
            </p>
            <p>
              前端依 IA_Map 的 IA.Client 分層：main.tsx 掛載 React，App.tsx
              承接全站路由保護；pages 各模組以 Layout.tsx 的 Outlet 承載 Home
              或其他子頁，Layout 管共用外殼、頁面管操作流程。features
              放功能與業務規則，router/routes 定義路由，store 使用 Redux
              Toolkit，types 保存領域型別，helpers 提供篩選與 Excel，styles
              集中樣式，components 提供共用介面。@/ 對應 src。 正式 API
              與後端仍為後續規劃。
            </p>
          </section>
          <section id={"section-2"}>
            <h2>{"2. 系統與部署邊界"}</h2>
            <pre tabIndex={0} aria-label={"架構與程式目錄，可左右捲動"}>
              <code>
                {
                  "院內使用者的瀏覽器\n        │\n        ▼\nReact＋TypeScript\n        │ HTTP API\n        ▼\nPython＋FastAPI\n        ├─ 本系統資料庫：OTC 等本系統管理資料\n        └─ HIS 整合介面：HIS 資料查詢及允許的回寫"
                }
              </code>
            </pre>
            <p>
              {
                "瀏覽器只透過 FastAPI 存取業務資料。資料庫連線、HIS 存取、登入驗證及庫存異動規則由後端處理；連線帳密與金鑰不送到前端，也不寫入 Git。"
              }
            </p>
            <p>
              {"建議正式部署以同一個網站入口提供 React 靜態檔及 "}
              <code>{"/api"}</code>
              {
                " 路徑，由院內反向代理轉送 API 請求至 FastAPI。實際伺服器作業系統、代理產品、HTTPS 憑證及登入環境仍待確認。開發時可分開啟動前後端；開發埠號不作為正式部署契約。"
              }
            </p>
            <p>
              {
                "先以單一後端應用承載各業務模組。集中部署與多人共用不等於需要微服務；後續依實際負載決定程序數量及擴充方式。"
              }
            </p>
          </section>
          <section id={"section-3"}>
            <h2>{"3. 建議目錄結構"}</h2>
            <pre tabIndex={0} aria-label={"架構與程式目錄，可左右捲動"}>
              <code>
                {
                  "Fanding/\n├─ package.json                # npm workspace 指令入口\n├─ package-lock.json           # workspace 依賴鎖定\n├─ frontend/\n│  ├─ package.json\n│  ├─ index.html               # SPA 唯一 HTML 入口\n│  ├─ vite.config.ts\n│  ├─ playwright.config.js\n│  ├─ tests/                   # 瀏覽器案例與截圖基準\n│  ├─ scripts/                 # 畫面擷取與正式產物驗證\n│  ├─ tsconfig.json\n│  └─ src/\n│     ├─ main.tsx              # 掛載 React、Redux Provider 與 Router\n│     ├─ App.tsx               # 全站外殼與路由保護\n│     ├─ pages/\n│     │  ├─ Planning/          # Layout.tsx、Home.tsx\n│     │  ├─ Architecture/      # Layout.tsx、Home.tsx\n│     │  ├─ Board/             # Layout.tsx、Home.tsx\n│     │  ├─ Demo/              # Layout.tsx 共用工作區、Home.tsx 頁面流程\n│     │  └─ Error/             # Layout.tsx、NotFound.tsx\n│     ├─ features/             # demo 功能與交易、planning 場景\n│     ├─ components/\n│     │  ├─ layout/            # 側欄與版面元件\n│     │  └─ ui/                # 表格、篩選表單與視窗\n│     ├─ router/               # index.tsx、routes 分模組路由\n│     ├─ store/                # Redux store、typed hooks、展示 slice\n│     ├─ constants/            # 模組路徑契約\n│     ├─ helpers/              # 庫存篩選與 Excel 匯出\n│     ├─ styles/               # tailwind.css、layout、themes；全站 Tailwind CSS\n│     ├─ types/                # demo、inventory、suppliers、otc、stocktaking\n│     └─ api/server/           # 正式串接時新增，目前未建立\n├─ backend/\n│  ├─ pyproject.toml\n│  ├─ app/\n│  │  ├─ __init__.py\n│  │  ├─ main.py                 # 建立 FastAPI、註冊模組路由\n│  │  ├─ core/                   # 設定、登入與權限依賴\n│  │  │  └─ __init__.py\n│  │  ├─ db/                     # 本系統資料庫連線與交易資源\n│  │  │  └─ __init__.py\n│  │  ├─ integrations/\n│  │  │  ├─ __init__.py\n│  │  │  └─ his/                 # HIS 存取與來源欄位轉換\n│  │  │     └─ __init__.py\n│  │  ├─ controllers/                 # HTTP API 入口\n│  │  │  ├─ __init__.py\n│  │  │  ├─ auth.py\n│  │  │  ├─ suppliers.py\n│  │  │  ├─ his.py\n│  │  │  ├─ otc.py\n│  │  │  └─ stocktaking.py\n│  │  ├─ services/                 # 業務規則與交易流程\n│  │  │  ├─ __init__.py\n│  │  │  ├─ auth.py\n│  │  │  ├─ suppliers.py\n│  │  │  ├─ his.py\n│  │  │  ├─ otc.py\n│  │  │  └─ stocktaking.py\n│  │  ├─ repositories/           # 資料庫查詢與寫入\n│  │  │  ├─ __init__.py\n│  │  │  ├─ auth.py\n│  │  │  ├─ suppliers.py\n│  │  │  ├─ his.py\n│  │  │  ├─ otc.py\n│  │  │  └─ stocktaking.py\n│  │  ├─ dto/                    # 層間傳遞及 API 請求／回應型別\n│  │  │  ├─ __init__.py\n│  │  │  └─ otc.py\n│  │  └─ entities/               # 採用 ORM 時的資料表映射\n│  │     ├─ __init__.py\n│  │     └─ otc.py\n│  └─ tests/                     # 對應業務模組的後端測試\n└─ docs/\n   └─ architecture.md"
                }
              </code>
            </pre>
            <p>
              {"後端 "}
              <code>{"app/"}</code>
              {" 與其下所有 Python 套件目錄統一放置 "}
              <code>{"__init__.py"}</code>
              {
                "，內容可為空。文件、靜態資源等非 Python 套件目錄不需要放置。後端目錄仍為規劃，不要求先建立空目錄。展示前端已採 Vite，套件版本固定於 frontend/package.json 與根目錄 package-lock.json；Python 版本及後端套件管理工具仍待確認。"
              }
            </p>
            <h3>{"前端模組"}</h3>
            <p>{"以 OTC 入庫作為責任分配範例："}</p>
            <pre tabIndex={0} aria-label={"架構與程式目錄，可左右捲動"}>
              <code>
                {
                  "frontend/src/\n├─ pages/Otc/Layout.tsx        # OTC 模組外殼，以 Outlet 承載子頁（規劃）\n├─ pages/Otc/Receipt.tsx        # 正式入庫頁面（規劃）\n├─ features/otc/ReceiptForm.tsx # OTC 專用表單（規劃）\n├─ router/routes/otcRoutes.tsx  # OTC 路由（規劃）\n├─ api/server/otc.ts           # OTC HTTP 請求（規劃）\n└─ types/otc/index.ts          # OTC 領域型別（已建立）"
                }
              </code>
            </pre>
            <ul>
              <li>
                <code>{"App.tsx、pages/"}</code>
                {
                  " 依全站與模組分層：各模組 Layout 以 Outlet 承載 Home 或其他子頁；共用導覽與版面由 Layout 持有，頁面擁有操作流程，功能元件與業務規則留在對應 "
                }
                <code>{"features/"}</code>
                {"。"}
              </li>
              <li>
                {
                  "單一頁面的載入、提交與狀態由該頁面擁有；只有形成清楚的共用行為或獨立元件責任時才拆出。"
                }
              </li>
              <li>
                <code>{"components/ui/"}</code>
                {" 放跨模組共用元件；OTC 專用表單留在 OTC 模組。"}
              </li>
              <li>
                <code>{"api/server/"}</code>
                {" 處理連線及通用錯誤，不包含入庫規則或頁面狀態。"}
              </li>
              <li>
                {"前端型別按業務模組歸屬；不建立涵蓋所有領域的通用型別雜物檔。"}
              </li>
            </ul>
            <h3>{"後端分層（沿用 IA_Map）"}</h3>
            <p>
              {
                "沿用 IA_Map 依技術層分組的方式，各層再依業務功能拆檔。Python 目錄與檔案採小寫及底線命名；以下以 OTC 為例："
              }
            </p>
            <pre tabIndex={0} aria-label={"架構與程式目錄，可左右捲動"}>
              <code>
                {
                  "backend/app/\n├─ controllers/\n│  ├─ __init__.py\n│  └─ otc.py                     # OTC API 入口\n├─ services/\n│  ├─ __init__.py\n│  └─ otc.py                     # OTC 業務規則與交易流程\n├─ repositories/\n│  ├─ __init__.py\n│  └─ otc.py                     # OTC 資料庫查詢與寫入\n├─ dto/\n│  ├─ __init__.py\n│  └─ otc.py                     # OTC 層間傳遞及 API 請求／回應型別\n└─ entities/\n   ├─ __init__.py\n   └─ otc.py                     # 採用 ORM 時的資料表映射"
                }
              </code>
            </pre>
            <TableFrame
              tableKey="document-table-2"
              headers={
                <>
                  <tr>
                    <th scope={"col"}>{"庫存管理系統位置"}</th>
                    <th scope={"col"}>{"責任"}</th>
                    <th scope={"col"}>{"IA_Map 對照"}</th>
                  </tr>
                </>
              }
              rows={[
                <tr>
                  <td>
                    <code>{"controllers/otc.py"}</code>
                  </td>
                  <td>
                    {"HTTP 端點、取得登入者、套用權限依賴、呼叫作業及回應"}
                  </td>
                  <td>
                    <code>{"IA.Server/Controllers/"}</code>
                  </td>
                </tr>,
                <tr>
                  <td>
                    <code>{"services/otc.py"}</code>
                  </td>
                  <td>{"入出庫規則、跨資料操作及交易流程"}</td>
                  <td>
                    <code>{"IA.Services/"}</code>
                  </td>
                </tr>,
                <tr>
                  <td>
                    <code>{"repositories/otc.py"}</code>
                  </td>
                  <td>{"明確的資料庫查詢與寫入"}</td>
                  <td>
                    <code>{"IA.DataAccess/"}</code>
                    {"，例如 "}
                    <code>{"WeeklyProgressDao.cs"}</code>
                  </td>
                </tr>,
                <tr>
                  <td>
                    <code>{"dto/otc.py"}</code>
                  </td>
                  <td>{"層間傳遞及 API 請求／回應型別、欄位驗證"}</td>
                  <td>
                    <code>{"IA.DataModels/Models/"}</code>
                  </td>
                </tr>,
                <tr>
                  <td>
                    <code>{"entities/otc.py"}</code>
                  </td>
                  <td>{"採用 ORM 時的資料表映射"}</td>
                  <td>
                    <code>{"IA.DataModels/Entities/"}</code>
                  </td>
                </tr>,
              ]}
              columns={3}
              region={"3. 建議目錄結構，可左右捲動"}
            />
            <p>
              {"由 "}
              <code>{"main.py"}</code>
              {" 組合各 controller 的 "}
              <code>{"APIRouter"}</code>
              {"。FastAPI 的路由功能放在 "}
              <code>{"controllers/"}</code>
              {"；層間傳遞型別及 API 請求／回應 DTO 放在 "}
              <code>{"dto/"}</code>
              {"。資料庫尚未選定，因此 "}
              <code>{"entities/"}</code>
              {"、ORM 及 migration 工具目前只保留設計位置。"}
            </p>
            <p>
              {
                "一般業務流程由 controller 呼叫 service，再由 service 呼叫 repository。Repository 封裝具體查詢，避免預先建立通用 CRUD 基底類別。交易由 service 掌握，repository 不各自提交同一筆入庫流程中的部分寫入。"
              }
            </p>
          </section>
          <section id={"section-4"}>
            <h2>{"4. 業務模組與資料責任"}</h2>
            <TableFrame
              tableKey="document-table-3"
              headers={
                <>
                  <tr>
                    <th scope={"col"}>{"模組"}</th>
                    <th scope={"col"}>{"責任"}</th>
                    <th scope={"col"}>{"需確認的邊界"}</th>
                  </tr>
                </>
              }
              rows={[
                <tr>
                  <td>
                    <code>{"auth"}</code>
                  </td>
                  <td>{"使用者身分、登入及權限"}</td>
                  <td>
                    {
                      "同系統共用登入或跨系統 SSO、NAS LDAP 用途、角色與操作權限"
                    }
                  </td>
                </tr>,
                <tr>
                  <td>
                    <code>{"suppliers"}</code>
                  </td>
                  <td>{"廠商查詢與維護"}</td>
                  <td>{"HIS／OTC 是否共用、資料來源、停用與刪除規則"}</td>
                </tr>,
                <tr>
                  <td>
                    <code>{"his"}</code>
                  </td>
                  <td>{"HIS 藥品查詢、允許欄位的修改與回寫"}</td>
                  <td>{"可寫欄位、讀寫介面及失敗處理"}</td>
                </tr>,
                <tr>
                  <td>
                    <code>{"otc"}</code>
                  </td>
                  <td>{"OTC 品項、入庫、出庫／耗用及領用"}</td>
                  <td>{"欄位、單位、扣庫時點與撤銷方式"}</td>
                </tr>,
                <tr>
                  <td>
                    <code>{"stocktaking"}</code>
                  </td>
                  <td>{"盤點批次、實際數量輸入及差異計算"}</td>
                  <td>{"庫存基準、盤點期間異動、審核與調整方式"}</td>
                </tr>,
              ]}
              columns={3}
              region={"4. 業務模組與資料責任，可左右捲動"}
            />
            <p>
              <code>{"controllers/his.py"}</code>
              {" 提供 HIS 作業 API，"}
              <code>{"services/his.py"}</code>
              {" 處理業務流程；"}
              <code>{"integrations/his"}</code>
              {
                " 處理外部 HIS 的連線、來源欄位轉換與讀寫。HIS 連線或欄位細節不散落到其他模組。"
              }
            </p>
            <p>
              {
                "盤點模組不自行建立另一套扣庫規則。OTC 差異調整交給 OTC 的庫存異動作業；HIS 調整如何交由 HIS 執行仍待確認。HIS 與本系統資料庫也不能直接假設可共用同一筆交易，跨系統失敗與重試方式需配合 HIS 能力設計。"
              }
            </p>
          </section>
          <section id={"section-5"}>
            <h2>{"5. OTC 入庫資料流範例"}</h2>
            <p>{"以下是架構說明，不是已定案的 API 或業務規格。"}</p>
            <pre tabIndex={0} aria-label={"架構與程式目錄，可左右捲動"}>
              <code>
                {
                  "ReceiptPage\n  → api/server/otc.ts\n  → controllers/otc.py\n  → services/otc.py\n  → repositories/otc.py\n  → 本系統資料庫\n  → 回應入庫結果\n  → 頁面更新庫存及異動資訊"
                }
              </code>
            </pre>
            <ol>
              <li>
                {
                  "使用者掃描或輸入條碼，查詢 OTC 品項。找不到時提示新增；新增所需欄位及權限仍待確認。"
                }
              </li>
              <li>
                {
                  "頁面收集入庫資訊並提供輸入提示。後端重新驗證數量、品項及權限，前端驗證不能取代後端驗證。"
                }
              </li>
              <li>
                {
                  "入庫作業在同一筆資料庫交易中更新庫存並保存異動紀錄。任一步驟失敗就回復，避免只更新庫存或只留下紀錄。"
                }
              </li>
              <li>
                {
                  "成功後回傳後端確認的結果，頁面重新取得或更新相關資訊；瀏覽器顯示的舊庫存不作為寫入依據。"
                }
              </li>
            </ol>
            <p>
              {
                "多人同時入出庫時，需以資料庫能力保護庫存更新；鎖定、原子更新或版本檢查的方式在資料庫選定後決定。重複提交也需由後端防止同一筆作業重複入庫，不能只靠停用按鈕；識別方式及有效期限待 API 設計時確認。"
              }
            </p>
          </section>
          <section id={"section-6"}>
            <h2>{"6. API 與資料契約方向"}</h2>
            <ul>
              <li>
                {"建議 HTTP API 統一從 "}
                <code>{"/api"}</code>
                {
                  " 提供，各業務模組有各自路由；端點名稱、版本策略及欄位尚未定案。"
                }
              </li>
              <li>
                {
                  "後端以明確的 request／response schema 定義契約；前端依契約使用具體 TypeScript 型別。"
                }
              </li>
              <li>
                {
                  "TypeScript 型別不等於執行時驗證；外部輸入及回應依需要在邊界驗證。"
                }
              </li>
              <li>
                {
                  "欄位命名、日期、數量精度、單位、空值及錯誤格式需在 API 設計時共同確認，不使用遞迴轉換或猜測欄位名稱的方式掩蓋差異。"
                }
              </li>
              <li>{"身分及權限在後端檢查；畫面隱藏按鈕只是操作提示。"}</li>
              <li>
                {
                  "HIS 暫時無法讀寫時，需讓使用者知道操作失敗；是否允許快取及重試，依 HIS 契約確認。"
                }
              </li>
            </ul>
            <h3 id={"oidc-login"}>{"跨系統 SSO 建議方案：OIDC"}</h3>
            <p>
              {
                "適用前提：已確認需要跨不同系統單一登入，且院內既有登入服務支援 OpenID Connect（OIDC）。建議採 Authorization Code Flow＋PKCE，由 FastAPI 處理授權碼交換與登入結果驗證，React 使用庫存管理系統自己的 Session Cookie。此為建議方案，院內協定、服務與參數尚待確認，尚未實作。"
              }
            </p>
            <p>
              {
                "若 HIS、OTC 只是同一個庫存管理系統網站的功能頁面，可共用庫存管理系統登入狀態；是否另外串接院內 SSO，取決於是否需要沿用其他系統的登入狀態。"
              }
            </p>
            <h4>{"跨網域登入流程"}</h4>
            <p>
              {"以下網域僅為說明範例：庫存管理系統使用 "}
              <code>{"app.example.com"}</code>
              {"，統一登入服務使用 "}
              <code>{"login.example.org"}</code>
              {"。"}
            </p>
            <pre tabIndex={0} aria-label={"跨網域登入流程，可左右捲動"}>
              <code>
                {
                  "瀏覽器／React          庫存管理系統 FastAPI                 統一登入服務\n     │                      │                            │\n     ├─ /api/auth/login ───→│                            │\n     │←─ 導向登入服務 ──────┤                            │\n     ├─ 帶登入服務 Cookie ──────────────────────────────→│\n     │                      │          已登入：直接通過；未登入：要求登入\n     │←─ 導回庫存管理系統 callback，帶一次性 code 與 state ──────┤\n     ├─ /api/auth/callback →│                            │\n     │                      ├─ code＋PKCE 交換 Token ───→│\n     │                      │←─ ID Token／Access Token ──┤\n     │                      │ 驗證結果，建立庫存管理系統 Session  │\n     │←─ 庫存管理系統 Session Cookie┤                            │\n     ├─ 後續 API 帶庫存管理系統 Cookie →│                        │"
                }
              </code>
            </pre>
            <p>
              {
                "兩個網域各自持有自己的 Cookie，透過瀏覽器導向與一次性授權碼交換銜接。庫存管理系統不需要讀取登入服務的 Cookie，也不以共享跨網域 Cookie 作為設計前提。React 與庫存管理系統 API 建議部署在同一個網站入口，以 "
              }
              <code>{"/api"}</code>
              {" 存取後端。"}
            </p>
            <p>
              {
                "授權碼（code）是短效、一次性的交換憑證；ID Token 用來表達驗證後的使用者身分；Access Token 用來存取其允許的 API。庫存管理系統的 Session Cookie 保存本系統的登入識別，各項用途分開。若需要保存 Access Token 或 Refresh Token，放在後端，瀏覽器只取得庫存管理系統的 Session Cookie。"
              }
            </p>
            <h4>{"安全性：驗證身分與傳遞登入結果是兩件事"}</h4>
            {"\n"}
            <p>
              {
                "Auth Service 負責驗證使用者身分；Main 不會重新驗使用者密碼。Main 仍需確認收到的登入證明可信、確實由預期的 Auth Service 簽發、是發給 Main 使用且仍在有效期限內。這是驗證登入證明，不是重做身分驗證。"
              }
            </p>
            {"\n"}
            <p>
              {
                "若 Auth Service 直接把 JWT 交給瀏覽器再帶回 Main，Main 仍可驗證該 JWT；但 Token 會經過瀏覽器，因此必須降低它被瀏覽器端程式、網址或其他客戶端位置讀取與重送的風險。直接傳遞 JWT 並非不能使用，仍須依協定正確驗證及保護 Token。"
              }
            </p>
            {"\n"}
            <p>
              {"Authorization Code Flow 讓瀏覽器只把短效的一次性 "}
              <code>{"code"}</code>
              {
                " 帶回 Main；Main 的後端再直接向 Auth Service 交換 ID Token／Access Token。這會減少 Token 暴露給瀏覽器的機會，但 "
              }
              <code>{"code"}</code>
              {" 本身也會經過瀏覽器，因此不是單靠使用 "}
              <code>{"code"}</code>
              {" 就安全。"}
            </p>
            {"\n"}
            <ul>
              <li>
                <strong>{"PKCE："}</strong>
                {"Main 保存 verifier，只有持有 verifier 的 Main 才能用 "}
                <code>{"code"}</code>
                {" 換 Token；降低截取 "}
                <code>{"code"}</code>
                {" 後被他人兌換的風險。"}
              </li>
              <li>
                <strong>
                  <code>{"state"}</code>
                  {"："}
                </strong>
                {
                  "讓 Main 核對 callback 是否對應自己發起的登入，防止偽造或串錯登入回呼。"
                }
              </li>
              <li>
                <strong>{"精確登記 callback URL："}</strong>
                {"限制 Auth Service 將登入結果送回哪個 Main 網址。"}
              </li>
              <li>
                <strong>{"JWT 驗證："}</strong>
                {"Main 檢查簽章、"}
                <code>{"iss"}</code>
                {"、"}
                <code>{"aud"}</code>
                {"、有效期限與本次登入的 "}
                <code>{"nonce"}</code>
                {"。無論 JWT 是透過 "}
                <code>{"code"}</code>
                {" 交換取得或直接收到，都需要驗證。"}
              </li>
              <li>
                <strong>{"Main Session："}</strong>
                {
                  "驗證成功後，Main 建立自己的 Session Cookie；後續由 Main 以 Session 識別使用者並檢查庫存管理系統權限。"
                }
              </li>
            </ul>
            {"\n"}
            <p>
              {"因此，"}
              <code>{"code"}</code>
              {
                " 的主要安全作用是讓 Token 留在 Main 後端與 Auth Service 之間，並與 PKCE 等檢查搭配保護交換流程；它不會取代 Main 對 JWT 的驗證。以上是暫定的標準流程方向，實際採用方式仍要依院內 Auth Service 支援的協定及設定確認。"
              }
            </p>
            {"\n"}
            <h4>{"雙方需準備的項目"}</h4>
            <TableFrame
              tableKey="document-table-4"
              headers={
                <>
                  <tr>
                    <th scope={"col"}>{"院內登入服務提供／確認"}</th>
                    <th scope={"col"}>
                      {"庫存管理系統實作（端點為建議名稱）"}
                    </th>
                  </tr>
                </>
              }
              rows={[
                <tr>
                  <td>{"OIDC discovery URL、發行者資訊"}</td>
                  <td>
                    <code>{"/api/auth/login"}</code>
                    {"：建立登入請求並導向登入服務"}
                  </td>
                </tr>,
                <tr>
                  <td>{"Client ID、必要時 Client Secret、支援 PKCE S256"}</td>
                  <td>
                    <code>{"/api/auth/callback"}</code>
                    {"：交換授權碼、驗證登入結果並建立 Session"}
                  </td>
                </tr>,
                <tr>
                  <td>{"登記完整且精確匹配的 callback URL"}</td>
                  <td>
                    <code>{"/api/auth/me"}</code>
                    {"：回傳目前使用者與庫存管理系統權限"}
                  </td>
                </tr>,
                <tr>
                  <td>{"登出端點與是否支援跨系統登出"}</td>
                  <td>
                    <code>{"/api/auth/logout"}</code>
                    {"：清除庫存管理系統 Session；是否連動院內登出另行確認"}
                  </td>
                </tr>,
                <tr>
                  <td>{"使用者識別欄位、群組或角色資訊"}</td>
                  <td>
                    {"以登入服務的發行者與使用者識別（"}
                    <code>{"iss"}</code>
                    {"＋"}
                    <code>{"sub"}</code>
                    {"）對應庫存管理系統帳號，再套用操作權限"}
                  </td>
                </tr>,
              ]}
              columns={2}
              region={"SSO 整合分工，可左右捲動"}
            />
            <h4>{"驗證與登入狀態處理"}</h4>
            <ul>
              <li>
                {
                  "使用成熟的 OIDC 用戶端套件，設定 discovery、Client ID、必要的 Client Secret 及固定 callback URL。Client Secret 留在後端設定，不送至 React。"
                }
              </li>
              <li>
                {"發起登入時產生並保存 "}
                <code>{"state"}</code>
                {"、PKCE verifier／challenge 與 "}
                <code>{"nonce"}</code>
                {"，回呼時依協定驗證，並處理取消登入、交換失敗與過期授權碼。"}
              </li>
              <li>
                {"驗證 ID Token 的簽章、發行者 "}
                <code>{"iss"}</code>
                {"、接收對象 "}
                <code>{"aud"}</code>
                {"、有效期限及 "}
                <code>{"nonce"}</code>
                {"；僅解析 Token 內容不足以完成驗證。"}
              </li>
              <li>
                {
                  "成功後建立或更新庫存管理系統自己的 Session，重新產生 Session ID；Session Cookie 設定 "
                }
                <code>{"HttpOnly"}</code>
                {"、"}
                <code>{"Secure"}</code>
                {"。"}
                <code>{"SameSite"}</code>
                {" 依實際回呼方式設定；使用 Cookie 的修改 API 另行處理 CSRF。"}
              </li>
              <li>
                {
                  "Session 過期後重新導向登入服務；若院內登入狀態仍有效，通常可直接返回。庫存管理系統登出與所有系統一起登出是不同需求，需先確認。"
                }
              </li>
              <li>
                {
                  "身分驗證成功後，HIS 修改、OTC 入出庫及盤點等權限仍由庫存管理系統後端檢查。"
                }
              </li>
            </ul>
            <p>
              {
                "若院內只有 LDAP，需要另外提供將 LDAP 帳號整合到 OIDC 的身分服務；若既有 SSO 只支援 SAML，則配合其協定選用成熟套件。先取得院內登入服務的協定、整合文件與測試帳號，再決定實作細節。"
              }
            </p>
            <h4>{"標準參考"}</h4>
            <ul>
              <li>
                <a
                  href={
                    "https://www.openid.net/specs/openid-connect-core-1_0.html"
                  }
                >
                  {"OpenID Connect Core"}
                </a>
                {"：登入流程與 ID Token 驗證。"}
              </li>
              <li>
                <a href={"https://www.rfc-editor.org/rfc/rfc9700.html"}>
                  {"RFC 9700：OAuth 2.0 Security Best Current Practice"}
                </a>
                {"：PKCE 與 callback URL 等安全要求。"}
              </li>
              <li>
                <a href={"https://www.rfc-editor.org/rfc/rfc10017.html"}>
                  {"RFC 10017：OAuth 2.0 for Browser-Based Applications"}
                </a>
                {
                  "：瀏覽器應用與後端的登入架構；同網域應用亦可於 OIDC 登入後自行維護 Session。"
                }
              </li>
            </ul>
          </section>
          <section id={"section-7"}>
            <h2>{"7. 待討論的決策"}</h2>
            <h3 id={"excel-export-spec"}>{"表格 Excel 匯出（格式待討論）"}</h3>
            <p>
              {
                "每一個表格皆需 Excel 匯出，暫採 .xlsx。正式格式、欄位順序、版型、日期格式、工作表分組與是否包含篩選條件／批次資訊仍需與使用者討論。Demo 匯出目前篩選結果的全部分頁，不含操作按鈕或唯讀提示；料號、條碼與電話保留文字型別。匯出在瀏覽器完成，不上傳資料。"
              }
            </p>
            <h3 id={"stocktake-period"}>{"盤點批次期間與操作歷程"}</h3>
            <p>
              {"分為兩個路由："}
              <Link to={"/demo/stocktake/history"}>{"歷史盤點紀錄"}</Link>
              {"只查已結束批次；"}
              <Link to={"/demo/stocktake/current"}>{"現有盤點週期"}</Link>
              {
                "只查與操作進行中批次。高權限歷史更正僅在歷史路由執行，歷史頁不提供掃碼或新建現有批次。正式 API 亦須依批次狀態隔離讀寫。"
              }
            </p>
            <p>
              {
                "每次盤點為開始至結束的一段期間，記錄固定開始／結束時間及人員。保留新增、掃描、儲存或取消編輯、移除、調整，以及同工作區期間內的入出庫與領用操作。操作紀錄包含時間、種類、料號、原值、新值、說明、結果與填寫人員；移除明細不刪除歷程。"
              }
            </p>
            <p>
              {
                "實盤需人工填寫；草稿可修改，全部明細填妥並勾選後整批確認送出。送出前一次驗證全部帳面庫存，成功後記錄送出時間／人員、結束期間並鎖定全部明細，不能再修改、移除或重複送出。"
              }
            </p>
            <p>
              {
                "批次結束後仍可查閱，後續操作不加入已結束期間。Demo 僅在記憶體保存，正式版需後端持久化與狀態／權限驗證；保留期限與更正規則待確認。"
              }
            </p>
            <h3 id={"privileged-correction"}>{"高權限資料修改與歷史更正"}</h3>
            <p>
              {
                "整個盤點批次一次送出並鎖定所有明細，一般人員不可修改。高權限可修改既有資料；已送出盤點則以獨立歷史更正保存原因、原送出值、更正前後值、時間與人員。原批次仍鎖定，不重開期間、不刪歷程。Demo 不回溯調整現庫存，正式對帳與庫存更正流程待確認。"
              }
            </p>
            <p>
              {
                "登入權限選單僅為展示；正式高權限由 NAS LDAP 群組映射並由後端驗證，具體群組及欄位權限待確認。"
              }
            </p>
            <h3 id={"activation-policy"}>{"LDAP 登入、群組權限與忘記密碼"}</h3>
            <p>
              {
                "已選擇NAS 的 LDAP 帳號驗證與 LDAP 群組對應系統角色／操作權限。具體群組、可修改欄位與料號啟用／停用權限需與使用者確認；是否另需料號可用清單仍待業務確認。"
              }
            </p>
            <ul>
              <li>
                {
                  "後端連線 LDAP、驗證身分並取得群組，每次 API 操作檢查權限；目前靜態 Demo 尚未串接。"
                }
              </li>
              <li>
                {
                  "忘記密碼介面填寫 LDAP 帳號與登記信箱；實際重設由院內身分管理服務或管理員提供，服務入口及權限待確認。"
                }
              </li>
              <li>
                {
                  "Demo 僅展示申請與返回登入，不查帳號、不寄信、不修改密碼。正式回應不揭露帳號是否存在，重設連結需單次、限時並限制申請頻率。"
                }
              </li>
              <li>{"LDAP 連線 TLS、群組欄位與角色映射需在整合前確認。"}</li>
            </ul>
            <p>
              {"參考："}
              <a href={"https://www.rfc-editor.org/rfc/rfc4513"}>
                {"LDAP 認證規範"}
              </a>
              {"、"}
              <a
                href={
                  "https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html"
                }
              >
                {"OWASP 忘記密碼流程"}
              </a>
              {"。"}
            </p>
            <h3>{"登入範圍需先確認"}</h3>
            <p>
              {
                "請確認：此處的 SSO 是指庫存管理系統同一個系統內，HIS、OTC 等功能共用一次登入，還是庫存管理系統與其他獨立系統之間的跨系統單一登入？"
              }
            </p>
            <p>
              {
                "若是同一個系統，請確認各功能是否共用登入狀態及各自的操作權限；若是不同系統，請列出要整合的系統、既有驗證服務，以及登入狀態或 Token 如何取得與驗證。LDAP 指 NAS 的權限管理，作為帳號與群組權限來源，實際群組與角色映射需確認。"
              }
            </p>
            <TableFrame
              tableKey="document-table-5"
              headers={
                <>
                  <tr>
                    <th scope={"col"}>{"項目"}</th>
                    <th scope={"col"}>{"目前狀態"}</th>
                    <th scope={"col"}>{"影響"}</th>
                  </tr>
                </>
              }
              rows={[
                <tr>
                  <td>{"OTC 資料庫"}</td>
                  <td>{"尚未選定"}</td>
                  <td>{"資料庫連線、ORM、migration、併發及備份"}</td>
                </tr>,
                <tr>
                  <td>{"HIS 串接"}</td>
                  <td>{"尚未確認是直接連資料庫或 API"}</td>
                  <td>{"整合實作、回寫與錯誤處理"}</td>
                </tr>,
                <tr>
                  <td>{"登入與權限"}</td>
                  <td>
                    {"採 NAS LDAP 權限管理；群組映射與跨系統 SSO 範圍待確認"}
                  </td>
                  <td>{"認證、session／token、角色與安全設定"}</td>
                </tr>,
                <tr>
                  <td>{"OTC 欄位與單位"}</td>
                  <td>{"待確認"}</td>
                  <td>{"schema、資料表及入出庫驗證"}</td>
                </tr>,
                <tr>
                  <td>{"領用與耗用關係"}</td>
                  <td>{"待確認"}</td>
                  <td>{"扣庫時點與避免重複扣庫"}</td>
                </tr>,
                <tr>
                  <td>{"批號、效期、倉庫"}</td>
                  <td>{"待確認"}</td>
                  <td>{"庫存識別維度與作業流程"}</td>
                </tr>,
                <tr>
                  <td>{"盤點調整"}</td>
                  <td>{"待確認"}</td>
                  <td>{"基準快照、審核及 HIS／OTC 調整"}</td>
                </tr>,
                <tr>
                  <td>{"部署與維運"}</td>
                  <td>{"已確認集中部署，環境待確認"}</td>
                  <td>{"HTTPS、服務啟動、日誌及備份還原"}</td>
                </tr>,
              ]}
              columns={3}
              region={"7. 待討論的決策，可左右捲動"}
            />
          </section>
          <section id={"section-8"}>
            <h2>{"8. 後續實作驗證方向"}</h2>
            <p>{"這些是建立系統時的驗證目標，目前尚未執行："}</p>
            <ul>
              <li>
                {
                  "前端：型別檢查，以及表單錯誤、提交失敗、重複點擊和成功後更新的操作驗證。"
                }
              </li>
              <li>
                {"API：有效／無效輸入、未登入、權限不足及一致的錯誤回應。"}
              </li>
              <li>
                {"OTC：入庫成功、交易中途失敗後回復、多人同時異動及重複提交。"}
              </li>
              <li>
                {
                  "HIS：以 mock 驗證查詢、回寫失敗及逾時，不直接修改院內真實資料作為測試。"
                }
              </li>
              <li>
                {"盤點：基準庫存、期間異動、差異計算及不同來源的調整責任。"}
              </li>
              <li>
                {"部署：瀏覽器至 API 的連線、多人登入隔離、日誌及備份還原。"}
              </li>
            </ul>
          </section>
          <section id={"preparation"}>
            <h2>{"9. 開發規格準備清單"}</h2>
            {"\n"}
            <p>
              {
                "對應規劃主頁的六項確認事項。需求目前為「待確認」，開發文件為「待補開發規格」；列出準備內容不代表已定案或已完成實作。確認結果由文件維護，本頁不提供勾選或回答保存功能。"
              }
            </p>
            {"\n"}
            <p>
              <Link to={"/#development-readiness"}>
                {"返回客戶需求確認摘要"}
              </Link>
            </p>
            {"\n"}
            <details id={"prep-scope"}>
              {"\n"}
              <summary>{"01 · 第一版範圍"}</summary>
              {"\n"}
              <p>
                <span className={"status"}>{"待補開發規格"}</span>
                {" · "}
                <Link to={"/#confirmation-scope"}>
                  {"對應主頁需求：待確認"}
                </Link>
              </p>
              {"\n"}
              <ul>
                {"\n"}
                <li>
                  {
                    "逐項列出第一版必做、延後與不包含的功能，對應目前功能模組及畫面。"
                  }
                </li>
                {"\n"}
                <li>
                  {
                    "將批號、效期、倉庫、報表與審核等未決項目列入討論，未確認前不列為交付承諾。"
                  }
                </li>
                {"\n"}
                <li>
                  {"產出第一版交付清單；每項保留確認結果、確認人與確認日期。"}
                </li>
                {"\n"}
              </ul>
              {"\n"}
            </details>
            {"\n"}
            <details id={"prep-fields"}>
              {"\n"}
              <summary>{"02 · 欄位與資料模型"}</summary>
              {"\n"}
              <p>
                <span className={"status"}>{"待補開發規格"}</span>
                {" · "}
                <Link to={"/#confirmation-fields"}>
                  {"對應主頁需求：待確認"}
                </Link>
              </p>
              {"\n"}
              <ul>
                {"\n"}
                <li>
                  {
                    "整理欄位名稱、用途、型別、必填、空值、長度、數量精度、單位、可修改範圍與驗證條件。"
                  }
                </li>
                {"\n"}
                <li>
                  {
                    "標明資料來源、HIS／OTC 的維護責任，以及廠商、品項、作業單與異動紀錄的關聯。"
                  }
                </li>
                {"\n"}
                <li>
                  {
                    "確認採購、入庫、領用與耗用是否需要單位換算，並確認批號／效期／倉庫是否影響庫存識別。"
                  }
                </li>
                {"\n"}
                <li>
                  {"產出欄位規格表與資料關聯圖，再依已確認的規則設計資料表。"}
                </li>
                {"\n"}
              </ul>
              {"\n"}
            </details>
            {"\n"}
            <details id={"prep-permissions"}>
              {"\n"}
              <summary>{"03 · 角色與權限"}</summary>
              {"\n"}
              <p>
                <span className={"status"}>{"待補開發規格"}</span>
                {" · "}
                <Link to={"/#confirmation-permissions"}>
                  {"對應主頁需求：待確認"}
                </Link>
              </p>
              {"\n"}
              <ul>
                {"\n"}
                <li>
                  {
                    "列出實際使用角色及各模組的查詢、新增、修改、停用、撤銷、審核與庫存調整權限。"
                  }
                </li>
                {"\n"}
                <li>
                  {
                    "確認是否限制院區、部門或倉庫，以及 HIS 可修改欄位是否依角色不同。"
                  }
                </li>
                {"\n"}
                <li>
                  {
                    "產出操作權限表，對應畫面操作與後端 API 檢查；隱藏按鈕不能取代後端權限驗證。"
                  }
                </li>
                {"\n"}
              </ul>
              {"\n"}
            </details>
            {"\n"}
            <details id={"prep-rules"}>
              {"\n"}
              <summary>{"04 · 作業與狀態"}</summary>
              {"\n"}
              <p>
                <span className={"status"}>{"待補開發規格"}</span>
                {" · "}
                <Link to={"/#confirmation-rules"}>
                  {"對應主頁需求：待確認"}
                </Link>
              </p>
              {"\n"}
              <ul>
                {"\n"}
                <li>
                  {
                    "定義各作業需要的狀態與可執行操作，確認是否需要審核、何時完成、何時扣庫。"
                  }
                </li>
                {"\n"}
                <li>
                  {
                    "釐清領用與耗用的關係，避免同一筆作業重複扣庫；確認撤銷、更正、退回與歷程保留方式。"
                  }
                </li>
                {"\n"}
                <li>
                  {
                    "確認盤點基準、盤點期間入出庫、差異審核與調整方式，分別標示 HIS／OTC 責任。"
                  }
                </li>
                {"\n"}
                <li>
                  {
                    "產出作業規則與狀態流程。HIS 日常扣庫由 HIS 執行；HIS 盤點如何交由 HIS 調整仍待確認。"
                  }
                </li>
                {"\n"}
                <li>
                  {"Demo 的領用立即扣庫及 HIS 盤點直接調整僅為展示假設。"}
                </li>
                {"\n"}
              </ul>
              {"\n"}
            </details>
            {"\n"}
            <details id={"prep-failures"}>
              {"\n"}
              <summary>{"05 · 異常處理與 API 契約"}</summary>
              {"\n"}
              <p>
                <span className={"status"}>{"待補開發規格"}</span>
                {" · "}
                <Link to={"/#confirmation-failures"}>
                  {"對應主頁需求：待確認"}
                </Link>
              </p>
              {"\n"}
              <ul>
                {"\n"}
                <li>
                  {
                    "列出未知條碼、庫存不足、未登入、權限不足、HIS 逾時／回寫失敗、重複提交及多人修改等情境。"
                  }
                </li>
                {"\n"}
                <li>
                  {
                    "各情境記錄提示內容、資料是否改變、是否可重試，以及使用者下一步；重試不可造成重複入出庫。"
                  }
                </li>
                {"\n"}
                <li>
                  {
                    "API 契約需定義請求與回應欄位、錯誤格式、權限、日期／空值／數量單位，以及重複提交與併發處理。"
                  }
                </li>
                {"\n"}
                <li>
                  {
                    "產出異常情境清單與 API 契約，串起前端提示、後端驗證與資料交易。具體端點及欄位尚未定案。"
                  }
                </li>
                {"\n"}
              </ul>
              {"\n"}
            </details>
            {"\n"}
            <details id={"prep-acceptance"}>
              {"\n"}
              <summary>{"06 · 驗收與追溯"}</summary>
              {"\n"}
              <p>
                <span className={"status"}>{"待補開發規格"}</span>
                {" · "}
                <Link to={"/#confirmation-acceptance"}>
                  {"對應主頁需求：待確認"}
                </Link>
              </p>
              {"\n"}
              <ul>
                {"\n"}
                <li>
                  {
                    "每個驗收案例列出操作前提、測試資料、操作步驟、預期畫面與資料結果。"
                  }
                </li>
                {"\n"}
                <li>
                  {
                    "同時涵蓋成功、無效輸入、權限不足、失敗後資料不變、重複提交及多人異動。"
                  }
                </li>
                {"\n"}
                <li>
                  {
                    "以需求編號對應規劃板的分類／Frame、欄位、作業規則、API 與驗收案例；Frame 編號需連同分類記錄。"
                  }
                </li>
                {"\n"}
                <li>
                  {
                    "定案時記錄確認人、確認日期與版本；需求變更時更新受影響的畫面、契約與驗收案例。"
                  }
                </li>
                {"\n"}
                <li>
                  {
                    "產出客戶驗收案例與需求對照表；Demo 操作成功不代表正式 API、資料庫或院內整合已驗收。"
                  }
                </li>
                {"\n"}
              </ul>
              {"\n"}
            </details>
            {"\n"}
            <details id={"prep-integration"}>
              {"\n"}
              <summary>{"共通準備 · 整合與部署"}</summary>
              {"\n"}
              <p>
                <span className={"status"}>{"待補開發規格"}</span>
                {" · 支援上述六項需求的技術準備"}
              </p>
              {"\n"}
              <ul>
                {"\n"}
                <li>
                  {
                    "取得院內登入方式、HIS 讀寫介面與允許回寫範圍；確認測試環境、帳號及失敗處理能力。"
                  }
                </li>
                {"\n"}
                <li>
                  {
                    "確認 OTC 資料庫、既有資料匯入來源、初始庫存基準與資料核對方式。"
                  }
                </li>
                {"\n"}
                <li>
                  {
                    "確認部署環境、HTTPS、設定與憑證管理、日誌、備份還原及維運責任。"
                  }
                </li>
                {"\n"}
                <li>
                  {
                    "產出整合契約、部署與資料匯入計畫、備份還原驗證方式；沿用集中部署與 React／FastAPI 的已確認方向。"
                  }
                </li>
                {"\n"}
              </ul>
              {"\n"}
              <p>
                <a href={"#section-7"}>{"查看既有待討論決策"}</a>
              </p>
              {"\n"}
            </details>
            {"\n"}
            <h3 id={"receipt-spec-example"}>
              {"OTC 入庫規格整理 · 待確認範例"}
            </h3>
            {"\n"}
            <p>
              {
                "以下只示範整理方式，不預先決定實際欄位、API 端點、請求格式或庫存識別維度。數量 10 是驗收示例，並非正式作業限制。"
              }
            </p>
            {"\n"}
            <TableFrame
              tableKey="document-table-6"
              headers={
                <>
                  <tr>
                    <th scope={"col"}>{"對應項目"}</th>
                    <th scope={"col"}>{"整理方式"}</th>
                  </tr>
                </>
              }
              rows={[
                <tr>
                  <th scope={"row"}>{"01 · 範圍與畫面"}</th>
                  <td>
                    {
                      "對應規劃板「OTC 掃碼入庫」的掃碼、已有品項、未建檔補建及結果畫面；先確認第一版是否包含補建品項。"
                    }
                  </td>
                </tr>,
                <tr>
                  <th scope={"row"}>{"02 · 欄位"}</th>
                  <td>
                    {
                      "先確認品項如何識別、數量與單位如何表達；批號、效期、廠商單號、倉庫或儲位是否必填，由需求決定。"
                    }
                  </td>
                </tr>,
                <tr>
                  <th scope={"row"}>{"03 · 權限"}</th>
                  <td>
                    {
                      "分別確認誰可入庫、誰可補建品項，以及完成後誰可更正或撤銷。"
                    }
                  </td>
                </tr>,
                <tr>
                  <th scope={"row"}>{"04 · 規則"}</th>
                  <td>
                    {
                      "確認何時入帳、是否需審核、庫存及異動紀錄如何一起保存，以及誤入庫如何處理。"
                    }
                  </td>
                </tr>,
                <tr>
                  <th scope={"row"}>{"05 · API 與異常"}</th>
                  <td>
                    {
                      "依前述答案定義請求、回應、權限與錯誤；確認同次提交如何識別、失敗是否可重試及多人異動如何處理。"
                    }
                  </td>
                </tr>,
                <tr>
                  <th scope={"row"}>{"06 · 驗收"}</th>
                  <td>
                    {
                      "待確認案例：對已啟用品項，在已確認的庫存維度與單位下入庫 10；成功後庫存增加 10 並保留一筆異動。同次提交重送不再增加；交易中途失敗時庫存與紀錄皆不改變。審核需求若成立，依已確認的入帳時點調整此案例。"
                    }
                  </td>
                </tr>,
              ]}
              columns={2}
              region={"OTC 入庫待確認範例，可左右捲動"}
            />
            {"\n"}
            <p>
              <Link to={"/board"}>{"查看畫面規劃板"}</Link>
              {" · "}
              <a href={"#section-5"}>{"對照既有 OTC 入庫資料流"}</a>
            </p>
            {"\n"}
          </section>
          <section id={"section-9"}>
            <h2>{"參考資料"}</h2>
            <ul>
              <li>
                <a
                  href={
                    "https://fastapi.tiangolo.com/tutorial/bigger-applications/"
                  }
                >
                  {"FastAPI：Bigger Applications — Multiple Files"}
                </a>
                {"："}
                <code>{"APIRouter"}</code>
                {
                  " 的模組拆分與組合方式；本文件的業務分區及 controller／service／資料存取層分工是庫存管理系統的設計建議。"
                }
              </li>
              <li>
                <a href={"https://react.dev/learn/thinking-in-react"}>
                  {"React：Thinking in React"}
                </a>
                {
                  "：元件拆分及 state 歸屬的基本思路；不代表 React 要求本文件的目錄格式。"
                }
              </li>
            </ul>
          </section>
        </article>
      </div>
    </main>
  );
}
