import { useRef, useState } from "react";
import { BaseForm, BaseField as Field } from "@/components/ui/BaseForm";
import { BaseInput } from "@/components/ui/BaseInput";
import { BaseTextarea } from "@/components/ui/BaseTextarea";
import {
  BaseNativeSelect as Select,
  BaseNativeSelectOption as Option,
} from "@/components/ui/BaseNativeSelect";
import { BaseCheckField } from "@/components/ui/BaseCheckField";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { checkoutPos } from "@/store/pos";
import {
  allocate,
  cents,
  money,
  paymentMethods,
  policyFor,
  priceCart,
  qty,
} from "./model";
import type { CartLine, Customer, PaymentMethod } from "@/types/pos";

export function CheckoutForm({
  cart,
  orderDiscount,
  customer,
  warehouse,
  authorized,
  onCancel,
  onDirty,
  onSuccess,
}: {
  cart: CartLine[];
  orderDiscount: number;
  customer: Customer;
  warehouse: string;
  authorized: boolean;
  onCancel: () => void;
  onDirty: () => void;
  onSuccess: (id: string) => void;
}) {
  const dispatch = useAppDispatch(),
    state = useAppSelector((root) => root.pos),
    items = useAppSelector((root) => root.items.items);
  const priced = priceCart(cart, orderDiscount);
  const [method, setMethod] = useState<PaymentMethod>("現金"),
    [received, setReceived] = useState(String(priced.total));
  const [reference, setReference] = useState(""),
    [seller, setSeller] = useState("示範商行"),
    [sellerTaxId, setSellerTaxId] = useState(""),
    [receiptType, setReceiptType] = useState("一般銷售憑證"),
    [remark, setRemark] = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false),
    [professional, setProfessional] = useState(false),
    [prescription, setPrescription] = useState(false),
    [sellerConfirmed, setSellerConfirmed] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false),
    [awaitingRetry, setAwaitingRetry] = useState(false);
  const requestId = useRef(crypto.randomUUID()),
    submitted = useRef(false);
  const policies = cart.map((line) => {
    const item = items.find((row) => row.id === line.itemId)!;
    return state.policies[item.id] || policyFor(item);
  });
  const quantities = cart.reduce<Record<string, number>>((totals, line) => {
    const unit = items.find((item) => item.id === line.itemId)!.unit;
    totals[unit] = qty((totals[unit] || 0) + line.quantity);
    return totals;
  }, {});
  const originalTotal =
    cart.reduce(
      (total, line, index) =>
        total + cents(line.quantity * policies[index].price),
      0,
    ) / 100;
  return (
    <BaseForm
      submitText={awaitingRetry ? "以相同交易識別碼重試" : "確認完成結帳"}
      onCancel={onCancel}
      onDirty={onDirty}
      submit={() => {
        if (submitted.current) return;
        if (simulateFailure && !awaitingRetry) {
          setAwaitingRetry(true);
          return {
            message: `展示：外部已收款但本地提交失敗。勿重刷或重收，請保留識別碼 ${requestId.current} 並以同一識別碼重試。`,
          };
        }
        const result = dispatch(
          checkoutPos({
            requestId: requestId.current,
            cart,
            orderDiscount,
            customer,
            warehouse,
            seller,
            sellerTaxId,
            receiptType,
            remark,
            method,
            received: Number(received),
            reference,
            paymentConfirmed,
            professional,
            prescription,
            sellerConfirmed,
            authorized,
          }),
        );
        if (result.error) return { message: result.error };
        submitted.current = true;
        onSuccess(result.saleId!);
      }}
    >
      <section>
        <h3>交易摘要</h3>
        <p>
          {customer.name}　{customer.phone || "未提供電話"} ／ {warehouse}
        </p>
        <p>
          {cart.length} 項商品，商品小計 {money(priced.subtotal)}，整單折扣{" "}
          {money(orderDiscount)}
        </p>
        <strong className="pos-total">應收 {money(priced.total)}</strong>
        <p>
          商品數量：
          {Object.entries(quantities)
            .map(([unit, count]) => `${count} ${unit}`)
            .join(" ／ ")}
          （依單位分列）
        </p>
        <p>
          商品原價總額 {money(originalTotal)}；成交價調整與單品折扣後小計{" "}
          {money(priced.subtotal)}
        </p>
        <details>
          <summary>出庫批次與明細折扣分攤</summary>
          {priced.priced.map((line) => {
            const item = items.find((row) => row.id === line.itemId)!;
            const allocations = allocate(
              state.batches,
              item,
              warehouse,
              line.quantity,
              line.batchId,
            );
            return (
              <p key={item.id}>
                {item.name} {line.quantity} {item.unit} ／ 單品折扣{" "}
                {money(line.discount)} ／ 整單分攤 {money(line.orderShare)} ／
                淨額 {money(line.net)}
                <br />
                {allocations
                  ?.map(
                    (allocation) =>
                      `${allocation.batchNumber || "無批號"} ${allocation.quantity} ${item.unit}`,
                  )
                  .join("、") || "可用批次不足"}
              </p>
            );
          })}
        </details>
      </section>
      <section>
        <h3>付款資訊</h3>
        <div className="pos-form-grid">
          <Field name="checkout-method" label="付款方式" required>
            <Select
              value={method}
              onChange={(event) => {
                setMethod(event.target.value as PaymentMethod);
                setPaymentConfirmed(false);
              }}
            >
              {paymentMethods.map((value) => (
                <Option key={value} value={value}>
                  {value}
                </Option>
              ))}
            </Select>
          </Field>
          {method === "現金" ? (
            <Field name="checkout-received" label="實收金額" required>
              <BaseInput
                type="number"
                min="0"
                step="0.01"
                value={received}
                onChange={(event) => setReceived(event.target.value)}
              />
            </Field>
          ) : (
            <Field name="checkout-reference" label="付款參考號碼">
              <BaseInput
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                maxLength={100}
              />
            </Field>
          )}
        </div>
        {method === "現金" ? (
          <p>找零：{money(Math.max(0, Number(received) - priced.total))}</p>
        ) : (
          <BaseCheckField
            label="已確認外部付款成功（展示）"
            checked={paymentConfirmed}
            onChange={setPaymentConfirmed}
          />
        )}
      </section>
      <section>
        <h3>銷售主體與單據</h3>
        <div className="pos-form-grid">
          <Field name="checkout-seller" label="銷售主體" required>
            <Select
              value={seller}
              onChange={(event) => {
                setSeller(event.target.value);
                setSellerConfirmed(false);
              }}
            >
              <Option value="示範商行">示範商行</Option>
              <Option value="晴明診所（展示）">晴明診所（展示）</Option>
            </Select>
          </Field>
          <Field name="checkout-receipt" label="單據類型">
            <Select
              value={receiptType}
              onChange={(event) => setReceiptType(event.target.value)}
            >
              <Option>一般銷售憑證</Option>
              <Option>統一發票（待串接）</Option>
              <Option>免用統一發票收據（資格待確認）</Option>
            </Select>
          </Field>
        </div>
        <p>目前僅列印展示交易憑證，發票狀態為未開立；未串接發票服務。</p>
        <Field
          name="checkout-seller-tax"
          label="銷售主體統一編號"
          hint="如適用請輸入 8 位數字；展示資料不開立正式發票。"
        >
          <BaseInput
            value={sellerTaxId}
            maxLength={8}
            inputMode="numeric"
            onChange={(event) => setSellerTaxId(event.target.value)}
          />
        </Field>
        <BaseCheckField
          label="已確認銷售主體具備該品項及單據資格（展示）"
          checked={sellerConfirmed}
          onChange={setSellerConfirmed}
        />
        {policies.some((policy) => policy.prescription) && (
          <BaseCheckField
            label="已完成處方與調劑流程確認（展示）"
            checked={prescription}
            onChange={setPrescription}
          />
        )}
        {policies.some((policy) => policy.professional) && (
          <BaseCheckField
            label="已由專業人員確認藥品銷售（展示）"
            checked={professional}
            onChange={setProfessional}
          />
        )}
        <Field name="checkout-remark" label="銷售備註">
          <BaseTextarea
            value={remark}
            maxLength={300}
            onChange={(event) => setRemark(event.target.value)}
          />
        </Field>
      </section>
      <details>
        <summary>展示失敗與安全重試</summary>
        <BaseCheckField
          label="模擬外部已收款、本地提交失敗一次"
          checked={simulateFailure}
          disabled={awaitingRetry}
          onChange={setSimulateFailure}
        />
        <small>交易識別碼：{requestId.current}</small>
      </details>
    </BaseForm>
  );
}
