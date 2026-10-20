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
    tax: "",
    amount: String(originalAmount(order)),
    accountingDate: taipeiToday(),
    differenceReason: "",
    remark: "",
  });
  const difference = rounded(Number(draft.amount) - originalAmount(order));
  return (
    <PurchaseForm
      onCancel={onCancel}
      onDirty={onDirty}
      submitText="核對並結帳"
      submit={() => {
        if (!Number.isFinite(Number(draft.amount)) || Number(draft.amount) < 0)
          return {
            message: "核對金額必須為非負數。",
            field: "settlement-amount",
          };
        if (difference && !draft.differenceReason.trim())
          return {
            message: "核對金額與原始進貨金額不同，請填寫差異原因。",
            field: "settlement-difference",
          };
        onSubmit({ ...draft, amount: Number(draft.amount) });
      }}
    >
      <section>
        <h3>原進貨資訊</h3>
        <dl className="purchase-facts">
          <div>
            <dt>進貨單號</dt>
            <dd>{order.number}</dd>
          </div>
          <div>
            <dt>供應商</dt>
            <dd>{order.supplier}</dd>
          </div>
          <div>
            <dt>收貨日期／倉別</dt>
            <dd>
              {order.date} · {order.warehouse}
            </dd>
          </div>
          <div>
            <dt>原始進貨金額</dt>
            <dd>{currency(originalAmount(order))}</dd>
          </div>
        </dl>
      </section>
      <section>
        <h3>發票與金額核對</h3>
        <div className="items-form-grid">
          <Field name="settlement-invoice" label="發票號碼">
            <BaseInput
              value={draft.invoice}
              onChange={(e) => setDraft({ ...draft, invoice: e.target.value })}
              placeholder="例如 AB12345678（選填）"
            />
          </Field>
          <Field name="settlement-invoice-date" label="發票日期" required>
            <BaseInput
              type="date"
              value={draft.invoiceDate}
              onChange={(e) =>
                setDraft({ ...draft, invoiceDate: e.target.value })
              }
            />
          </Field>
          <Field name="settlement-tax" label="稅別" required>
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
          <Field name="settlement-amount" label="實際核對金額" required>
            <BaseInput
              type="number"
              min="0"
              step="0.01"
              value={draft.amount}
              onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
            />
          </Field>
          <Field
            name="settlement-accounting-date"
            label="帳務歸屬日期"
            required
          >
            <BaseInput
              type="date"
              value={draft.accountingDate}
              onChange={(e) =>
                setDraft({ ...draft, accountingDate: e.target.value })
              }
            />
          </Field>
          <Field
            name="settlement-difference"
            label="差異原因"
            required={!!difference}
            hint={`與原始金額差異：${currency(Number.isFinite(difference) ? difference : 0)}`}
          >
            <BaseInput
              value={draft.differenceReason}
              onChange={(e) =>
                setDraft({ ...draft, differenceReason: e.target.value })
              }
            />
          </Field>
          <Field name="settlement-remark" label="核對備註">
            <BaseTextarea
              rows={3}
              value={draft.remark}
              onChange={(e) => setDraft({ ...draft, remark: e.target.value })}
            />
          </Field>
        </div>
      </section>
      <p className="purchase-callout">
        核對結帳只表示發票與金額已核對，不代表已付款；本次操作不再次入庫，也不覆蓋原始進貨金額。
      </p>
    </PurchaseForm>
  );
}
