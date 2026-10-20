import { BaseButton } from "@/components/ui/BaseButton";
import { BaseDataTable } from "@/components/ui/BaseDataTable";
import { countFor, expectedFor, varianceFor } from "./model";
import type { Stocktake } from "@/types/stocktakes";
export function StocktakeReviewPanel({
  order,
  onAction,
}: {
  order: Stocktake;
  onAction: (
    kind: "records" | "confirm-item" | "recount" | "round",
    itemId: string,
  ) => void;
}) {
  const locked = order.status === "已完成" || order.status === "已作廢";
  return (
    <section className="stocktake-card">
      <h3>主管差異核對</h3>
      <p>
        基準 {order.snapshotAt} ／ 關閉 {order.closedAt || "—"}
        ；帳面預期＝原始快照＋已對齊異動。複盤輪次各自保留，最終只採用一輪。
      </p>
      <BaseDataTable
        tableKey={`stocktake-review-${order.id}`}
        headers={[
          "料號",
          "品名",
          "規格",
          "單位",
          "帳面快照",
          "期間異動",
          "預期數量",
          "採用輪次",
          "實盤數量",
          "差異數量",
          "差異狀態",
          "核對",
          "操作",
        ]}
        rows={order.scope.map((scope) => {
          const count = countFor(order, scope.itemId),
            difference = varianceFor(order, scope);
          return [
            scope.code,
            scope.name,
            scope.specification,
            scope.unit,
            scope.baseline,
            scope.movement,
            expectedFor(scope),
            order.selectedRounds[scope.itemId] || 1,
            count.counted ? count.quantity : "未盤點",
            difference === null ? "—" : difference,
            difference === null
              ? "未盤點"
              : difference > 0
                ? "盤盈"
                : difference < 0
                  ? "盤虧"
                  : "相符",
            order.confirmedItems.includes(scope.itemId) ? "已確認" : "待核對",
            <div className="stocktake-actions">
              <BaseButton
                variant="outline"
                onClick={() => onAction("records", scope.itemId)}
              >
                輸入紀錄 {scope.code}
              </BaseButton>
              <BaseButton
                variant="outline"
                disabled={locked}
                onClick={() => onAction("confirm-item", scope.itemId)}
              >
                確認差異 {scope.code}
              </BaseButton>
              <BaseButton
                variant="outline"
                disabled={locked}
                onClick={() => onAction("recount", scope.itemId)}
              >
                指派複盤 {scope.code}
              </BaseButton>
              {order.recounts.some((row) => row.itemId === scope.itemId) && (
                <BaseButton
                  variant="outline"
                  disabled={locked}
                  onClick={() => onAction("round", scope.itemId)}
                >
                  選擇輪次 {scope.code}
                </BaseButton>
              )}
            </div>,
          ];
        })}
      />
      {order.recounts.length > 0 && (
        <section>
          <h4>複盤歷史</h4>
          {order.recounts.map((row) => (
            <p key={row.id}>
              {order.scope.find((scope) => scope.itemId === row.itemId)?.name}{" "}
              ／ 第 {row.round} 輪 ／ {row.person} ／ {row.status} ／{" "}
              {row.reason}
            </p>
          ))}
        </section>
      )}
      {order.status === "已完成" && (
        <section>
          <h4>展示庫存調整紀錄</h4>
          <p>
            {order.confirmedBy} ／ {order.completedAt}；完成後唯讀，不可作廢。
          </p>
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
          <p>這是本模組記憶體展示紀錄，沒有更新模組一或正式庫存。</p>
        </section>
      )}
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
