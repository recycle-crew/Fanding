import { BaseCheckbox } from "@/components/ui/BaseCheckbox";
import { BaseLabel } from "@/components/ui/BaseLabel";
import { useState } from "react";
import { BaseInput } from "@/components/ui/BaseInput";
import {
  BaseNativeSelect,
  BaseNativeSelectOption as Option,
} from "@/components/ui/BaseNativeSelect";
import {
  BaseTable,
  BaseTableHeader,
  BaseTableHead,
  BaseTableBody,
  BaseTableCell,
  BaseTableRow,
} from "@/components/ui/BaseTable";
import { useAppSelector } from "@/store/hooks";
import { taipeiToday, usageStatus } from "@/features/items/model";
import { Field, PurchaseForm } from "./FormParts";
import {
  currency,
  lineBalance,
  operationLabels,
  originalAmount,
  rounded,
  type CorrectionType,
  type OperationLine,
  type Purchase,
  type PurchaseOperation,
  type PurchaseRecord,
} from "./model";
export type OperationInput = Omit<
  PurchaseRecord,
  "id" | "number" | "operator" | "createdAt"
>;
export function OperationForm({
  order,
  kind,
  onCancel,
  onDirty,
  onSubmit,
}: {
  order: Purchase;
  kind: PurchaseOperation;
  onCancel: () => void;
  onDirty: () => void;
  onSubmit: (value: OperationInput) => void;
}) {
  const items = useAppSelector((s) => s.items.items).filter(
    (i) => usageStatus(i) === "使用中",
  );
  const [draft, setDraft] = useState({
    date: taipeiToday(),
    reason: "",
    resolution: "",
    remark: "",
    physical: false,
    type: "數量更正" as CorrectionType,
    amount: "",
    replacementId: "",
    replacementBatch: "",
    replacementExpiry: "",
  });
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [newCosts, setNewCosts] = useState<Record<string, string>>({});
  const monetary = kind === "correction" && draft.type === "發票金額更正";
  const costOnly = kind === "correction" && draft.type === "成本更正";
  const replacement =
    kind === "correction" && ["品項更正", "批號更正"].includes(draft.type);
  const chosenItem = items.find((i) => i.id === draft.replacementId);
  const choices = order.lines.filter((l) => selected[l.id]);
  const estimatedAmount = monetary
    ? Number(draft.amount)
    : choices.reduce(
        (s, l) =>
          s +
          (costOnly
            ? (Number(newCosts[l.id]) - l.unitCost) * l.quantity
            : (kind === "correction" && !replacement
                ? Number(quantities[l.id] || 0)
                : -Number(quantities[l.id] || 0)) * l.unitCost),
        0,
      );
  return (
    <PurchaseForm
      onCancel={onCancel}
      onDirty={onDirty}
      submitText={`檢查並${kind === "return" ? "退貨" : kind === "reversal" ? "沖銷" : "更正"}`}
      submit={() => {
        if (kind === "reversal" && order.settlement)
          return { message: "已結帳單據請使用結帳後更正。" };
        if (kind === "correction" && !order.settlement)
          return { message: "此單據尚未核對結帳。" };
        if (!draft.reason.trim())
          return { message: "請填寫處理原因。", field: "operation-reason" };
        if (kind === "return" && !draft.physical)
          return {
            message: "請先確認商品已實際交付退回。",
            field: "operation-physical",
          };
        if (!monetary && !choices.length)
          return { message: "請至少勾選一筆要處理的商品。" };
        if (replacement && choices.length !== 1)
          return { message: "品項或批號更正一次請選擇一筆原始明細。" };
        if (
          monetary &&
          (!Number.isFinite(Number(draft.amount)) || Number(draft.amount) === 0)
        )
          return {
            message: "請輸入非零的帳務更正金額。",
            field: "operation-amount",
          };
        const lines: OperationLine[] = [];
        for (const line of choices) {
          const amount = costOnly
            ? Number(newCosts[line.id])
            : Number(quantities[line.id]);
          if (
            !Number.isFinite(amount) ||
            (costOnly
              ? newCosts[line.id] === undefined ||
                amount < 0 ||
                amount === line.unitCost
              : !amount ||
                ((kind !== "correction" || replacement) && amount < 0))
          )
            return {
              message: `${line.name}：請填寫有效${costOnly ? "新單位成本（需與原成本不同）" : "處理數量"}。`,
            };
          const delta = costOnly
            ? 0
            : kind === "correction" && !replacement
              ? amount
              : -amount;
          const balance = lineBalance(order, line);
          if (delta < 0 && -delta > balance.remaining)
            return {
              message: `${line.name}：本次數量超過單據剩餘可處理量 ${balance.remaining} ${line.unit}。`,
            };
          if (delta < 0 && -delta > balance.traceable)
            return {
              message: `${line.name}：可追溯剩餘量不足（${balance.traceable} ${line.unit}），請由管理員確認後續交易影響。`,
            };
          const result: OperationLine = {
            lineId: line.id,
            quantityChange: delta,
            amount: rounded(
              costOnly
                ? (amount - line.unitCost) * line.quantity
                : delta * line.unitCost,
            ),
          };
          if (costOnly) result.newUnitCost = amount;
          if (replacement) {
            const target = draft.type === "品項更正" ? chosenItem : undefined;
            if (
              draft.type === "品項更正" &&
              (!target || target.id === line.itemId)
            )
              return {
                message: "請選擇不同的正確商品。",
                field: "operation-replacement",
              };
            if (target && target.unit !== line.unit)
              return {
                message: "展示版不提供單位換算，請選擇相同基本單位的商品。",
                field: "operation-replacement",
              };
            if (
              (target?.trackBatch ?? line.trackBatch) &&
              !draft.replacementBatch.trim()
            )
              return { message: "請填寫正確批號。", field: "operation-batch" };
            if (
              (target?.trackExpiry ?? line.trackExpiry) &&
              !draft.replacementExpiry
            )
              return { message: "請填寫正確效期。", field: "operation-expiry" };
            if (
              !target &&
              draft.replacementBatch === line.batch &&
              draft.replacementExpiry === line.expiry
            )
              return { message: "正確批號或效期需與原資料不同。" };
            result.replacement = {
              itemId: target?.id || line.itemId,
              code: target?.code || line.code,
              name: target?.name || line.name,
              specification: target?.specification || line.specification,
              unit: target?.unit || line.unit,
              batch: draft.replacementBatch,
              expiry: draft.replacementExpiry,
            };
            result.amount = 0;
          }
          lines.push(result);
        }
        onSubmit({
          kind,
          correctionType: kind === "correction" ? draft.type : undefined,
          date: draft.date,
          reason: draft.reason.trim(),
          resolution: kind === "reversal" ? "不適用" : draft.resolution,
          accountingStatus: kind === "reversal" ? "已完成" : "待處理",
          amount: monetary
            ? rounded(Number(draft.amount))
            : kind === "correction"
              ? rounded(lines.reduce((s, l) => s + l.amount, 0))
              : rounded(-lines.reduce((s, l) => s + l.amount, 0)),
          resolutionAmount: "",
          reference: "",
          remark: draft.remark,
          lines,
        });
      }}
    >
      <section>
        <h3>原進貨資訊</h3>
        <dl className="purchase-facts">
          <div>
            <dt>原進貨單號</dt>
            <dd>{order.number}</dd>
          </div>
          <div>
            <dt>供應商／倉別</dt>
            <dd>
              {order.supplier} · {order.warehouse}
            </dd>
          </div>
          <div>
            <dt>原始進貨金額</dt>
            <dd>{currency(originalAmount(order))}</dd>
          </div>
          <div>
            <dt>原核對紀錄</dt>
            <dd>
              {order.settlement
                ? `${order.settlement.number} · ${currency(order.settlement.amount)}`
                : "尚未核對結帳"}
            </dd>
          </div>
        </dl>
      </section>
      <section>
        <h3>{operationLabels[kind]}資料</h3>
        <div className="items-form-grid purchase-header-grid">
          {kind === "correction" && (
            <Field name="operation-type" label="更正類型" required>
              <BaseNativeSelect
                value={draft.type}
                onChange={(e) => {
                  setDraft({
                    ...draft,
                    type: e.target.value as CorrectionType,
                  });
                  setSelected({});
                  setQuantities({});
                  setNewCosts({});
                }}
              >
                {[
                  "數量更正",
                  "品項更正",
                  "批號更正",
                  "成本更正",
                  "發票金額更正",
                ].map((t) => (
                  <Option key={t}>{t}</Option>
                ))}
              </BaseNativeSelect>
            </Field>
          )}
          <Field
            name="operation-date"
            label={`${kind === "return" ? "退貨" : kind === "reversal" ? "沖銷" : "更正"}日期`}
            required
          >
            <BaseInput
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            />
          </Field>
          <Field name="operation-reason" label="處理原因" required>
            <BaseInput
              value={draft.reason}
              onChange={(e) => setDraft({ ...draft, reason: e.target.value })}
              placeholder="請說明本次處理原因"
            />
          </Field>
          {kind !== "reversal" && (
            <Field
              name="operation-resolution"
              label={kind === "return" ? "供應商處理方式" : "帳務處理方式"}
              required
            >
              <BaseNativeSelect
                value={draft.resolution}
                onChange={(e) =>
                  setDraft({ ...draft, resolution: e.target.value })
                }
              >
                <Option value="">請選擇</Option>
                {(kind === "return"
                  ? ["折讓", "退款", "換貨", "待確認"]
                  : ["補貨", "折讓", "退款", "補收", "待確認"]
                ).map((t) => (
                  <Option key={t}>{t}</Option>
                ))}
              </BaseNativeSelect>
            </Field>
          )}
          {monetary && (
            <Field
              name="operation-amount"
              label="本次帳務更正金額"
              required
              hint="補增為正、減少為負；不覆蓋原核對金額。"
            >
              <BaseInput
                type="number"
                step="0.01"
                value={draft.amount}
                onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
              />
            </Field>
          )}
          <Field name="operation-remark" label="備註">
            <BaseInput
              value={draft.remark}
              onChange={(e) => setDraft({ ...draft, remark: e.target.value })}
            />
          </Field>
        </div>
      </section>
      {!monetary && (
        <section>
          <h3>選擇處理商品</h3>
          <div
            className="purchase-table-scroll"
            role="region"
            tabIndex={0}
            aria-label="處理商品明細，可左右捲動"
          >
            <BaseTable className="purchase-lines-table">
              <BaseTableHeader>
                <BaseTableRow>
                  {[
                    "選擇",
                    "商品／規格",
                    "批號／效期",
                    "原數量",
                    "已處理量",
                    "可處理量",
                    "可追溯上限",
                    costOnly ? "新單位成本" : "本次數量",
                    "原單位成本",
                  ].map((h) => (
                    <BaseTableHead key={h}>{h}</BaseTableHead>
                  ))}
                </BaseTableRow>
              </BaseTableHeader>
              <BaseTableBody>
                {order.lines.map((l) => {
                  const balance = lineBalance(order, l);
                  return (
                    <BaseTableRow key={l.id}>
                      <BaseTableCell>
                        <BaseCheckbox
                          aria-label={`選擇${l.name}`}
                          checked={!!selected[l.id]}
                          onCheckedChange={(checked) =>
                            setSelected(
                              replacement
                                ? { [l.id]: checked === true }
                                : { ...selected, [l.id]: checked === true },
                            )
                          }
                        />
                      </BaseTableCell>
                      <BaseTableCell>
                        <strong>{l.name}</strong>
                        <small>
                          {l.code} · {l.specification} · {l.unit}
                        </small>
                      </BaseTableCell>
                      <BaseTableCell>
                        {l.batch || "—"}
                        <small>{l.expiry || "—"}</small>
                      </BaseTableCell>
                      <BaseTableCell>{l.quantity}</BaseTableCell>
                      <BaseTableCell>{balance.processed}</BaseTableCell>
                      <BaseTableCell>{balance.remaining}</BaseTableCell>
                      <BaseTableCell>{balance.traceable}</BaseTableCell>
                      <BaseTableCell>
                        <BaseInput
                          aria-label={`${l.name}${costOnly ? "新單位成本" : "本次數量"}`}
                          type="number"
                          step={costOnly ? "0.0001" : "0.001"}
                          min={
                            costOnly
                              ? 0
                              : kind === "correction" && !replacement
                                ? undefined
                                : "0.001"
                          }
                          disabled={!selected[l.id]}
                          required={!!selected[l.id]}
                          value={(costOnly ? newCosts : quantities)[l.id] ?? ""}
                          onChange={(e) =>
                            costOnly
                              ? setNewCosts({
                                  ...newCosts,
                                  [l.id]: e.target.value,
                                })
                              : setQuantities({
                                  ...quantities,
                                  [l.id]: e.target.value,
                                })
                          }
                        />
                      </BaseTableCell>
                      <BaseTableCell>{l.unitCost.toFixed(4)}</BaseTableCell>
                    </BaseTableRow>
                  );
                })}
              </BaseTableBody>
            </BaseTable>
          </div>
          {kind === "correction" && !replacement && !costOnly && (
            <p className="items-note">
              數量少登填正數補入，多登填負數扣除；原始數量不變。
            </p>
          )}
        </section>
      )}
      {replacement && (
        <section>
          <h3>正確商品／批次資料</h3>
          <div className="items-form-grid">
            {draft.type === "品項更正" && (
              <Field name="operation-replacement" label="正確商品" required>
                <BaseNativeSelect
                  value={draft.replacementId}
                  onChange={(e) =>
                    setDraft({ ...draft, replacementId: e.target.value })
                  }
                >
                  <Option value="">請選擇正確商品</Option>
                  {items.map((i) => (
                    <Option key={i.id} value={i.id}>
                      {i.code} · {i.name}（{i.unit}）
                    </Option>
                  ))}
                </BaseNativeSelect>
              </Field>
            )}
            <Field name="operation-batch" label="正確批號">
              <BaseInput
                value={draft.replacementBatch}
                onChange={(e) =>
                  setDraft({ ...draft, replacementBatch: e.target.value })
                }
              />
            </Field>
            <Field name="operation-expiry" label="正確效期">
              <BaseInput
                type="date"
                value={draft.replacementExpiry}
                onChange={(e) =>
                  setDraft({ ...draft, replacementExpiry: e.target.value })
                }
              />
            </Field>
          </div>
        </section>
      )}
      {kind === "return" && (
        <BaseLabel className="purchase-check">
          <BaseCheckbox
            id="operation-physical"
            checked={draft.physical}
            onCheckedChange={(checked) => setDraft({ ...draft, physical: checked === true })}
          />
          已確認商品實際交付退回供應商（展示確認）
        </BaseLabel>
      )}
      <div className="purchase-total">
        <span>
          {monetary || costOnly
            ? "僅更正金額，不異動數量"
            : replacement
              ? "原資料反向處理，另記正確商品／批次"
              : "原始明細與歷史成本會保留"}
        </span>
        <strong>
          {kind === "correction" ? "本次更正金額" : "原成本處理金額"}{" "}
          {currency(
            Number.isFinite(estimatedAmount) && !replacement
              ? kind === "correction"
                ? estimatedAmount
                : -estimatedAmount
              : 0,
          )}
        </strong>
      </div>
      <p className="purchase-callout">
        {kind === "reversal"
          ? "沖銷用於登錄錯誤，與實際商品退貨分開處理。"
          : kind === "return"
            ? "退貨成本與供應商最後同意的折讓／退款金額分開保存，物流完成不代表帳務完成。"
            : "保留原進貨與核對紀錄，庫存更正與帳務確認分開追蹤。"}
        本頁僅展示單據流程，不連動模組一庫存。
      </p>
    </PurchaseForm>
  );
}
