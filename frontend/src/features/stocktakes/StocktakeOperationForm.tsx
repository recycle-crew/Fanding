import { useState } from "react";
import { BaseForm, BaseField as Field } from "@/components/ui/BaseForm";
import { BaseInput } from "@/components/ui/BaseInput";
import { BaseTextarea } from "@/components/ui/BaseTextarea";
import {
  BaseNativeSelect as Select,
  BaseNativeSelectOption as Option,
} from "@/components/ui/BaseNativeSelect";
import { BaseCheckField } from "@/components/ui/BaseCheckField";
import { useAppDispatch } from "@/store/hooks";
import {
  approveCounting,
  cancelCounting,
  chooseCountRound,
  closeCounting,
  confirmCountItem,
  invalidateCount,
  requestRecount,
} from "@/store/stocktakes";
import {
  countFor,
  expectedFor,
  varianceFor,
  roundQty,
  stocktakeRoundLabel,
} from "./model";
import type { Stocktake } from "@/types/stocktakes";
export type StocktakeOperation =
  | "close"
  | "cancel"
  | "invalidate"
  | "recount"
  | "round"
  | "confirm-item"
  | "approve";
const submitLabels: Record<StocktakeOperation, string> = {
  close: "確認結束初盤",
  cancel: "確認作廢盤點",
  invalidate: "確認標記無效",
  recount: "建立複盤任務",
  round: "確認採用結果",
  "confirm-item": "儲存品項核對",
  approve: "確認盤點結果",
};
export function StocktakeOperationForm({
  order,
  operation,
  itemId,
  recordId,
  onCancel,
  onDirty,
  onDone,
}: {
  order: Stocktake;
  operation: StocktakeOperation;
  itemId?: string;
  recordId?: string;
  onCancel: () => void;
  onDirty: () => void;
  onDone: () => void;
}) {
  const dispatch = useAppDispatch(),
    scope = order.scope.find((row) => row.itemId === itemId);
  const [reason, setReason] = useState(""),
    [round, setRound] = useState(
      order.recounts
        .filter((entry) => entry.itemId === itemId && entry.status === "已提交")
        .sort((a, b) => b.round - a.round)[0]?.round ||
        order.selectedRounds[itemId || ""] ||
        1,
    );
  const [checks, setChecks] = useState<Record<string, boolean>>({}),
    [plans, setPlans] = useState<Record<string, number>>(
      Object.fromEntries(
        (order.batchPlans[itemId || ""] || []).map((plan) => [
          plan.batchId,
          plan.quantity,
        ]),
      ),
    );
  function check(key: string, label: string) {
    return (
      <BaseCheckField
        label={label}
        checked={Boolean(checks[key])}
        onChange={(value) => {
          setChecks({ ...checks, [key]: value });
          onDirty();
        }}
      />
    );
  }
  const allocated = roundQty(
    Object.values(plans).reduce((sum, quantity) => sum + quantity, 0),
  );
  const remaining = scope
    ? roundQty((varianceFor(order, scope) ?? 0) - allocated)
    : 0;
  return (
    <BaseForm
      submitText={submitLabels[operation]}
      onCancel={onCancel}
      onDirty={onDirty}
      submit={() => {
        let result: { error: string };
        if (operation === "close")
          result = dispatch(
            closeCounting({
              id: order.id,
              partition: Boolean(checks.partition),
              time: Boolean(checks.time),
              his: Boolean(checks.his),
            }),
          );
        else if (operation === "cancel")
          result = dispatch(cancelCounting({ id: order.id, reason }));
        else if (operation === "invalidate")
          result = dispatch(
            invalidateCount({ id: order.id, recordId: recordId!, reason }),
          );
        else if (operation === "recount")
          result = dispatch(
            requestRecount({ id: order.id, itemId: itemId!, reason }),
          );
        else if (operation === "round")
          result = dispatch(
            chooseCountRound({ id: order.id, itemId: itemId!, round, reason }),
          );
        else if (operation === "confirm-item")
          result = dispatch(
            confirmCountItem({
              id: order.id,
              itemId: itemId!,
              checked: Boolean(checks.item),
              plans: scope!.batches.map((batch) => ({
                batchId: batch.id,
                quantity: Number(plans[batch.id] || 0),
              })),
            }),
          );
        else
          result = dispatch(
            approveCounting({
              id: order.id,
              confirmed: Boolean(checks.approve),
            }),
          );
        if (result.error) return { message: result.error };
        onDone();
      }}
    >
      <section>
        <h3>
          {order.number} {scope?.name || order.name}
        </h3>
        {scope && ["recount", "round"].includes(operation) && (
          <p>
            目前採用第 {order.selectedRounds[scope.itemId] || 1} 輪：預期{" "}
            {expectedFor(scope)} {scope.unit}，實盤{" "}
            {countFor(order, scope.itemId).counted
              ? countFor(order, scope.itemId).quantity
              : "未盤點"}
            ，差異 {varianceFor(order, scope) ?? "尚未盤點"}。
          </p>
        )}
        {operation === "close" && (
          <>
            <p>結束初盤後停止輸入，才開放主管查看差異。未盤點不可當作零。</p>
            <p>
              已登錄{" "}
              {
                order.scope.filter(
                  (row) => countFor(order, row.itemId, 1).counted,
                ).length
              }
              ／{order.scope.length} 品項。請確認所有現場數量都已登錄。
            </p>
            {check("partition", "已確認所有品項清點完成，且沒有重複計算")}
            {check("time", "已核對盤點截止時間及期間入出庫紀錄")}
            {check("his", "已確認帳面資料可供本次核對")}
          </>
        )}
        {["cancel", "invalidate", "recount"].includes(operation) && (
          <Field
            name="stocktake-operation-reason"
            label={
              operation === "invalidate"
                ? "無效原因"
                : operation === "cancel"
                  ? "作廢原因"
                  : "複盤原因"
            }
            required
          >
            <BaseTextarea
              maxLength={500}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </Field>
        )}
        {operation === "invalidate" && (
          <p>原始紀錄 {recordId} 保留；無效後不列入累計，請另新增正確輸入。</p>
        )}
        {operation === "cancel" && (
          <p>作廢保留快照、原始輸入與稽核，不更新庫存；已完成單據不能作廢。</p>
        )}
        {operation === "recount" && (
          <p>
            建立新一輪複盤後，任何盤點人員都可開始輸入，每筆保留實際輸入人員；提交後由主管選擇採用哪一輪的結果。
          </p>
        )}
        {operation === "round" && (
          <>
            <p>
              選擇一份清點結果作為本次實盤數量。其他結果仍會保留，數量不相加。
            </p>
            <div
              className="stocktake-round-comparison"
              aria-label="各次盤點結果比較"
            >
              {[
                1,
                ...order.recounts
                  .filter((entry) => entry.itemId === itemId)
                  .map((entry) => entry.round),
              ].map((number) => {
                const count = countFor(order, itemId!, number);
                const records = order.records.filter(
                  (record) =>
                    record.itemId === itemId &&
                    record.round === number &&
                    record.valid,
                );
                const recount = order.recounts.find(
                  (entry) => entry.itemId === itemId && entry.round === number,
                );
                return (
                  <article
                    key={number}
                    className={round === number ? "is-selected" : ""}
                  >
                    <strong>
                      {stocktakeRoundLabel(number)}
                      {(order.selectedRounds[itemId || ""] || 1) === number
                        ? "（目前採用）"
                        : ""}
                    </strong>
                    <p>
                      實盤{" "}
                      {count.counted
                        ? `${count.quantity} ${scope?.unit}`
                        : "尚未盤點"}
                      ；差異{" "}
                      {count.counted && scope
                        ? roundQty(count.quantity - expectedFor(scope))
                        : "—"}
                    </p>
                    <small>
                      輸入人員：
                      {[
                        ...new Set(records.map((record) => record.person)),
                      ].join("、") || "尚無紀錄"}{" "}
                      ／{" "}
                      {number === 1
                        ? "初盤已結束"
                        : recount?.status === "已提交"
                          ? "已提交，可採用"
                          : recount?.status}
                    </small>
                  </article>
                );
              })}
            </div>
            <Field name="stocktake-round" label="採用結果" required>
              <Select
                value={round}
                onChange={(event) => setRound(Number(event.target.value))}
              >
                {[
                  1,
                  ...order.recounts
                    .filter((entry) => entry.itemId === itemId)
                    .map((entry) => entry.round),
                ].map((number) => (
                  <Option
                    key={number}
                    value={number}
                    disabled={
                      !countFor(order, itemId!, number).counted ||
                      (number > 1 &&
                        order.recounts.some(
                          (entry) =>
                            entry.itemId === itemId &&
                            entry.round === number &&
                            entry.status === "待複盤",
                        ))
                    }
                  >
                    {stocktakeRoundLabel(number)}：
                    {countFor(order, itemId!, number).counted
                      ? countFor(order, itemId!, number).quantity
                      : "尚未盤點"}{" "}
                    {scope?.unit}
                    {number > 1 &&
                    order.recounts.some(
                      (entry) =>
                        entry.itemId === itemId &&
                        entry.round === number &&
                        entry.status === "待複盤",
                    )
                      ? "（尚未提交，不能採用）"
                      : ""}
                  </Option>
                ))}
              </Select>
            </Field>
            <p role="status">
              採用後實盤為 {countFor(order, itemId!, round).quantity}{" "}
              {scope?.unit}；仍需回到清單確認品項
              {scope?.trackBatch ? "與批次差異" : ""}。
            </p>
            <Field name="stocktake-round-reason" label="採用原因" required>
              <BaseTextarea
                maxLength={500}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="例如：再次清點後確認數量，採用本次複盤結果"
              />
            </Field>
          </>
        )}
        {operation === "confirm-item" && scope && (
          <>
            <p>
              預期 {expectedFor(scope)} {scope.unit}，實盤{" "}
              {countFor(order, scope.itemId).counted
                ? countFor(order, scope.itemId).quantity
                : "未盤點"}
              ，差異 {varianceFor(order, scope) ?? "尚未盤點"}。
            </p>
            {scope.trackBatch && Boolean(varianceFor(order, scope)) && (
              <>
                <h4>主管確認實際批次差異</h4>
                <p>
                  盤盈填正數，盤虧填負數，合計須等於總差異。沒有可合理確認的批次時請暫停，不會任意指定。
                </p>
                <p className="stocktake-completion-status" role="status">
                  需分配差異 {varianceFor(order, scope)} {scope.unit} ／ 已分配{" "}
                  {allocated} ／ 尚差 {remaining}
                  {remaining === 0 ? "（已分配完成）" : "（請繼續分配）"}
                </p>
                {scope.batches.map((batch) => (
                  <Field
                    key={batch.id}
                    name={`batch-plan-${batch.id}`}
                    label={`批號 ${batch.number || "無批號"} 差異`}
                    hint={`原批次 ${batch.quantity}，不可用 ${batch.unavailable}，效期 ${batch.expiry || "不追蹤"}`}
                  >
                    <BaseInput
                      type="number"
                      step="0.001"
                      value={plans[batch.id] || 0}
                      onChange={(event) =>
                        setPlans({
                          ...plans,
                          [batch.id]: Number(event.target.value),
                        })
                      }
                    />
                  </Field>
                ))}
                {!scope.batches.length && (
                  <p role="alert">
                    無可核對批次，請先完成實際批次調查，此品項無法直接確認入帳。
                  </p>
                )}
              </>
            )}
            {check("item", "已核對採用輪次、品項與實際批次差異（展示）")}
          </>
        )}
        {operation === "approve" && (
          <>
            <p>
              已確認 {order.confirmedItems.length}／{order.scope.length}{" "}
              品項；仍有未確認或必要複盤時將阻擋。完成後鎖定。預覽不修改正式庫存；正式調整方式待確認。
            </p>
            {check("approve", "已核對全部盤點結果，確認完成後鎖定單據")}
          </>
        )}
      </section>
    </BaseForm>
  );
}
