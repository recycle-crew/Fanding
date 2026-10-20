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
import { countFor, expectedFor, stocktakePeople, varianceFor } from "./model";
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
  close: "確認關閉盤點",
  cancel: "確認作廢盤點",
  invalidate: "確認標記無效",
  recount: "建立複盤任務",
  round: "採用此輪次",
  "confirm-item": "儲存品項核對",
  approve: "確認完成展示調整",
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
    [person, setPerson] = useState(stocktakePeople[0]),
    [round, setRound] = useState(order.selectedRounds[itemId || ""] || 1);
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
              people: Boolean(checks.people),
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
            requestRecount({ id: order.id, itemId: itemId!, person, reason }),
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
        {operation === "close" && (
          <>
            <p>關閉後停止初盤輸入，才開放主管查看差異。未盤點不可當作零。</p>
            <ul>
              {order.people.map((entry) => (
                <li key={entry}>
                  {entry}：
                  {order.finished.includes(entry) ? "已完成" : "尚未完成"}
                </li>
              ))}
            </ul>
            <p>
              已登錄{" "}
              {
                order.scope.filter(
                  (row) => countFor(order, row.itemId, 1).counted,
                ).length
              }
              ／{order.scope.length}{" "}
              品項。未完成的人員需切換展示身分完成本人分區盤點。
            </p>
            {check("people", "已確認所有指派人員完成盤點（展示）")}
            {check(
              "partition",
              "已確認分區分工無重複計算或未處理輸入疑慮（展示）",
            )}
            {check(
              "time",
              "已確認盤點截止時間、期間異動與基準可靠對齊（展示）",
            )}
            {check("his", "已確認 HIS 同步無延遲，否則暫停或重新盤點（展示）")}
          </>
        )}
        {["cancel", "invalidate", "recount", "round"].includes(operation) && (
          <Field
            name="stocktake-operation-reason"
            label={
              operation === "invalidate"
                ? "無效原因"
                : operation === "cancel"
                  ? "作廢原因"
                  : operation === "round"
                    ? "採用輪次原因"
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
          <>
            <Field name="stocktake-recount-person" label="複盤人員" required>
              <Select
                value={person}
                onChange={(event) => setPerson(event.target.value)}
              >
                {stocktakePeople.map((entry) => (
                  <Option key={entry}>{entry}</Option>
                ))}
              </Select>
            </Field>
            <p>
              建立新的盲盤輪次，初盤與複盤不相加；提交後需主管選擇有效輪次。
            </p>
          </>
        )}
        {operation === "round" && (
          <>
            <Field name="stocktake-round" label="最終採用輪次" required>
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
                  <Option key={number} value={number}>
                    第 {number} 輪：
                    {countFor(order, itemId!, number).counted
                      ? countFor(order, itemId!, number).quantity
                      : "尚未盤點"}{" "}
                    {scope?.unit}
                  </Option>
                ))}
              </Select>
            </Field>
            <p>各輪僅擇一採用，尚未提交的必要複盤會阻擋確認。</p>
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
              品項；仍有未確認或必要複盤時將阻擋。完成後鎖定，僅建立本模組展示調整與稽核紀錄。
            </p>
            {check(
              "approve",
              "已確認全部結果、HIS 同步及盤點基準安全，完成展示調整",
            )}
          </>
        )}
      </section>
    </BaseForm>
  );
}
