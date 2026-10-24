import { useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { BaseInput } from "@/components/ui/BaseInput";
import {
  BaseNativeSelect,
  BaseNativeSelectOption as Option,
} from "@/components/ui/BaseNativeSelect";
import { Field, PurchaseForm } from "./FormParts";
import { currency } from "./model";
import { taipeiToday, usageStatus } from "@/features/items/model";
import type {
  ExchangeReceipt,
  Purchase,
  PurchaseRecord,
} from "@/types/purchases";
export function ResolutionForm({
  record,
  order,
  onCancel,
  onDirty,
  onSubmit,
}: {
  record: PurchaseRecord;
  order: Purchase;
  onCancel: () => void;
  onDirty: () => void;
  onSubmit: (value: {
    amount: string;
    reference: string;
    resolution: string;
    exchangeReceipt?: ExchangeReceipt;
  }) => void;
}) {
  const items = useAppSelector((state) => state.items.items).filter(
    (item) => usageStatus(item) === "使用中",
  );
  const returnedLine = order.lines.find(
    (line) => line.id === record.lines[0]?.lineId,
  );
  const [receipt, setReceipt] = useState<ExchangeReceipt>(
    () =>
      record.exchangeReceipt || {
        date: taipeiToday(),
        itemId: "",
        code: "",
        name: "",
        specification: "",
        unit: "",
        quantity: record.lines.reduce(
          (sum, line) => sum - line.quantityChange,
          0,
        ),
        batch: "",
        expiry: "",
        warehouse: order.warehouse,
      },
  );
  const [draft, setDraft] = useState({
    amount: record.resolutionAmount,
    reference: record.reference,
    resolution: record.resolution,
  });
  const referenceLabel =
    draft.resolution === "換貨"
      ? "供應商換貨單號"
      : draft.resolution === "退款"
        ? "退款憑證／交易序號"
        : draft.resolution === "折讓"
          ? "折讓單號"
          : draft.resolution === "補貨"
            ? "供應商補貨單號"
            : draft.resolution === "補收"
              ? "補收憑證號碼"
              : "供應商相關單號";
  return (
    <PurchaseForm
      onCancel={onCancel}
      onDirty={onDirty}
      submitText={
        record.kind === "return" && draft.resolution === "換貨"
          ? "確認換貨收貨"
          : "確認帳務處理完成"
      }
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
        if (record.kind === "return" && draft.resolution === "換貨") {
          if (!receipt.itemId)
            return { message: "請選擇換入商品。", field: "exchange-item" };
          if (!Number.isFinite(receipt.quantity) || receipt.quantity <= 0)
            return {
              message: "請輸入有效換入數量。",
              field: "exchange-quantity",
            };
          if (!receipt.date)
            return { message: "請填寫換貨收貨日期。", field: "exchange-date" };
          if (
            items.find((item) => item.id === receipt.itemId)?.trackBatch &&
            !receipt.batch.trim()
          )
            return {
              message: "此品項需填寫換入批號。",
              field: "exchange-batch",
            };
          if (
            items.find((item) => item.id === receipt.itemId)?.trackExpiry &&
            !receipt.expiry
          )
            return {
              message: "此品項需填寫換入效期。",
              field: "exchange-expiry",
            };
        }
        onSubmit({
          ...draft,
          exchangeReceipt:
            record.kind === "return" && draft.resolution === "換貨"
              ? receipt
              : undefined,
        });
      }}
    >
      <section>
        <h3>
          {draft.resolution === "換貨" ? "換貨收貨與處理結果" : "帳務處理結果"}
        </h3>
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
            label={referenceLabel}
            hint={`可用掃碼器輸入或貼上單號；若沒有外部單號，可留白（內部追蹤單號：${record.number}）。`}
          >
            <BaseInput
              value={draft.reference}
              onChange={(e) =>
                setDraft({ ...draft, reference: e.target.value })
              }
            />
          </Field>
        </div>
        {record.kind === "return" && draft.resolution === "換貨" && (
          <section
            className="purchase-exchange-receipt"
            aria-label="換貨收貨資料"
          >
            <h3>換貨收貨資料</h3>
            <p>
              原退貨品項：{returnedLine?.name || "—"}
              ；請登錄實際收到的替換商品。收貨資料只作展示記錄，不會增加庫存。
            </p>
            <div className="items-form-grid">
              <Field name="exchange-date" label="換貨收貨日期" required>
                <BaseInput
                  type="date"
                  value={receipt.date}
                  onChange={(e) =>
                    setReceipt({ ...receipt, date: e.target.value })
                  }
                />
              </Field>
              <Field name="exchange-item" label="換入商品" required>
                <BaseNativeSelect
                  value={receipt.itemId}
                  onChange={(e) => {
                    const item = items.find(
                      (candidate) => candidate.id === e.target.value,
                    );
                    setReceipt({
                      ...receipt,
                      itemId: item?.id || "",
                      code: item?.code || "",
                      name: item?.name || "",
                      specification: item?.specification || "",
                      unit: item?.unit || "",
                    });
                  }}
                >
                  <Option value="">請選擇實際換入商品</Option>
                  {items.map((item) => (
                    <Option key={item.id} value={item.id}>
                      {item.code} · {item.name}（{item.unit}）
                    </Option>
                  ))}
                </BaseNativeSelect>
              </Field>
              <Field name="exchange-quantity" label="換入數量" required>
                <BaseInput
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={receipt.quantity || ""}
                  onChange={(e) =>
                    setReceipt({
                      ...receipt,
                      quantity: Number(e.target.value),
                    })
                  }
                />
              </Field>
              <Field
                name="exchange-batch"
                label="換入批號"
                required={
                  !!items.find((item) => item.id === receipt.itemId)?.trackBatch
                }
              >
                <BaseInput
                  value={receipt.batch}
                  onChange={(e) =>
                    setReceipt({ ...receipt, batch: e.target.value })
                  }
                />
              </Field>
              <Field
                name="exchange-expiry"
                label="換入效期"
                required={
                  !!items.find((item) => item.id === receipt.itemId)
                    ?.trackExpiry
                }
              >
                <BaseInput
                  type="date"
                  value={receipt.expiry}
                  onChange={(e) =>
                    setReceipt({ ...receipt, expiry: e.target.value })
                  }
                />
              </Field>
              <Field name="exchange-warehouse" label="收貨倉別" required>
                <BaseInput value={receipt.warehouse} readOnly />
              </Field>
            </div>
          </section>
        )}
      </section>
      <p className="purchase-callout">
        此處僅記錄供應商與財務的確認結果，不會執行付款或覆蓋原進貨、核對紀錄。
      </p>
    </PurchaseForm>
  );
}
