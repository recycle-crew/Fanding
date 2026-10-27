import { useState } from "react";
import { BaseField } from "@/components/ui/BaseForm";
import {
  BaseNativeSelect,
  BaseNativeSelectOption,
} from "@/components/ui/BaseNativeSelect";
import { BaseButton } from "@/components/ui/BaseButton";
import { BaseInput } from "@/components/ui/BaseInput";
import { BaseDataTable } from "@/components/ui/BaseDataTable";
import {
  countFor,
  expectedFor,
  varianceFor,
  sortStocktakeReviewScope,
  stocktakeRoundLabel,
} from "./model";
import type { Stocktake, StocktakeScope } from "@/types/stocktakes";

type ReviewAction = "records" | "confirm-item" | "recount" | "round";
type ReviewFilter =
  | "all"
  | "variance"
  | "uncounted"
  | "unconfirmed"
  | "gain"
  | "loss"
  | "pending-recount"
  | "adopt";

function reviewState(order: Stocktake, scope: StocktakeScope) {
  const difference = varianceFor(order, scope);
  const recounts = order.recounts.filter((row) => row.itemId === scope.itemId);
  const pending = recounts.some((row) => row.status === "待複盤");
  const submitted = recounts.some((row) => row.status === "已提交");
  const confirmed = order.confirmedItems.includes(scope.itemId);
  const locked = order.status === "已完成" || order.status === "已作廢";
  const status = confirmed
    ? "已確認"
    : pending
      ? "待複盤"
      : submitted
        ? "待選定結果"
        : difference === null
          ? "未盤點"
          : "待核對";
  const tone =
    difference === null
      ? "pending"
      : difference > 0
        ? "gain"
        : difference < 0
          ? "loss"
          : "match";
  const differenceText =
    difference === null
      ? "尚未盤點"
      : `${difference > 0 ? "+" : ""}${difference} ${difference > 0 ? "盤盈" : difference < 0 ? "盤虧" : "相符"}`;
  const nextAction: ReviewAction | null =
    locked || confirmed || pending || difference === null
      ? null
      : submitted
        ? "round"
        : "confirm-item";
  return {
    difference,
    pending,
    submitted,
    confirmed,
    status,
    tone,
    differenceText,
    nextAction,
  };
}

function ReviewActions({
  order,
  scope,
  onAction,
}: {
  order: Stocktake;
  scope: StocktakeScope;
  onAction: (kind: ReviewAction, itemId: string) => void;
}) {
  const state = reviewState(order, scope);
  const locked = order.status === "已完成" || order.status === "已作廢";
  return (
    <div className="stocktake-review-actions">
      {state.nextAction && (
        <BaseButton onClick={() => onAction(state.nextAction!, scope.itemId)}>
          {state.nextAction === "round" ? "比較與採用結果" : "確認品項"}
        </BaseButton>
      )}
      <BaseButton
        variant="outline"
        onClick={() => onAction("records", scope.itemId)}
      >
        查看輸入紀錄
      </BaseButton>
      {!locked &&
        !state.confirmed &&
        !state.pending &&
        !state.submitted &&
        state.difference !== null &&
        state.difference !== 0 && (
          <BaseButton
            variant="outline"
            onClick={() => onAction("recount", scope.itemId)}
          >
            發起複盤
          </BaseButton>
        )}
    </div>
  );
}
export function StocktakeReviewPanel({
  order,
  onAction,
}: {
  order: Stocktake;
  onAction: (kind: ReviewAction, itemId: string) => void;
}) {
  const [filter, setFilter] = useState<ReviewFilter>(
    order.status === "待核對" ? "unconfirmed" : "all",
  );
  const [search, setSearch] = useState("");
  const summary = {
    unconfirmed: order.scope.filter(
      (scope) => !order.confirmedItems.includes(scope.itemId),
    ).length,
    gain: order.scope.filter((scope) => (varianceFor(order, scope) ?? 0) > 0)
      .length,
    loss: order.scope.filter((scope) => (varianceFor(order, scope) ?? 0) < 0)
      .length,
    pendingRecount: order.scope.filter(
      (scope) => reviewState(order, scope).pending,
    ).length,
    adopt: order.scope.filter((scope) => reviewState(order, scope).submitted)
      .length,
  };
  const visible = sortStocktakeReviewScope(order).filter((scope) => {
    if (
      !`${scope.code} ${scope.name} ${scope.barcode}`
        .toLowerCase()
        .includes(search.trim().toLowerCase())
    )
      return false;
    const state = reviewState(order, scope);
    const difference = state.difference;
    if (filter === "variance") return difference !== null && difference !== 0;
    if (filter === "uncounted") return !countFor(order, scope.itemId).counted;
    if (filter === "unconfirmed") return !state.confirmed;
    if (filter === "gain") return difference !== null && difference > 0;
    if (filter === "loss") return difference !== null && difference < 0;
    if (filter === "pending-recount") return state.pending;
    if (filter === "adopt") return state.submitted;
    return true;
  });
  return (
    <section className="stocktake-card">
      <h3>{order.status === "已完成" ? "盤點結果" : "品項核對"}</h3>
      {order.status === "待核對" && (
        <div className="stocktake-review-summary" aria-label="核對待辦摘要">
          {(
            [
              ["unconfirmed", "待核對", summary.unconfirmed],
              ["gain", "盤盈", summary.gain],
              ["loss", "盤虧", summary.loss],
              ["pending-recount", "待複盤", summary.pendingRecount],
              ["adopt", "待選定結果", summary.adopt],
            ] as const
          ).map(([value, label, count]) => (
            <button
              key={value}
              type="button"
              className={`stocktake-review-summary-item stocktake-review-summary-item--${value}`}
              aria-pressed={filter === value}
              onClick={() => setFilter(filter === value ? "all" : value)}
            >
              <span>{label}</span>
              <strong>{count} 項</strong>
            </button>
          ))}
        </div>
      )}
      {order.status === "已完成" && (
        <section aria-label="盤點結果摘要">
          <p>
            共 {order.scope.length} 項 ／ 相符{" "}
            {
              order.scope.filter((scope) => varianceFor(order, scope) === 0)
                .length
            }{" "}
            項 ／ 盤盈{" "}
            {
              order.scope.filter(
                (scope) => (varianceFor(order, scope) ?? 0) > 0,
              ).length
            }{" "}
            項 ／ 盤虧{" "}
            {
              order.scope.filter(
                (scope) => (varianceFor(order, scope) ?? 0) < 0,
              ).length
            }{" "}
            項
          </p>
          <p>
            確認人：{order.confirmedBy} ／ 完成時間：{order.completedAt}
          </p>
        </section>
      )}
      <div className="stocktake-review-filters">
        <BaseField name="stocktake-review-search" label="搜尋品項">
          <BaseInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="料號、品名或條碼"
          />
        </BaseField>
        <BaseField name="stocktake-review-filter" label="核對篩選">
          <BaseNativeSelect
            value={filter}
            onChange={(event) => setFilter(event.target.value as ReviewFilter)}
          >
            <BaseNativeSelectOption value="all">
              全部品項
            </BaseNativeSelectOption>
            <BaseNativeSelectOption value="variance">
              有差異
            </BaseNativeSelectOption>
            {order.scope.some(
              (scope) => !countFor(order, scope.itemId).counted,
            ) && (
              <BaseNativeSelectOption value="uncounted">
                未盤點
              </BaseNativeSelectOption>
            )}
            {order.status === "待核對" && (
              <BaseNativeSelectOption value="unconfirmed">
                未核對
              </BaseNativeSelectOption>
            )}
            <BaseNativeSelectOption value="gain">盤盈</BaseNativeSelectOption>
            <BaseNativeSelectOption value="loss">盤虧</BaseNativeSelectOption>
            {order.status === "待核對" && (
              <BaseNativeSelectOption value="pending-recount">
                待複盤
              </BaseNativeSelectOption>
            )}
            {order.status === "待核對" && (
              <BaseNativeSelectOption value="adopt">
                待選定結果
              </BaseNativeSelectOption>
            )}
          </BaseNativeSelect>
        </BaseField>
      </div>
      <p role="status">
        符合 {visible.length}／{order.scope.length} 項
      </p>
      <div className="stocktake-review-table">
        <BaseDataTable
          tableKey={`stocktake-review-${order.id}`}
          headers={[
            "料號",
            "品名",
            "預期 → 實盤",
            "差異",
            "處理狀態",
            "帳面明細",
            "操作",
          ]}
          rows={visible.map((scope) => {
            const count = countFor(order, scope.itemId),
              state = reviewState(order, scope);
            return [
              scope.code,
              <div className="stocktake-review-product">
                <strong>{scope.name}</strong>
                <small>
                  {scope.specification} · {scope.unit}
                </small>
              </div>,
              `${expectedFor(scope)} → ${count.counted ? count.quantity : "未盤點"} ${scope.unit}`,
              <span
                className={`stocktake-review-difference stocktake-review-difference--${state.tone}`}
              >
                {state.differenceText}
              </span>,
              <span className="stocktake-review-state">{state.status}</span>,
              <details>
                <summary>查看明細</summary>
                <div>
                  帳面快照 {scope.baseline}；期間異動 {scope.movement}；採用：
                  {stocktakeRoundLabel(order.selectedRounds[scope.itemId] || 1)}
                </div>
              </details>,
              <ReviewActions order={order} scope={scope} onAction={onAction} />,
            ];
          })}
        />
      </div>
      <div className="stocktake-review-cards" aria-label="盤點差異品項">
        {visible.length ? (
          visible.map((scope) => {
            const count = countFor(order, scope.itemId);
            const state = reviewState(order, scope);
            return (
              <article className="stocktake-review-item" key={scope.itemId}>
                <div className="stocktake-review-item-heading">
                  <div>
                    <strong>{scope.name}</strong>
                    <small>
                      {scope.code} · {scope.specification} · {scope.unit}
                    </small>
                  </div>
                  <span className="stocktake-review-state">{state.status}</span>
                </div>
                <div className="stocktake-review-quantities">
                  <span>
                    預期 <strong>{expectedFor(scope)}</strong>
                  </span>
                  <span aria-hidden="true">→</span>
                  <span>
                    實盤{" "}
                    <strong>{count.counted ? count.quantity : "未盤點"}</strong>
                  </span>
                </div>
                <p
                  className={`stocktake-review-difference stocktake-review-difference--${state.tone}`}
                >
                  {state.differenceText}
                </p>
                <details>
                  <summary>查看帳面與採用結果</summary>
                  <p>
                    帳面快照 {scope.baseline}；期間異動 {scope.movement}；採用：
                    {stocktakeRoundLabel(
                      order.selectedRounds[scope.itemId] || 1,
                    )}
                  </p>
                </details>
                <ReviewActions
                  order={order}
                  scope={scope}
                  onAction={onAction}
                />
              </article>
            );
          })
        ) : (
          <p>目前沒有符合的品項。</p>
        )}
      </div>
      {order.recounts.length > 0 && (
        <details className="stocktake-review-history">
          <summary>複盤紀錄（{order.recounts.length} 筆）</summary>
          {order.recounts.map((row) => (
            <p key={row.id}>
              {order.scope.find((scope) => scope.itemId === row.itemId)?.name}{" "}
              ／ {stocktakeRoundLabel(row.round)} ／{" "}
              {row.person || "尚無輸入人員"} ／ {row.status} ／ {row.reason}
            </p>
          ))}
        </details>
      )}
      {order.status === "已完成" && (
        <section>
          <h4>差異調整明細（展示）</h4>
          {order.adjustments.length ? (
            order.adjustments.map((record) => (
              <article key={record.id}>
                <p>
                  {record.reference} ／ {record.type} ／ {record.quantity} ／
                  預期 {record.expected} → 確認實盤 {record.counted}
                </p>
                <ul>
                  {record.batches.map((batch) => (
                    <li key={batch.batchId}>
                      {batch.batchNumber}：{batch.quantity}
                    </li>
                  ))}
                </ul>
                <small>
                  {record.actor} ／ {record.time}
                </small>
              </article>
            ))
          ) : (
            <p>所有品項相符，無需調整數量。</p>
          )}
        </section>
      )}
      <details className="stocktake-review-history">
        <summary>盤點時間與數量說明</summary>
        <p>
          庫存基準時間：{order.snapshotAt}；初盤結束時間：
          {order.closedAt || "—"}。
        </p>
        <p>
          預期數量為建立時的庫存，加上盤點期間已核對的入出庫數量。差異為實盤減去預期數量；複盤只採用其中一輪，不與初盤累加。
        </p>
      </details>
      <details>
        <summary>盤點稽核歷史</summary>
        <ol>
          {order.audit.map((entry, index) => (
            <li key={index}>{entry}</li>
          ))}
        </ol>
      </details>
    </section>
  );
}
