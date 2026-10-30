import { useState } from "react";
import { BaseInput } from "@/components/ui/BaseInput";
import {
  BaseNativeSelect,
  BaseNativeSelectOption,
} from "@/components/ui/BaseNativeSelect";
import type { Purchase, PurchaseInvoice } from "@/types/purchases";
import { Field, PurchaseForm } from "./FormParts";

export function PurchaseInvoiceFields({
  value,
  onChange,
}: {
  value: PurchaseInvoice;
  onChange: (value: PurchaseInvoice) => void;
}) {
  return (
    <section>
      <h3>出貨與發票資料</h3>
      <div className="items-form-grid">
        <Field name="purchase-supplier-shipping-date" label="廠商出貨日期">
          <BaseInput
            type="date"
            value={value.supplierShippingDate}
            onChange={(e) =>
              onChange({ ...value, supplierShippingDate: e.target.value })
            }
          />
        </Field>
        <Field name="purchase-invoice" label="發票號碼">
          <BaseInput
            value={value.invoice}
            placeholder="例如 AB12345678（選填）"
            onChange={(e) => onChange({ ...value, invoice: e.target.value })}
          />
        </Field>
        <Field
          name="purchase-invoice-date"
          label="發票日期"
          required
          hint="預設今天，請依發票日期調整。"
        >
          <BaseInput
            type="date"
            value={value.invoiceDate}
            onChange={(e) =>
              onChange({ ...value, invoiceDate: e.target.value })
            }
          />
        </Field>
        <Field name="purchase-tax" label="稅別" required>
          <BaseNativeSelect
            value={value.tax}
            onChange={(e) => onChange({ ...value, tax: e.target.value })}
          >
            <BaseNativeSelectOption value="">請選擇稅別</BaseNativeSelectOption>
            {["應稅", "免稅", "零稅率"].map((tax) => (
              <BaseNativeSelectOption key={tax}>{tax}</BaseNativeSelectOption>
            ))}
          </BaseNativeSelect>
        </Field>
      </div>
    </section>
  );
}

export function PurchaseInvoiceEditor({
  order,
  onCancel,
  onDirty,
  onSubmit,
}: {
  order: Purchase;
  onCancel: () => void;
  onDirty: () => void;
  onSubmit: (value: PurchaseInvoice) => void;
}) {
  const [value, setValue] = useState<PurchaseInvoice>({
    supplierShippingDate: order.supplierShippingDate,
    invoice: order.invoice,
    invoiceDate: order.invoiceDate,
    tax: order.tax,
  });
  return (
    <PurchaseForm
      onCancel={onCancel}
      onDirty={onDirty}
      submitText="下一步：確認內容"
      submit={() => {
        onSubmit({ ...value, invoice: value.invoice.trim() });
      }}
    >
      <PurchaseInvoiceFields value={value} onChange={setValue} />
    </PurchaseForm>
  );
}
