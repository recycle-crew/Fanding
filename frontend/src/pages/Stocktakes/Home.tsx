import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { ClipboardCheck, Plus } from "lucide-react";
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
  canSeeOrder,
  countFor,
  stocktakePeople,
  stocktakeStatuses,
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
  close: "關閉盤點前檢查",
  cancel: "作廢盤點單",
  invalidate: "標記輸入無效",
  recount: "指派盲盤複盤",
  round: "選擇最終盤點輪次",
  "confirm-item": "確認品項與批次差異",
  approve: "確認盤點展示調整",
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
    accessible = order && canSeeOrder(order, state.persona);
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
  const visible = state.orders.filter((row) => canSeeOrder(row, state.persona));
  const list = visible.filter(
    (row) =>
      !invalidDates &&
      row.date >= filters.from &&
      row.date <= filters.to &&
      (!filters.warehouse || row.warehouse === filters.warehouse) &&
      (!filters.status || row.status === filters.status) &&
      (!filters.type || row.type === filters.type) &&
      (!filters.creator || row.createdBy === filters.creator) &&
      [row.number, row.name, row.remark]
        .join(" ")
        .toLowerCase()
        .includes(filters.search.trim().toLowerCase()),
  );
  const reviewed = Boolean(
    order &&
    manager &&
    order.status !== "盤點中" &&
    order.closedAt &&
    location.pathname.endsWith("/review"),
  );
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
                : "建立盤點、分區登錄與主管核對的展示流程"}
            </p>
          </div>
        </div>
        <div className="stocktake-actions">
          <Field name="stocktake-persona" label="展示身分">
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
                <Plus aria-hidden="true" />
                新增盤點單
              </BaseButton>
            )
          )}
        </div>
      </header>
      <p role="status" aria-live="polite">
        {notice}
      </p>
      {!params.id ? (
        <>
          <div className="stocktake-stats" aria-label="盤點狀態摘要">
            {stocktakeStatuses.map((status) => (
              <div className="stocktake-card" key={status}>
                <span>{status}</span>
                <strong>
                  {list.filter((row) => row.status === status).length}
                </strong>
                <small>
                  共{" "}
                  {list
                    .filter((row) => row.status === status)
                    .reduce((sum, row) => sum + row.scope.length, 0)}{" "}
                  項
                </small>
              </div>
            ))}
          </div>
          <div className="stocktake-card stocktake-filters">
            <Field name="stocktakes-search" label="搜尋盤點單">
              <BaseInput
                value={filters.search}
                placeholder="單號、名稱或備註"
                onChange={(event) =>
                  setFilters({ ...filters, search: event.target.value })
                }
              />
            </Field>
            <Field name="stocktakes-from" label="開始日期">
              <BaseInput
                type="date"
                value={filters.from}
                onChange={(event) =>
                  setFilters({ ...filters, from: event.target.value })
                }
              />
            </Field>
            <Field name="stocktakes-to" label="結束日期">
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
                ["status", "盤點狀態", stocktakeStatuses],
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
              清除
            </BaseButton>
          </div>
          {invalidDates && (
            <p role="alert" className="items-error">
              請填寫有效日期區間；開始日期不可晚於結束日期。
            </p>
          )}
          <BaseDataTable
            tableKey={`stocktakes-list-${state.persona}`}
            exportable={manager}
            headers={[
              "盤點單號",
              "盤點名稱",
              "盤點日期",
              "倉別",
              "類型",
              "品項數",
              manager ? "已盤品項" : "我已盤品項",
              "盤點人員",
              "狀態",
              "建立人員",
              "建立時間",
              "完成時間",
              "操作",
            ]}
            rows={list.map((row) => [
              row.number,
              row.name,
              row.date,
              row.warehouse,
              row.type,
              row.scope.length,
              row.scope.filter(
                (scope) =>
                  countFor(
                    row,
                    scope.itemId,
                    1,
                    manager ? undefined : state.persona,
                  ).counted,
              ).length,
              row.people.join("、"),
              row.status,
              row.createdBy,
              row.createdAt,
              row.completedAt || "—",
              <BaseButton
                variant="outline"
                aria-label={`開啟盤點 ${row.number}`}
                onClick={() =>
                  navigate(
                    `/stocktakes/${row.id}/${manager && row.status !== "盤點中" && row.closedAt ? "review" : "count"}`,
                  )
                }
              >
                {row.status === "盤點中"
                  ? "進入盤點"
                  : manager && row.closedAt
                    ? "查看／核對"
                    : "我的紀錄"}
              </BaseButton>,
            ])}
          />
        </>
      ) : !accessible ? (
        <section className="stocktake-card">
          <h3>無法查看此盤點單</h3>
          <p>員工僅可查看被指派的盤點或複盤；可切換展示身分或返回列表。</p>
        </section>
      ) : (
        <>
          <section className="stocktake-card stocktake-order-summary">
            <h3>{order.name}</h3>
            <p>
              盤點日 {order.date} ／ {order.type} ／ 範圍 {order.scope.length}{" "}
              項，建立後鎖定。
            </p>
            <p>分工備註：{order.remark || "—"}</p>
            {order.status === "已作廢" && <p>作廢原因：{order.cancelReason}</p>}
            {manager && (
              <div className="stocktake-actions">
                {order.status === "盤點中" && (
                  <BaseButton
                    disabled={countDirty}
                    onClick={() => setView({ kind: "close" })}
                  >
                    關閉盤點
                  </BaseButton>
                )}
                {order.status === "待核對" && (
                  <>
                    <BaseButton
                      variant="outline"
                      onClick={() => navigate(`/stocktakes/${order.id}/review`)}
                    >
                      主管差異核對
                    </BaseButton>
                    <BaseButton
                      disabled={countDirty}
                      onClick={() => setView({ kind: "approve" })}
                    >
                      確認展示調整
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
          </section>
          {reviewed ? (
            <StocktakeReviewPanel
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
      <p className="stocktake-note">
        展示模式：身分切換僅模擬角色，未串接正式權限或多使用者服務。盤點輸入不改庫存；確認後僅建立本模組展示調整紀錄，不更新模組一。原始紀錄保留，重新整理即重置。
      </p>
      <BaseWorkspaceModal
        open={Boolean(view)}
        title={view ? labels[view.kind] : "盤點作業"}
        description="依盤點狀態與展示角色處理，原始輸入與快照保留。"
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
                  setNotice("盤點展示操作已完成，原始紀錄與稽核保留。");
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
