import { Link } from "react-router";
import React from "react";
import { TableFrame } from "@/components/ui/DataTable";
export function PlanningPage() {
  return (
    <main>
      {"\n      "}
      <div className={"hero"} id={"overview"}>
        {"\n        "}
        <div>
          {"\n          "}
          <div className={"eyebrow"}>{"HIS 與 OTC 庫存系統 · 規劃草稿 05"}</div>
          {"\n          "}
          <h1>
            {"庫存管理系統"}
            <br />
            {"功能與流程規劃"}
          </h1>
          {"\n          "}
          <p className={"intro"}>
            {
              "整合登入、廠商維護、HIS 藥品資料與 OTC 庫存作業。HIS 與 OTC 分開呈現，以目前需求為基礎，逐步釐清作業細節。"
            }
          </p>
          {"\n          "}
          <a className={"button"} href={"#features"}>
            {"查看目前功能需求 ↗"}
          </a>
          {"\n        "}
        </div>
        {"\n        "}
        <aside className={"brief"} aria-label={"規劃概要"}>
          {"\n          "}
          <div className={"eyebrow"}>{"系統概要"}</div>
          <h2>
            {"查詢、維護與盤點"}
            <br />
            {"明確劃分系統責任"}
          </h2>
          {"\n          "}
          <dl>
            {"\n            "}
            <div>
              <dt>{"專案"}</dt>
              <dd>{"庫存管理系統"}</dd>
            </div>
            {"\n            "}
            <div>
              <dt>{"工作區"}</dt>
              <dd>{"HIS 與 OTC 分開呈現"}</dd>
            </div>
            {"\n            "}
            <div>
              <dt>{"HIS 扣庫"}</dt>
              <dd>{"由 HIS 執行"}</dd>
            </div>
            {"\n            "}
            <div>
              <dt>{"盤點範圍"}</dt>
              <dd>{"HIS 與 OTC"}</dd>
            </div>
            {"\n            "}
            <div>
              <dt>{"目前階段"}</dt>
              <dd>{"需求規劃，細節待確認"}</dd>
            </div>
            {"\n          "}
          </dl>
          {"\n        "}
        </aside>
        {"\n      "}
      </div>
      {"\n      "}
      <section id={"workspaces"}>
        {"\n        "}
        <div className={"section-heading"}>
          <span className={"number"}>{"01 / 分工"}</span>
          <h2>{"HIS 與 OTC 的資料與責任"}</h2>
        </div>
        {"\n        "}
        <p className={"section-intro"}>
          {
            "兩個工作區分開呈現各自的來源資料，採一致的介面方向；實際可用功能依各自的作業需求規劃。"
          }
        </p>
        {"\n        "}
        <TableFrame
          tableKey="document-table-1"
          headers={
            <>
              <tr>
                <th scope={"col"}>{"工作區"}</th>
                <th scope={"col"}>{"資料來源"}</th>
                <th scope={"col"}>{"本系統責任"}</th>
                <th scope={"col"}>{"庫存處理"}</th>
              </tr>
            </>
          }
          rows={[
            <tr>
              <th scope={"row"}>{"HIS"}</th>
              <td>{"既有 HIS 資料庫，包含「藥品檔」。"}</td>
              <td>{"即時查詢、藥品檔修改與回寫，以及盤點資訊輸入。"}</td>
              <td>{"扣庫由 HIS 執行；盤點調整如何交由 HIS 執行仍待確認。"}</td>
            </tr>,
            <tr>
              <th scope={"row"}>{"OTC"}</th>
              <td>
                {
                  "內部資料，原規劃透過 localhost 服務存取；儲存與部署方式待確認。"
                }
              </td>
              <td>{"資料維護、入庫、出庫／耗用、領用與盤點。"}</td>
              <td>
                {"規劃支援庫存調整；領用與耗用的扣庫規則、調整流程待確認。"}
              </td>
            </tr>,
          ]}
          columns={4}
          caption={<>{"目前規劃的系統分工"}</>}
          region={"系統分工表，可左右捲動"}
        />
        {"\n        "}
        <p className={"section-intro tw:mt-5"}>
          {
            "OTC 沿用目前名稱，完整名稱與品項範圍尚待確認。HIS 藥品檔回寫與 HIS 扣庫是不同作業，不將扣庫責任移至本系統。"
          }
        </p>
        {"\n      "}
      </section>
      {"\n      "}
      <section id={"features"}>
        {"\n        "}
        <div className={"section-heading"}>
          <span className={"number"}>{"02 / 需求"}</span>
          <h2>{"目前提出的五個功能模組"}</h2>
        </div>
        {"\n        "}
        <p className={"section-intro"}>
          {
            "以下為目前需要的功能，尚未定稿。每個模組的未決細節另列為待確認，不代表已完成實作或已決定第一版交付範圍。"
          }
        </p>
        {"\n        "}
        <div className={"feature-list"}>
          {"\n          "}
          <article className={"topic"}>
            <h3>{"1. SSO 登入"}</h3>
            <ul>
              <li>{"串接 NAS LDAP 登入。"}</li>
            </ul>
            <div className={"prompt"}>
              {
                "待確認：SSO 是同一個庫存管理系統系統內共用登入，還是與其他獨立系統的跨系統登入？另需確認 NAS LDAP 的用途、使用者角色與操作權限。"
              }
            </div>
          </article>
          {"\n          "}
          <article className={"topic"}>
            <h3>{"2. 廠商資料維護設定"}</h3>
            <ul>
              <li>{"以表格呈現廠商列表。"}</li>
              <li>{"支援新增、查詢、修改、刪除（CRUD）。"}</li>
            </ul>
            <div className={"prompt"}>
              {
                "待確認：廠商欄位、資料來源、HIS 與 OTC 是否共用，以及已被使用的廠商能否刪除。"
              }
            </div>
          </article>
          {"\n          "}
          <article className={"topic"}>
            <h3>{"3. HIS 藥品資料查詢與修改"}</h3>
            <ul>
              <li>{"讀取並同步 HIS 資料庫「藥品檔」，即時呈現資料。"}</li>
              <li>{"提供資料修改功能，並將修改內容寫回 HIS 資料庫。"}</li>
              <li>{"扣庫直接由 HIS 執行，本系統負責方便查詢與修改。"}</li>
            </ul>
            <div className={"prompt"}>
              {
                "待確認：可修改欄位、讀寫介面、更新頻率、同步方式、修改紀錄，以及連線失敗或同時修改時的處理方式。"
              }
            </div>
          </article>
          {"\n          "}
          <article className={"topic"}>
            <h3>{"4. OTC 資料維護"}</h3>
            <ul>
              <li>
                <strong>{"入庫（新增）："}</strong>
                {
                  "掃描國際條碼。資料已存在時，輸入入庫資訊後入庫；資料不存在時，跳出提醒，輸入相關資訊新增資料後入庫。"
                }
              </li>
              <li>
                <strong>{"資料編輯："}</strong>
                {"支援現有 OTC 資料的新增、查詢、修改、刪除（CRUD）。"}
              </li>
              <li>
                <strong>{"出庫（耗用）："}</strong>
                {"掃描國際條碼並輸入相關出庫資訊。"}
              </li>
              <li>
                <strong>{"領用："}</strong>
                {"支援領用資料的新增、查詢、修改、刪除（CRUD）。"}
              </li>
            </ul>
            <div className={"prompt"}>
              {
                "待確認：各作業的輸入欄位、未知條碼出庫時的處理、領用與耗用的關係、扣庫時點，以及避免重複扣庫的規則。"
              }
            </div>
          </article>
          {"\n          "}
          <article className={"topic"}>
            <h3>{"5. 庫存盤點"}</h3>
            <ul>
              <li>{"盤點範圍涵蓋 HIS 與 OTC。"}</li>
              <li>{"掃描並輸入盤點資訊。"}</li>
              <li>{"支援盤盈、盤差庫存調整。"}</li>
            </ul>
            <div className={"prompt"}>
              {
                "待確認：HIS 調整如何交由 HIS 執行、OTC 調整流程、差異計算基準，以及是否需要審核。"
              }
            </div>
          </article>
          {"\n        "}
        </div>
        {"\n      "}
      </section>
      {"\n      "}
      <section id={"workflow"}>
        {"\n        "}
        <div className={"section-heading"}>
          <span className={"number"}>{"03 / 流程"}</span>
          <h2>{"目前需求對應的作業流程"}</h2>
        </div>
        {"\n        "}
        <p className={"section-intro"}>
          {"以下整理目前提出的操作順序；審核、扣庫細節與異常處理仍待確認。"}
        </p>
        {"\n        "}
        <h3 className={"workflow-heading"}>{"HIS 藥品資料"}</h3>
        {"\n        "}
        <ol
          className={
            "workflow tw:grid tw:grid-cols-4 tw:gap-[14px] tw:compact:grid-cols-2 tw:phone:grid-cols-1"
          }
        >
          <li>
            <strong>{"讀取藥品檔"}</strong>
            <p>{"從 HIS 資料庫取得資料，供即時查詢。"}</p>
          </li>
          <li>
            <strong>{"查詢與修改"}</strong>
            <p>{"查找藥品，修改允許維護的欄位；欄位範圍待確認。"}</p>
          </li>
          <li>
            <strong>{"回寫 HIS"}</strong>
            <p>{"將修改內容寫回 HIS 資料庫；介面與同步方式待確認。"}</p>
          </li>
          <li>
            <strong>{"由 HIS 扣庫"}</strong>
            <p>{"扣庫維持由 HIS 執行，本系統不另行扣庫。"}</p>
          </li>
        </ol>
        {"\n        "}
        <h3 className={"workflow-heading"}>{"OTC 入庫"}</h3>
        {"\n        "}
        <ol
          className={
            "workflow tw:grid tw:grid-cols-4 tw:gap-[14px] tw:compact:grid-cols-2 tw:phone:grid-cols-1"
          }
        >
          <li>
            <strong>{"掃描國際條碼"}</strong>
            <p>{"辨識本次要入庫的品項。"}</p>
          </li>
          <li>
            <strong>{"判斷資料是否存在"}</strong>
            <p>
              {"已存在：直接輸入入庫資訊。不存在：提醒並輸入相關資訊新增資料。"}
            </p>
          </li>
          <li>
            <strong>{"完成入庫"}</strong>
            <p>{"依輸入資訊辦理入庫；必填欄位待確認。"}</p>
          </li>
          <li>
            <strong>{"後續庫存作業"}</strong>
            <p>
              {
                "出庫／耗用掃碼後輸入資訊；領用資料另提供 CRUD，兩者關係待確認。"
              }
            </p>
          </li>
        </ol>
        {"\n        "}
        <h3 className={"workflow-heading"}>{"HIS 與 OTC 盤點"}</h3>
        {"\n        "}
        <ol
          className={
            "workflow tw:grid tw:grid-cols-4 tw:gap-[14px] tw:compact:grid-cols-2 tw:phone:grid-cols-1"
          }
        >
          <li>
            <strong>{"選擇盤點範圍"}</strong>
            <p>{"分別處理 HIS 或 OTC；倉庫與盤點批次規則待確認。"}</p>
          </li>
          <li>
            <strong>{"掃描並輸入"}</strong>
            <p>{"掃描品項，輸入盤點資訊。"}</p>
          </li>
          <li>
            <strong>{"核對盤盈盤差"}</strong>
            <p>{"核對帳面與實際庫存差異；比較基準待確認。"}</p>
          </li>
          <li>
            <strong>{"庫存調整"}</strong>
            <p>{"HIS 調整交由 HIS 執行的方式、OTC 調整與審核流程待確認。"}</p>
          </li>
        </ol>
        {"\n      "}
      </section>
      {"\n      "}
      <section id={"development-readiness"}>
        {"\n        "}
        <div className={"section-heading"}>
          <span className={"number"}>{"04 / 確認"}</span>
          <h2>{"開發前需確認的事項"}</h2>
        </div>
        {"\n        "}
        <p className={"section-intro"}>
          {
            "先確認作業需求，再整理成可開發、可驗收的規格。以下六項尚未定案；點選產出名稱，可查看架構頁需要準備的內容。"
          }
        </p>
        {"\n        "}
        <TableFrame
          tableKey="document-table-2"
          headers={
            <>
              <tr>
                <th scope={"col"}>{"項目"}</th>
                <th scope={"col"}>{"要確認的重點"}</th>
                <th scope={"col"}>{"確認後產出"}</th>
                <th scope={"col"}>{"目前狀態"}</th>
              </tr>
            </>
          }
          rows={[
            <tr id={"confirmation-scope"}>
              <th scope={"row"}>{"01 · 第一版範圍"}</th>
              <td>
                {"必做、延後、不包含的功能。"}
                <br />
                <a href={"#features"}>{"查看相關需求"}</a>
              </td>
              <td>
                <Link to={"/architecture#prep-scope"}>
                  {"第一版交付清單 ↗"}
                </Link>
              </td>
              <td>
                <span className={"status"}>{"待確認"}</span>
              </td>
            </tr>,
            <tr id={"confirmation-fields"}>
              <th scope={"row"}>{"02 · 欄位與資料來源"}</th>
              <td>
                {"必填、單位、可修改欄位與資料來源。"}
                <br />
                <a href={"#question-barcode"}>{"查看相關需求"}</a>
              </td>
              <td>
                <Link to={"/architecture#prep-fields"}>{"欄位規格表 ↗"}</Link>
              </td>
              <td>
                <span className={"status"}>{"待確認"}</span>
              </td>
            </tr>,
            <tr id={"confirmation-permissions"}>
              <th scope={"row"}>{"03 · 角色與權限"}</th>
              <td>
                {"誰能查詢、維護、撤銷、審核及調整。"}
                <br />
                <a href={"#question-login"}>{"查看相關需求"}</a>
              </td>
              <td>
                <Link to={"/architecture#prep-permissions"}>
                  {"操作權限表 ↗"}
                </Link>
              </td>
              <td>
                <span className={"status"}>{"待確認"}</span>
              </td>
            </tr>,
            <tr id={"confirmation-rules"}>
              <th scope={"row"}>{"04 · 庫存與作業規則"}</th>
              <td>
                {"扣庫時點、領用與耗用關係、盤點基準、退回與更正。"}
                <br />
                <a href={"#question-requisition"}>{"查看相關需求"}</a>
              </td>
              <td>
                <Link to={"/architecture#prep-rules"}>
                  {"作業規則與狀態流程 ↗"}
                </Link>
              </td>
              <td>
                <span className={"status"}>{"待確認"}</span>
              </td>
            </tr>,
            <tr id={"confirmation-failures"}>
              <th scope={"row"}>{"05 · 異常處理"}</th>
              <td>
                {"未知條碼、庫存不足、連線失敗、重複提交與多人修改。"}
                <br />
                <a href={"#question-his"}>{"查看相關需求"}</a>
              </td>
              <td>
                <Link to={"/architecture#prep-failures"}>
                  {"異常情境清單 ↗"}
                </Link>
              </td>
              <td>
                <span className={"status"}>{"待確認"}</span>
              </td>
            </tr>,
            <tr id={"confirmation-acceptance"}>
              <th scope={"row"}>{"06 · 驗收條件"}</th>
              <td>
                {"操作前提、操作步驟與預期結果。"}
                <br />
                <a href={"#workflow"}>{"查看相關需求"}</a>
              </td>
              <td>
                <Link to={"/architecture#prep-acceptance"}>
                  {"客戶驗收案例 ↗"}
                </Link>
              </td>
              <td>
                <span className={"status"}>{"待確認"}</span>
              </td>
            </tr>,
          ]}
          columns={4}
          caption={<>{"客戶需求確認摘要 · 確認狀態由文件維護"}</>}
          region={"開發前確認清單，可左右捲動"}
        />
        {"\n        "}
        <p className={"section-intro"}>
          {
            "優先釐清領用與耗用的扣庫關係、盤點調整責任，以及批號／效期／倉庫與單位換算是否納入第一版。Demo 中的展示假設需另行確認，不能直接視為正式規格。"
          }
        </p>
        {"\n        "}
        <p>
          <Link to={"/architecture#preparation"}>
            {"查看開發規格準備清單 ↗"}
          </Link>
          {" · "}
          <Link to={"/architecture#receipt-spec-example"}>
            {"查看 OTC 入庫的待確認範例 ↗"}
          </Link>
        </p>
        {"\n      "}
      </section>
      {"\n      "}
      <section id={"discussion"}>
        {"\n        "}
        <div className={"section-heading"}>
          <span className={"number"}>{"05 / 討論"}</span>
          <h2>{"待確認問題與可能缺漏"}</h2>
        </div>
        {"\n        "}
        <p className={"section-intro"}>
          {"以下問題用於後續需求訪談；尚未回答的項目不視為確定功能或技術決策。"}
        </p>
        {"\n        "}
        <details open={true} id={"question-login"}>
          <summary>{"SSO 是同一個系統內共用登入，還是跨不同系統？"}</summary>
          <p>
            {"跨系統登入的建議做法已整理在 "}
            <Link to={"/architecture#oidc-login"}>
              {"架構文件：OIDC 登入流程"}
            </Link>
            {"；適用前提為院內服務支援 OIDC，實際協定仍待確認。"}
          </p>
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
          <p>
            {
              "另需確認使用者角色：誰能維護廠商、修改 HIS 藥品檔、操作 OTC 庫存或執行盤點調整？"
            }
          </p>
        </details>
        {"\n        "}
        <details id={"question-activation"}>
          <summary>{"LDAP 群組如何對應操作與料號啟用權限？"}</summary>
          <p>
            {
              "已確認此處 LDAP 指 NAS 的權限管理。需與使用者確認群組對應角色、哪些欄位可修改、誰可啟用／停用料號，以及各庫存作業限制。忘記密碼需確認院內重設服務或管理員處理方式。"
            }
          </p>
          <p>
            <Link to={"/architecture#activation-policy"}>
              {"查看 LDAP 權限與忘記密碼規格"}
            </Link>
          </p>
        </details>
        {"\n        "}
        <details id={"question-suppliers"}>
          <summary>{"廠商資料由哪裡維護，兩個工作區是否共用？"}</summary>
          <p>
            {
              "廠商需要哪些欄位？既有資料來源為何？HIS 與 OTC 是否共用廠商？已有入庫或其他紀錄的廠商，刪除與停用應如何處理？"
            }
          </p>
        </details>
        {"\n        "}
        <details id={"question-his"}>
          <summary>{"HIS 藥品檔如何即時讀取與回寫？"}</summary>
          <p>
            {
              "允許修改哪些欄位？使用何種讀寫介面？「即時」需要多快更新？是否保留本地副本？需記錄哪些修改資訊？來源無法連線、回寫失敗或多人同時修改時，如何處理？扣庫責任已明確由 HIS 承擔。"
            }
          </p>
        </details>
        {"\n        "}
        <details id={"question-requisition"}>
          <summary>{"OTC 領用與出庫／耗用有什麼關係？"}</summary>
          <p>
            {
              "領用是申請、實際領取，還是另一種出庫用途？在哪個步驟扣庫？如何避免領用與耗用重複扣庫？修改、刪除或取消紀錄是否需回復庫存？"
            }
          </p>
        </details>
        {"\n        "}
        <details id={"question-barcode"}>
          <summary>{"條碼作業需要哪些資訊與設備？"}</summary>
          <p>
            {
              "國際條碼使用哪種格式與掃描設備？同一品項不同包裝是否使用不同條碼？入庫與出庫需要哪些欄位？未知條碼出庫、重複掃描及庫存不足時如何處理？"
            }
          </p>
        </details>
        {"\n        "}
        <details id={"question-stocktake"}>
          <summary>{"HIS 與 OTC 的盤點差異如何調整？"}</summary>
          <p>
            {
              "以哪個時間點的帳面庫存作為基準？盤點期間是否仍可入出庫？HIS 盤點調整如何交由 HIS 執行？OTC 如何調整？是否需要審核、調整原因與操作紀錄？"
            }
          </p>
        </details>
        {"\n        "}
        <TableFrame
          tableKey="document-table-3"
          className="tw:mt-[30px]"
          headers={
            <>
              <tr>
                <th scope={"col"}>{"項目"}</th>
                <th scope={"col"}>{"需要釐清的內容"}</th>
                <th scope={"col"}>{"狀態"}</th>
              </tr>
            </>
          }
          rows={[
            <tr>
              <th scope={"row"}>{"批號與效期"}</th>
              <td>
                {"哪些品項需追蹤批號、效期？是否需要效期提醒與批次選擇規則？"}
              </td>
              <td>
                <span className={"status"}>{"待確認"}</span>
              </td>
            </tr>,
            <tr>
              <th scope={"row"}>{"單位換算"}</th>
              <td>
                {"採購、入庫、領用與耗用單位是否不同？包裝與基本單位如何換算？"}
              </td>
              <td>
                <span className={"status"}>{"待確認"}</span>
              </td>
            </tr>,
            <tr>
              <th scope={"row"}>{"倉庫與儲位"}</th>
              <td>
                {"是否有多院區、多倉庫、部門庫存或儲位？是否需要庫存移轉？"}
              </td>
              <td>
                <span className={"status"}>{"待確認"}</span>
              </td>
            </tr>,
            <tr>
              <th scope={"row"}>{"退貨與退回"}</th>
              <td>
                {"是否需要廠商退貨、領用退回或耗用取消？庫存與紀錄如何回復？"}
              </td>
              <td>
                <span className={"status"}>{"待確認"}</span>
              </td>
            </tr>,
            <tr>
              <th scope={"row"}>{"報表與操作紀錄"}</th>
              <td>
                {"需要哪些庫存、效期、異動與盤點報表？哪些操作需保留歷程？"}
              </td>
              <td>
                <span className={"status"}>{"待確認"}</span>
              </td>
            </tr>,
            <tr>
              <th scope={"row"}>{"採購與成本"}</th>
              <td>{"是否包含採購單、成本計算或會計銜接？第一版是否需要？"}</td>
              <td>
                <span className={"status"}>{"待確認"}</span>
              </td>
            </tr>,
            <tr>
              <th scope={"row"}>{"部署與既有資料"}</th>
              <td>
                {
                  "OTC 服務如何部署？是否多人共用？既有資料是否需匯入？是否有特殊藥品或儲存條件？"
                }
              </td>
              <td>
                <span className={"status"}>{"待確認"}</span>
              </td>
            </tr>,
          ]}
          columns={3}
          caption={<>{"保留的補充討論項目，尚未列為確定需求"}</>}
          region={"補充討論項目表，可左右捲動"}
        />
        {"\n        "}
        <div className={"next"}>
          <div className={"eyebrow"}>{"下一步需求討論"}</div>
          <h3 className="tw:mt-[10px]">{"先釐清資料欄位與庫存異動規則"}</h3>
          <p>
            {
              "從 HIS 可修改欄位、OTC 領用與耗用的關係，以及兩邊的盤點調整流程開始，逐步補齊需求並決定第一版範圍。"
            }
          </p>
          <p>
            {
              "本頁為靜態規劃草稿，功能清單不代表已實作；目前不提供登入、資料庫連線、實際庫存操作或回答保存功能。"
            }
          </p>
        </div>
        {"\n      "}
      </section>
      {"\n    "}
    </main>
  );
}
