import { useState } from "react";
import { BaseInput } from "@/components/ui/BaseInput";
import {
  BaseNativeSelect,
  BaseNativeSelectOption as Option,
} from "@/components/ui/BaseNativeSelect";
import { Field, PurchaseForm } from "./FormParts";
import { currency } from "./model";
import type { PurchaseRecord } from "@/types/purchases";
export function ResolutionForm({
  record,
  onCancel,
  onDirty,
  onSubmit,
}: {
  record: PurchaseRecord;
  onCancel: () => void;
  onDirty: () => void;
  onSubmit: (value: {
    amount: string;
    reference: string;
    resolution: string;
  }) => void;
}) {
  const [draft, setDraft] = useState({
    amount: record.resolutionAmount,
    reference: record.reference,
    resolution: record.resolution,
  });
  return (
    <PurchaseForm
      onCancel={onCancel}
      onDirty={onDirty}
      submitText="確認帳務處理完成"
      submit={() => {
        if (draft.resolution === "待確認")
          return {
            message: "請先確認實際處理方式。",
            field: "resolution-type",
          };
        if (
          draft.amount !== "" &&
          (!Number.isFinite(Number(draft.amount)) || Number(draft.amount) < 0)
        )
          return {
            message: "供應商確認金額不可為負數。",
            field: "resolution-amount",
          };
        onSubmit(draft);
      }}
    >
      <section>
        <h3>帳務處理結果</h3>
        <p>
          {record.number} · {record.reason}
        </p>
        <p>
          原成本／更正金額：<strong>{currency(record.amount)}</strong>
        </p>
        <div className="items-form-grid">
          <Field name="resolution-type" label="實際處理方式" required>
            <BaseNativeSelect
              value={draft.resolution}
              onChange={(e) =>
                setDraft({ ...draft, resolution: e.target.value })
              }
            >
              {(record.kind === "return"
                ? ["折讓", "退款", "換貨", "待確認"]
                : ["補貨", "折讓", "退款", "補收", "待確認"]
              ).map((r) => (
                <Option key={r}>{r}</Option>
              ))}
            </BaseNativeSelect>
          </Field>
          <Field
            name="resolution-amount"
            label="供應商確認金額"
            required={!["換貨", "補貨"].includes(draft.resolution)}
            hint="與原成本金額分開保留，請人工確認。"
          >
            <BaseInput
              type="number"
              min="0"
              step="0.01"
              value={draft.amount}
              onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
            />
          </Field>
          <Field
            name="resolution-reference"
            label="折讓／退款／換貨相關單號"
            required
          >
            <BaseInput
              value={draft.reference}
              onChange={(e) =>
                setDraft({ ...draft, reference: e.target.value })
              }
            />
          </Field>
        </div>
      </section>
      <p className="purchase-callout">
        此處僅記錄供應商與財務的確認結果，不會執行付款或覆蓋原進貨、核對紀錄。
      </p>
    </PurchaseForm>
  );
}
