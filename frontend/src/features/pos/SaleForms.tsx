import { useRef, useState } from "react";
import { BaseForm, BaseField as Field } from "@/components/ui/BaseForm";
import { BaseInput } from "@/components/ui/BaseInput";
import { BaseTextarea } from "@/components/ui/BaseTextarea";
import { BaseButton } from "@/components/ui/BaseButton";
import {
  BaseNativeSelect as Select,
  BaseNativeSelectOption as Option,
} from "@/components/ui/BaseNativeSelect";
import { BaseCheckField } from "@/components/ui/BaseCheckField";
import { useAppDispatch } from "@/store/hooks";
import { returnPos, refundPos, voidPos } from "@/store/pos";
import { taipeiToday } from "@/features/items/model";
import {
  cents,
  money,
  paymentMethods,
  returnAmount,
  returnedQuantity,
  qty,
} from "./model";
import type { PaymentMethod, Sale, SaleRefund } from "@/types/pos";
type Callbacks = {
  sale: Sale;
  onCancel: () => void;
  onDirty: () => void;
  onDone: () => void;
  authorized: boolean;
};
export function SaleReturnForm({
  sale,
  onCancel,
  onDirty,
  onDone,
  authorized,
}: Callbacks) {
  const dispatch = useAppDispatch(),
    requestId = useRef(crypto.randomUUID()),
    submitted = useRef(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({}),
    [reason, setReason] = useState(""),
    [date, setDate] = useState(taipeiToday());
  const [method, setMethod] = useState<PaymentMethod>(sale.payment.method),
    [disposition, setDisposition] = useState<"可售回庫" | "不可售">("不可售"),
    [confirmed, setConfirmed] = useState(false),
    [professional, setProfessional] = useState(false);
  const amount =
    sale.lines.reduce(
      (sum, line) =>
        sum +
        cents(
          returnAmount(
            sale,
            line,
            Math.max(
              0,
              Math.min(
                qty(line.quantity - returnedQuantity(sale, line.id)),
                Number(quantities[line.id]) || 0,
              ),
            ),
          ),
        ),
      0,
    ) / 100;
  return (
    <BaseForm
      submitText="建立退貨與待退款紀錄"
      onCancel={onCancel}
      onDirty={onDirty}
      submit={() => {
        if (submitted.current) return;
        if (!authorized) return { message: "退貨需主管展示授權。" };
        const result = dispatch(
          returnPos({
            authorized,
            saleId: sale.id,
            requestId: requestId.current,
            date,
            reason,
            method,
            quantities,
            disposition,
            professional,
            confirmed,
          }),
        );
        if (result.error) return { message: result.error };
        submitted.current = true;
        onDone();
      }}
    >
      <div className="pos-operation-summary">
        <div>
          <span>{sale.number}</span>
          <small>
            {sale.customer.name}・原成交 {money(sale.total)}
          </small>
        </div>
        <div>
          <span>本次應退</span>
          <strong>{money(amount)}</strong>
        </div>
      </div>
      <section className="pos-return-editor">
        <div className="pos-return-tools">
          <h3>退貨品項</h3>
          <BaseButton
            type="button"
            variant="outline"
            onClick={() => {
              setQuantities(
                Object.fromEntries(
                  sale.lines.map((line) => [
                    line.id,
                    qty(line.quantity - returnedQuantity(sale, line.id)),
                  ]),
                ),
              );
              onDirty();
            }}
          >
            全部可退數量
          </BaseButton>
        </div>
        <p className="pos-operation-note">
          退款依原成交與折扣計算，可辦理部分或全部退貨。
        </p>
        {sale.lines.map((line) => (
          <div className="pos-return-line" key={line.id}>
            <strong>
              {line.name}（{line.specification}）
            </strong>
            <p>
              原銷售 {line.quantity} {line.unit}，已退{" "}
              {returnedQuantity(sale, line.id)} {line.unit}，可退{" "}
              {qty(line.quantity - returnedQuantity(sale, line.id))} {line.unit}
            </p>
            <Field
              name={`return-${line.id}`}
              label={`${line.name}本次退貨數量`}
            >
              <BaseInput
                type="number"
                min="0"
                step="0.001"
                max={qty(line.quantity - returnedQuantity(sale, line.id))}
                disabled={line.quantity <= returnedQuantity(sale, line.id)}
                value={quantities[line.id] || 0}
                onChange={(event) =>
                  setQuantities({
                    ...quantities,
                    [line.id]: Number(event.target.value),
                  })
                }
              />
            </Field>
          </div>
        ))}
      </section>
      <section>
        <h3>退貨處置與退款</h3>
        <div className="pos-form-grid">
          <Field name="return-date" label="退貨日期" required>
            <BaseInput
              type="date"
              min={sale.date.slice(0, 10)}
              max={taipeiToday()}
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </Field>
          <Field name="return-method" label="退款方式" required>
            <Select
              value={method}
              onChange={(event) =>
                setMethod(event.target.value as PaymentMethod)
              }
            >
              {paymentMethods.map((value) => (
                <Option key={value}>{value}</Option>
              ))}
            </Select>
          </Field>
          <Field name="return-disposition" label="商品處理方式" required>
            <Select
              value={disposition}
              onChange={(event) => {
                setDisposition(event.target.value as typeof disposition);
                setConfirmed(false);
              }}
            >
              <Option>不可售</Option>
              <Option>可售回庫</Option>
            </Select>
          </Field>
        </div>
        <Field name="return-reason" label="退貨原因" required>
          <BaseTextarea
            value={reason}
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
        <p>
          本次應退款 {money(amount)}
          ；建立退貨只會產生「待退款」，需另由財務確認已退款。
        </p>
        <BaseCheckField
          label={
            disposition === "可售回庫"
              ? "已收到退貨，確認商品狀態可售並回庫（展示）"
              : "已收到實體退貨，確認不可售且不增加可用庫存（展示）"
          }
          checked={confirmed}
          onChange={setConfirmed}
        />
        {disposition === "可售回庫" && (
          <>
            <p>
              系統會依原交易處理回庫；無法核對時，請改列不可售並交由庫存管理處理。
            </p>
            {sale.lines.some(
              (line) => line.medicine && quantities[line.id] > 0,
            ) && (
              <BaseCheckField
                label="藥品退回可售庫存已由專業人員確認（展示）"
                checked={professional}
                onChange={setProfessional}
              />
            )}
          </>
        )}
      </section>
    </BaseForm>
  );
}
export function SaleVoidForm({
  sale,
  onCancel,
  onDirty,
  onDone,
  authorized,
}: Callbacks) {
  const dispatch = useAppDispatch(),
    [reason, setReason] = useState(""),
    [notDelivered, setNotDelivered] = useState(false);
  const submitted = useRef(false);
  return (
    <BaseForm
      submitText="確認作廢並建立待退款"
      submitVariant="destructive"
      onCancel={onCancel}
      onDirty={onDirty}
      submit={() => {
        if (submitted.current) return;
        const result = dispatch(
          voidPos({ saleId: sale.id, reason, notDelivered, authorized }),
        );
        if (result.error) return { message: result.error };
        submitted.current = true;
        onDone();
      }}
    >
      <div className="pos-operation-summary">
        <div>
          <span>{sale.number}</span>
          <small>
            {sale.customer.name}・{sale.lines.length} 項商品
          </small>
        </div>
        <div>
          <span>作廢應退</span>
          <strong>{money(sale.total)}</strong>
        </div>
      </div>
      <section>
        <p>
          適用於輸入錯誤、商品尚未交付的整筆交易。作廢會回復庫存並保留原單；退款需另外確認完成。
        </p>
        <Field name="void-reason" label="作廢原因" required>
          <BaseTextarea
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
        <BaseCheckField
          label="確認商品未交付，符合錯誤交易作廢條件（展示）"
          checked={notDelivered}
          onChange={setNotDelivered}
        />
      </section>
    </BaseForm>
  );
}
export function SaleRefundForm({
  sale,
  refund,
  onCancel,
  onDirty,
  onDone,
  authorized,
}: Callbacks & { refund: SaleRefund }) {
  const dispatch = useAppDispatch(),
    [reference, setReference] = useState(""),
    [confirmed, setConfirmed] = useState(false);
  return (
    <BaseForm
      submitText="確認退款完成"
      onCancel={onCancel}
      onDirty={onDirty}
      submit={() => {
        const result = dispatch(
          refundPos({
            saleId: sale.id,
            refundId: refund.id,
            reference,
            confirmed,
            authorized,
          }),
        );
        if (result.error) return { message: result.error };
        onDone();
      }}
    >
      <section>
        <h3>
          {sale.number}　{money(refund.amount)}
        </h3>
        <p>
          來源 {refund.sourceId} ／ 退款方式 {refund.method} ／ 目前{" "}
          {refund.status}
        </p>
        <Field
          name="refund-reference"
          label="退款參考號碼"
          required={refund.method !== "現金"}
        >
          <BaseInput
            value={reference}
            maxLength={100}
            onChange={(event) => setReference(event.target.value)}
          />
        </Field>
        <BaseCheckField
          label="已由財務確認實際退款成功（展示）"
          checked={confirmed}
          onChange={setConfirmed}
        />
        <p>儲存後記錄退款人員與時間，才列入已退款金額。</p>
      </section>
    </BaseForm>
  );
}
