import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { ClipboardCheck, Plus, Search, Clock3, X } from "lucide-react";
import { BaseTabs } from "@/components/ui/BaseTabs";
import { BaseBadge } from "@/components/ui/BaseBadge";
import { BaseButton } from "@/components/ui/BaseButton";
import { BaseField as Field } from "@/components/ui/BaseForm";
import { BaseInput } from "@/components/ui/BaseInput";
import {
  BaseNativeSelect as Select,
  BaseNativeSelectOption as Option,
} from "@/components/ui/BaseNativeSelect";
import { BaseDataTable } from "@/components/ui/BaseDataTable";
import { BaseWorkspaceModal } from "@/components/ui/BaseWorkspaceModal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setStocktakePersona } from "@/store/stocktakes";
import { setModuleDirty } from "@/store/moduleUi";
import { useWorkspaceDirty } from "@/features/workspace/useWorkspaceDirty";
import { relativeDate, taipeiToday } from "@/features/items/model";
import {
  countFor,
  stocktakePeople,
  stocktakeListContent,
  sortStocktakeOrders,
  stocktakeStatuses,
  stocktakeReviewBlockers,
  supervisor,
} from "@/features/stocktakes/model";
import { NewStocktakeForm } from "@/features/stocktakes/NewStocktakeForm";
import { StocktakeCountPanel } from "@/features/stocktakes/StocktakeCountPanel";
import { StocktakeReviewPanel } from "@/features/stocktakes/StocktakeReviewPanel";
import {
  StocktakeOperationForm,
  type StocktakeOperation,
} from "@/features/stocktakes/StocktakeOperationForm";
import "@/features/items/items.css";
import "@/features/purchases/purchases.css";
import "@/features/stocktakes/stocktakes.css";
type Dialog = {
  kind: StocktakeOperation | "new" | "records";
  itemId?: string;
  recordId?: string;
};
const labels: Record<Dialog["kind"], string> = {
  new: "新增盤點單",
  records: "品項輸入歷史",
  close: "結束初盤前檢查",
  cancel: "作廢盤點單",
  invalidate: "標記輸入無效",
  recount: "發起盲盤複盤",
  round: "比較並選擇盤點結果",
  "confirm-item": "確認品項與批次差異",
  approve: "確認盤點結果",
};
const emptyFilters = () => ({
  search: "",
  from: relativeDate(-30),
  to: taipeiToday(),
  warehouse: "",
  status: "",
  creator: "",
  type: "",
});
export function StocktakesPage() {
  const state = useAppSelector((root) => root.stocktakes),
    dispatch = useAppDispatch(),
    navigate = useNavigate(),
    location = useLocation(),
    params = useParams();
  const manager = state.persona === supervisor,
    order = state.orders.find((row) => row.id === params.id),
    accessible = Boolean(order);
  const [filters, setFilters] = useState(emptyFilters),
    [view, setView] = useState<Dialog | null>(null),
    [modalDirty, setModalDirty] = useState(false),
    [countDirty, setCountDirty] = useState(false),
    [discard, setDiscard] = useState(false),
    [notice, setNotice] = useState("");
  useWorkspaceDirty(modalDirty || countDirty);
  function close(force = false) {
    if (modalDirty && !force) {
      setDiscard(true);
      return;
    }
    setView(null);
    setModalDirty(false);
    setDiscard(false);
    dispatch(setModuleDirty(countDirty));
  }
  const invalidDates =
    !filters.from || !filters.to || filters.from > filters.to;
  const visible = state.orders;
  const filtered = visible.filter(
    (row) =>
      !invalidDates &&
      row.date >= filters.from &&
      row.date <= filters.to &&
      (!filters.warehouse || row.warehouse === filters.warehouse) &&
      (!filters.type || row.type === filters.type) &&
      (!filters.creator || row.createdBy === filters.creator) &&
      [row.number, row.name, row.remark]
        .join(" ")
        .toLowerCase()
        .includes(filters.search.trim().toLowerCase()),
  );
  const list = sortStocktakeOrders(
    filtered.filter((row) => !filters.status || row.status === filters.status),
  );
  const reviewed = Boolean(
    order &&
    manager &&
    order.status !== "盤點中" &&
    order.closedAt &&
    location.pathname.endsWith("/review"),
  );
  const reviewBlockers = order ? stocktakeReviewBlockers(order) : [];
  return (
    <div className="items-page stocktakes-page">
      <header className="items-heading">
        <div className="items-title">
          <ClipboardCheck aria-hidden="true" />
          <div>
            <h2>
              {params.id
                ? reviewed
                  ? "盤點差異核對"
                  : "盤點作業（盲盤）"
                : "盤點管理"}
            </h2>
            <p>
              {params.id && accessible
                ? `${order.number} ／ ${order.warehouse} ／ ${order.status}`
                : "管理盤點單據、分區清點與盤點差異核對"}
            </p>
          </div>
        </div>
        <div className="items-heading-tools">
          {!params.id && (
            <div className="items-search">
              <Search size={17} aria-hidden="true" />
              <BaseInput
                aria-label="搜尋盤點單"
                value={filters.search}
                placeholder="搜尋單號、名稱、備註…"
                onChange={(event) =>
                  setFilters({ ...filters, search: event.target.value })
                }
              />
            </div>
          )}
          {params.id && (
            <Field name="stocktake-persona" label="預覽角色">
              <Select
                value={state.persona}
                disabled={modalDirty || countDirty}
                onChange={(event) => {
                  dispatch(setStocktakePersona(event.target.value));
                  setView(null);
                  setNotice("");
                }}
              >
                {[supervisor, ...stocktakePeople].map((person) => (
                  <Option key={person}>{person}</Option>
                ))}
              </Select>
            </Field>
          )}
          {params.id ? (
            <BaseButton
              variant="outline"
              onClick={() => navigate("/stocktakes")}
            >
              返回盤點列表
            </BaseButton>
          ) : (
            manager && (
              <BaseButton onClick={() => setView({ kind: "new" })}>
                <Plus size={17} aria-hidden="true" />
                新增盤點單
              </BaseButton>
            )
          )}
        </div>
      </header>
      {notice && (
        <p role="status" aria-live="polite">
          {notice}
        </p>
      )}
      {!params.id ? (
        <>
          <div className="stocktake-preview-toolbar">
            <span>介面預覽</span>
            <Field name="stocktake-persona" label="預覽角色">
              <Select
                value={state.persona}
                onChange={(event) => {
                  dispatch(setStocktakePersona(event.target.value));
                  setView(null);
                  setNotice("");
                }}
              >
                {[supervisor, ...stocktakePeople].map((person) => (
                  <Option key={person}>{person}</Option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="purchase-summary" aria-label="盤點狀態摘要">
            <span>
              盤點單 <strong>{filtered.length}</strong> 筆
            </span>
            <span className="purchase-summary-pending">
              <Clock3 size={15} aria-hidden="true" />
              盤點中 {
                filtered.filter((row) => row.status === "盤點中").length
              }{" "}
              筆 ／ 待核對{" "}
              {filtered.filter((row) => row.status === "待核對").length} 筆
            </span>
          </div>
          <BaseTabs
            id="stocktakes-status"
            label="盤點狀態"
            value={filters.status}
            onChange={(status) => setFilters({ ...filters, status })}
            options={[
              { value: "", label: `全部（${filtered.length}）` },
              ...stocktakeStatuses.map((status) => ({
                value: status,
                label: `${status}（${filtered.filter((row) => row.status === status).length}）`,
              })),
            ]}
          />
          <div
            id="stocktakes-status-panel"
            role="tabpanel"
            aria-labelledby={`stocktakes-status-${filters.status}`}
            tabIndex={0}
          >
            <div className="items-filter-bar purchase-filters stocktake-list-filters">
              <Field name="stocktakes-from" label="盤點日期起">
                <BaseInput
                  type="date"
                  value={filters.from}
                  onChange={(event) =>
                    setFilters({ ...filters, from: event.target.value })
                  }
                />
              </Field>
              <Field name="stocktakes-to" label="盤點日期迄">
                <BaseInput
                  type="date"
                  value={filters.to}
                  onChange={(event) =>
                    setFilters({ ...filters, to: event.target.value })
                  }
                />
              </Field>
              {(
                [
                  [
                    "warehouse",
                    "倉別",
                    [...new Set(visible.map((row) => row.warehouse))],
                  ],
                  ["type", "盤點類型", ["全盤", "部分盤點"]],
                  [
                    "creator",
                    "建立人員",
                    [...new Set(visible.map((row) => row.createdBy))],
                  ],
                ] as const
              ).map(([key, label, values]) => (
                <Field key={key} name={`stocktakes-${key}`} label={label}>
                  <Select
                    value={filters[key]}
                    onChange={(event) =>
                      setFilters({ ...filters, [key]: event.target.value })
                    }
                  >
                    <Option value="">全部</Option>
                    {values.map((value) => (
                      <Option key={value}>{value}</Option>
                    ))}
                  </Select>
                </Field>
              ))}
              <BaseButton
                variant="outline"
                onClick={() => setFilters(emptyFilters())}
              >
                <X size={15} aria-hidden="true" />
                清除
              </BaseButton>
            </div>
            {invalidDates && (
              <p role="alert" className="items-error">
                請填寫有效日期區間；開始日期不可晚於結束日期。
              </p>
            )}
            <div className="stocktake-list-caption">
              <span>
                目前顯示 {list.length} 筆
                {filters.status ? `・${filters.status}` : "・全部狀態"}
              </span>
              <span>待核對、盤點中優先，同狀態依盤點日期由新到舊</span>
            </div>
            <div className="purchase-list-card stocktake-list-card">
              <BaseDataTable
                tableKey={`stocktakes-list-${state.persona}-${JSON.stringify(filters)}`}
                exportable={manager}
                headers={[
                  "盤點單",
                  "盤點日期",
                  "倉別／類型",
                  manager ? "處理進度" : "我的進度",
                  "狀態",
                  "下一步",
                  "建立資訊",
                  "操作",
                ]}
                rows={list.map((row) => {
                  const content = stocktakeListContent(row, state.persona);
                  return [
                    <div className="stocktake-cell-stack">
                      <strong>{row.number}</strong>
                      {"\n"}
                      <span>{row.name}</span>
                    </div>,
                    row.date,
                    <div className="stocktake-cell-stack">
                      <span>{row.warehouse}</span>
                      {"\n"}
                      <small>
                        {row.type}・{row.scope.length} 項
                      </small>
                    </div>,
                    <div className="stocktake-cell-stack">
                      <span>{content.progress}</span>
                      {"\n"}
                      <small>{content.detail}</small>
                    </div>,
                    <BaseBadge
                      variant={
                        row.status === "待核對"
                          ? "warning"
                          : row.status === "已作廢"
                            ? "muted"
                            : row.status === "已完成"
                              ? "secondary"
                              : "outline"
                      }
                    >
                      {row.status}
                    </BaseBadge>,
                    <span className="stocktake-next-step">{content.next}</span>,
                    <div className="stocktake-cell-stack">
                      <span>{row.createdBy}</span>
                      {"\n"}
                      <small>{row.createdAt}</small>
                    </div>,
                    <BaseButton
                      variant="outline"
                      aria-label={`開啟盤點 ${row.number}`}
                      onClick={() =>
                        navigate(
                          `/stocktakes/${row.id}/${manager && row.status !== "盤點中" && row.closedAt ? "review" : "count"}`,
                        )
                      }
                    >
                      {content.action}
                    </BaseButton>,
                  ];
                })}
              />
            </div>
          </div>
        </>
      ) : !accessible ? (
        <section className="stocktake-card">
          <h3>無法查看此盤點單</h3>
          <p>找不到此盤點單，請返回列表。</p>
        </section>
      ) : (
        <>
          <section className="stocktake-card stocktake-order-summary">
            <h3>{order.name}</h3>
            <p>
              盤點日 {order.date} ／ {order.type} ／ 範圍 {order.scope.length}{" "}
              項。
            </p>
            {order.remark && <p>盤點備註：{order.remark}</p>}
            {order.status === "已作廢" && <p>作廢原因：{order.cancelReason}</p>}
            {manager && (
              <div className="stocktake-actions">
                {order.status === "盤點中" && (
                  <BaseButton
                    disabled={countDirty}
                    onClick={() => setView({ kind: "close" })}
                  >
                    結束初盤，送交核對
                  </BaseButton>
                )}
                {order.status === "待核對" && (
                  <>
                    {!reviewed && (
                      <BaseButton
                        variant="outline"
                        onClick={() =>
                          navigate(`/stocktakes/${order.id}/review`)
                        }
                      >
                        主管差異核對
                      </BaseButton>
                    )}
                    <BaseButton
                      disabled={countDirty || reviewBlockers.length > 0}
                      aria-describedby={
                        reviewBlockers.length
                          ? "stocktake-review-blockers"
                          : undefined
                      }
                      onClick={() => setView({ kind: "approve" })}
                    >
                      確認盤點結果
                    </BaseButton>
                  </>
                )}
                {["盤點中", "待核對"].includes(order.status) && (
                  <BaseButton
                    variant="outline"
                    disabled={countDirty}
                    onClick={() => setView({ kind: "cancel" })}
                  >
                    作廢盤點單
                  </BaseButton>
                )}
              </div>
            )}
            {manager && order.status === "待核對" && (
              <div
                id="stocktake-review-blockers"
                className="stocktake-completion-status"
                role="status"
              >
                {reviewBlockers.length ? (
                  <>
                    <strong>完成盤點前，請先處理：</strong>
                    <ul>
                      {reviewBlockers.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p>所有品項已核對完成，可以確認盤點結果。</p>
                )}
              </div>
            )}
          </section>
          {!reviewed && (
            <section className="stocktake-card" aria-label="盤點流程與進度">
              {order.status !== "已作廢" && (
                <ol className="stocktake-steps">
                  {["盤點中", "待核對", "已完成"].map((step, index) => (
                    <li
                      key={step}
                      aria-current={order.status === step ? "step" : undefined}
                    >
                      <strong>
                        {index + 1}. {step}
                      </strong>
                      <small>
                        {
                          [
                            "盤點人員清點品項",
                            "主管核對與安排複盤",
                            "主管確認，結果唯讀",
                          ][index]
                        }
                      </small>
                    </li>
                  ))}
                </ol>
              )}
              <p>
                {order.status === "盤點中"
                  ? "下一步：全部品項登錄後，由主管結束初盤。"
                  : order.status === "待核對"
                    ? "下一步：主管核對所有品項；有疑慮時發起複盤，再確認結果。"
                    : order.status === "已完成"
                      ? "盤點已完成，可查閱明細及匯出結果。"
                      : "此單已作廢，保留紀錄供查閱。"}
              </p>
              <p>
                {manager ? "已盤" : "本人已盤"}{" "}
                {
                  order.scope.filter(
                    (scope) =>
                      countFor(
                        order,
                        scope.itemId,
                        1,
                        manager ? undefined : state.persona,
                      ).counted,
                  ).length
                }
                ／{order.scope.length} 項；{manager ? "未盤" : "本人未盤"}{" "}
                {
                  order.scope.filter(
                    (scope) =>
                      !countFor(
                        order,
                        scope.itemId,
                        1,
                        manager ? undefined : state.persona,
                      ).counted,
                  ).length
                }{" "}
                項；待提交複盤{" "}
                {
                  order.recounts.filter(
                    (row) =>
                      row.status === "待複盤" &&
                      (manager || !row.person || row.person === state.persona),
                  ).length
                }{" "}
                項
              </p>
            </section>
          )}
          {reviewed ? (
            <StocktakeReviewPanel
              key={`${order.id}-${order.status}`}
              order={order}
              onAction={(kind, itemId) => setView({ kind, itemId })}
            />
          ) : (
            <StocktakeCountPanel
              key={`${order.id}-${state.persona}`}
              order={order}
              person={state.persona}
              onDirty={setCountDirty}
              onInvalidate={(recordId) =>
                setView({ kind: "invalidate", recordId })
              }
            />
          )}
        </>
      )}
      <p className="stocktake-note">介面展示，資料重新整理後重置。</p>
      <details className="stocktake-note">
        <summary>展示說明與待確認規則</summary>
        <p>
          切換預覽角色可查看主管與員工畫面。盤點結果僅供展示，不修改正式庫存。
        </p>
        <p>
          待確認：盤點期間是否允許入出庫、如何核對期間異動，以及盤點差異是否產生庫存調整單。
        </p>
      </details>
      <BaseWorkspaceModal
        open={Boolean(view)}
        title={view ? labels[view.kind] : "盤點作業"}
        description={
          view?.kind === "new"
            ? "設定盤點資料與品項範圍，建立後即可開始輸入。"
            : "依盤點狀態與展示角色處理，原始輸入與快照保留。"
        }
        onClose={() => close()}
      >
        {discard && (
          <div className="items-modal-scroll">
            <h3>尚有未儲存變更</h3>
            <p>確定放棄目前修改？</p>
            <div className="stocktake-actions">
              <BaseButton
                autoFocus
                variant="outline"
                onClick={() => setDiscard(false)}
              >
                繼續編輯
              </BaseButton>
              <BaseButton onClick={() => close(true)}>放棄變更</BaseButton>
            </div>
          </div>
        )}
        <div className="stocktake-modal-slot" hidden={discard}>
          {view?.kind === "new" && manager && (
            <NewStocktakeForm
              onCancel={() => close()}
              onDirty={() => setModalDirty(true)}
              onDone={(id) => {
                close(true);
                setNotice("盤點單已建立，範圍快照已鎖定。");
                navigate(`/stocktakes/${id}/count`);
              }}
            />
          )}
          {view &&
            view.kind !== "new" &&
            view.kind !== "records" &&
            accessible &&
            manager && (
              <StocktakeOperationForm
                key={`${view.kind}-${view.itemId || ""}-${view.recordId || ""}`}
                order={order}
                operation={view.kind}
                itemId={view.itemId}
                recordId={view.recordId}
                onCancel={() => close()}
                onDirty={() => setModalDirty(true)}
                onDone={() => {
                  const kind = view.kind;
                  close(true);
                  setNotice("操作已完成，原始紀錄與操作歷程已保留。");
                  if (kind === "close")
                    navigate(`/stocktakes/${order.id}/review`);
                  else if (kind === "cancel") navigate("/stocktakes");
                }}
              />
            )}
          {view?.kind === "records" && manager && order && (
            <>
              <div className="items-modal-scroll">
                <h3>
                  {
                    order.scope.find((scope) => scope.itemId === view.itemId)
                      ?.name
                  }
                </h3>
                {order.records
                  .filter((record) => record.itemId === view.itemId)
                  .map((record) => (
                    <article className="stocktake-record" key={record.id}>
                      <p>
                        {record.id} ／ {record.person} ／ 第 {record.round} 輪
                        ／ {record.quantity} ／ {record.area || "未註記區域"}
                      </p>
                      <p>
                        {record.time} ／{" "}
                        {record.valid
                          ? "有效"
                          : `無效：${record.invalidReason}，${record.invalidatedBy} ${record.invalidatedAt}`}
                      </p>
                      {record.valid &&
                        ["盤點中", "待核對"].includes(order.status) && (
                          <BaseButton
                            variant="outline"
                            onClick={() =>
                              setView({
                                kind: "invalidate",
                                recordId: record.id,
                              })
                            }
                          >
                            標記無效 {record.id}
                          </BaseButton>
                        )}
                    </article>
                  ))}
              </div>
              <footer className="items-modal-footer">
                <BaseButton variant="outline" onClick={() => close()}>
                  關閉
                </BaseButton>
              </footer>
            </>
          )}
        </div>
      </BaseWorkspaceModal>
    </div>
  );
}
