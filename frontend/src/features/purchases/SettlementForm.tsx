import { BaseTextarea } from "@/components/ui/BaseTextarea";
import { useState } from "react";
import { BaseInput } from "@/components/ui/BaseInput";
import {
  BaseNativeSelect,
  BaseNativeSelectOption as Option,
} from "@/components/ui/BaseNativeSelect";
import { taipeiToday } from "@/features/items/model";
import { Field, PurchaseForm } from "./FormParts";
import { currency, originalAmount, rounded } from "./model";
import type { Purchase, Settlement } from "@/types/purchases";
export function SettlementForm({
  order,
  onCancel,
  onDirty,
  onSubmit,
}: {
  order: Purchase;
  onCancel: () => void;
  onDirty: () => void;
  onSubmit: (
    value: Omit<Settlement, "number" | "operator" | "createdAt">,
  ) => void;
}) {
  const [draft, setDraft] = useState({
    invoice: "",
    invoiceDate: taipeiToday(),
    tax: "免稅",
    amount: String(originalAmount(order)),
    accountingDate: taipeiToday(),
    differenceReason: "",
    remark: "",
  });
  const amount = Number(draft.amount);
  const validAmount =
    draft.amount.trim() !== "" &&
    Number.isFinite(amount) &&
    amount >= 0 &&
    Math.abs(amount * 100 - Math.round(amount * 100)) < 0.000001;
  const difference = validAmount
    ? rounded(amount - originalAmount(order))
    : null;
  const hasDifference = difference !== null && difference !== 0;
  return (
    <PurchaseForm
      onCancel={onCancel}
      onDirty={onDirty}
      submitText="下一步：確認內容"
      submit={() => {
        if (!validAmount)
          return {
            message: "請輸入有效核對金額，不可為負數，最多小數 2 位。",
            field: "settlement-amount",
          };
        if (hasDifference && !draft.differenceReason.trim())
          return {
            message: "核對金額與原始進貨金額不同，請填寫差異原因。",
            field: "settlement-difference",
          };
        onSubmit({
          ...draft,
          amount,
          differenceReason: hasDifference ? draft.differenceReason.trim() : "",
        });
      }}
    >
      <div className="purchase-settlement-context">
        <span>收貨日期 {order.date}</span>
        <span>入庫倉別 {order.warehouse}</span>
      </div>
      <section>
        <h3>金額核對</h3>
        <div className="purchase-settlement-amounts">
          <div>
            <span className="purchase-amount-label">原始進貨金額</span>
            <strong>{currency(originalAmount(order))}</strong>
          </div>
          <div>
            <Field name="settlement-amount" label="實際核對金額" required>
              <BaseInput
                type="number"
                min="0"
                step="0.01"
                value={draft.amount}
                onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
              />
            </Field>
          </div>
          <div role="status" aria-live="polite">
            <span className="purchase-amount-label">差額</span>
            <strong>
              {difference === null
                ? "—"
                : difference === 0
                  ? "金額一致"
                  : `${difference > 0 ? "+" : ""}${currency(difference)}`}
            </strong>
            <small>
              {difference === null
                ? "請輸入有效金額"
                : difference === 0
                  ? "與原始進貨金額相同"
                  : difference > 0
                    ? "高於原始進貨金額"
                    : "低於原始進貨金額"}
            </small>
          </div>
        </div>
        {hasDifference && (
          <div className="purchase-settlement-reason">
            <Field
              name="settlement-difference"
              label="差異原因"
              required
              hint="核對金額不同時，請說明原因後再繼續。"
            >
              <BaseInput
                value={draft.differenceReason}
                onChange={(e) =>
                  setDraft({ ...draft, differenceReason: e.target.value })
                }
              />
            </Field>
          </div>
        )}
      </section>
      <section>
        <h3>發票與帳務資料</h3>
        <div className="items-form-grid">
          <Field name="settlement-invoice" label="發票號碼">
            <BaseInput
              value={draft.invoice}
              onChange={(e) => setDraft({ ...draft, invoice: e.target.value })}
              placeholder="例如 AB12345678（選填）"
            />
          </Field>
          <Field
            name="settlement-invoice-date"
            label="發票日期"
            required
            hint="預設今天，請依此次核對的發票日期調整。"
          >
            <BaseInput
              type="date"
              value={draft.invoiceDate}
              onChange={(e) =>
                setDraft({ ...draft, invoiceDate: e.target.value })
              }
            />
          </Field>
          <Field
            name="settlement-tax"
            label="稅別"
            required
            hint="預設免稅，可依本張單據調整。"
          >
            <BaseNativeSelect
              value={draft.tax}
              onChange={(e) => setDraft({ ...draft, tax: e.target.value })}
            >
              <Option value="">請選擇稅別</Option>
              {["應稅", "免稅", "零稅率"].map((t) => (
                <Option key={t}>{t}</Option>
              ))}
            </BaseNativeSelect>
          </Field>
          <Field
            name="settlement-accounting-date"
            label="帳務歸屬日期"
            required
            hint="這筆核對歸入哪一天的帳務，可與收貨日期、發票日期不同。"
          >
            <BaseInput
              type="date"
              value={draft.accountingDate}
              onChange={(e) =>
                setDraft({ ...draft, accountingDate: e.target.value })
              }
            />
          </Field>
        </div>
        <details className="purchase-optional-fields">
          <summary>
            核對備註<span>{draft.remark ? "已填寫，可展開查看" : "選填"}</span>
          </summary>
          <Field name="settlement-remark" label="核對備註">
            <BaseTextarea
              rows={3}
              value={draft.remark}
              onChange={(e) => setDraft({ ...draft, remark: e.target.value })}
            />
          </Field>
        </details>
      </section>
      <p className="purchase-callout">
        確認核對只表示發票與金額已核對，不代表已付款；本次操作不再次入庫，也不覆蓋原始進貨金額。
      </p>
    </PurchaseForm>
  );
}
