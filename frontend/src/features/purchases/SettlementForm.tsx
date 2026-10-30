import { BaseTextarea } from "@/components/ui/BaseTextarea";
import { useState } from "react";
import { BaseInput } from "@/components/ui/BaseInput";
import { taipeiToday } from "@/features/items/model";
import { Field, PurchaseForm } from "./FormParts";
import {
  currency,
  rounded,
  reconciliationAmounts,
  reversalStatus,
} from "./model";
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
  const amounts = reconciliationAmounts(order);
  const [draft, setDraft] = useState({
    amount: String(amounts.reference),
    accountingDate: taipeiToday(),
    remark: "",
  });
  const amount = Number(draft.amount);
  const validAmount =
    draft.amount.trim() !== "" &&
    Number.isFinite(amount) &&
    amount >= 0 &&
    Math.abs(amount * 100 - Math.round(amount * 100)) < 0.000001;
  const difference = validAmount ? rounded(amount - amounts.reference) : null;
  const hasDifference = difference !== null && difference !== 0;
  return (
    <PurchaseForm
      onCancel={onCancel}
      onDirty={onDirty}
      submitText="下一步：確認內容"
      submit={() => {
        if (reversalStatus(order) === "全部沖銷")
          return { message: "此單據已全部沖銷，無需核對。" };
        if (!validAmount)
          return {
            message: "請輸入有效核對金額，不可為負數，最多小數 2 位。",
            field: "settlement-amount",
          };
        onSubmit({
          ...draft,
          amount,
          differenceReason: hasDifference ? draft.remark.trim() : "",
        });
      }}
    >
      <div className="purchase-settlement-context">
        <span>收貨日期 {order.date}</span>
        <span>入庫倉別 {order.warehouse}</span>
      </div>
      <section>
        <h3>金額核對</h3>
        <dl className="purchase-facts" aria-label="核對金額組成">
          <div>
            <dt>原始進貨金額</dt>
            <dd>{currency(amounts.original)}</dd>
          </div>
          <div>
            <dt>沖銷金額</dt>
            <dd>− {currency(amounts.reversal)}</dd>
          </div>
          <div>
            <dt>退貨金額（原成本）</dt>
            <dd>− {currency(amounts.returns)}</dd>
          </div>
          <div>
            <dt>應核對參考金額</dt>
            <dd>{currency(amounts.reference)}</dd>
          </div>
        </dl>
        <p className="items-note">
          參考金額依原成本扣除沖銷與退貨；供應商實際折讓或退款不同時，請調整核對金額，可於核對備註補充說明。
        </p>
        <div className="purchase-settlement-amounts">
          <div>
            <span className="purchase-amount-label">應核對參考金額</span>
            <strong>{currency(amounts.reference)}</strong>
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
                  ? "與應核對參考金額相同"
                  : difference > 0
                    ? "高於應核對參考金額"
                    : "低於應核對參考金額"}
            </small>
          </div>
        </div>
      </section>
      <section>
        <h3>帳務資料</h3>
        <div className="items-form-grid">
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
