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
import { usePosDraft } from "./usePosDraft";
import { cents, money, paymentMethods, policyFor, priceCart } from "./model";
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
  const dispatch = useAppDispatch();
  const state = useAppSelector((root) => root.pos);
  const items = useAppSelector((root) => root.items.items);
  const priced = priceCart(cart, orderDiscount);
  const [method, setMethod] = usePosDraft("paymentMethod");
  const [reference, setReference] = useState("");
  const [remark, setRemark] = useState("");
  const [prescription, setPrescription] = useState(false);
  const requestId = useRef(crypto.randomUUID());
  const submitted = useRef(false);
  const policies = cart.map((line) => {
    const item = items.find((row) => row.id === line.itemId)!;
    return state.policies[item.id] || policyFor(item);
  });
  const itemTotal =
    cart.reduce(
      (sum, line) => sum + (line.gift ? 0 : cents(line.quantity * line.price)),
      0,
    ) / 100;
  const discountTotal =
    (cart.reduce(
      (sum, line) => sum + (line.gift ? 0 : cents(line.discount)),
      0,
    ) +
      cents(orderDiscount)) /
    100;
  return (
    <BaseForm
      submitText="確認完成結帳"
      onCancel={onCancel}
      onDirty={onDirty}
      submit={() => {
        if (submitted.current) return;
        const result = dispatch(
          checkoutPos({
            requestId: requestId.current,
            cart,
            orderDiscount,
            customer,
            warehouse,
            seller: "示範商行",
            sellerTaxId: "",
            receiptType: "一般銷售憑證",
            remark,
            method,
            received: priced.total,
            reference: method === "現金" ? "" : reference,
            prescription,
            sellerConfirmed: true,
            authorized,
          }),
        );
        if (result.error) return { message: result.error };
        submitted.current = true;
        onSuccess(result.saleId!);
      }}
    >
      <div className="pos-payment-confirmation">
        <section className="pos-payment-total" aria-label="結帳金額">
          <div className="pos-payment-context">
            <span>{customer.name}</span>
            <span>{cart.length} 項商品</span>
            {cart.some((line) => line.gift) && (
              <span>
                含 {cart.filter((line) => line.gift).length} 項贈送商品（0 元）
              </span>
            )}
          </div>
          <p>應收金額</p>
          <strong>{money(priced.total)}</strong>
          {discountTotal > 0 && (
            <div className="pos-payment-breakdown">
              <span>商品金額 {money(itemTotal)}</span>
              <span>折扣 −{money(discountTotal)}</span>
            </div>
          )}
        </section>
        <section className="pos-payment-fields" aria-label="付款資訊">
          <Field name="checkout-method" label="付款方式" required>
            <Select
              value={method}
              onChange={(event) => {
                setMethod(event.target.value as PaymentMethod);
                setReference("");
              }}
            >
              {paymentMethods.map((value) => (
                <Option key={value} value={value}>
                  {value}
                </Option>
              ))}
            </Select>
          </Field>
          {method !== "現金" && (
            <>
              <Field name="checkout-reference" label="付款參考號碼（選填）">
                <BaseInput
                  value={reference}
                  maxLength={100}
                  placeholder="交易序號或轉帳末碼"
                  onChange={(event) => setReference(event.target.value)}
                />
              </Field>
            </>
          )}
          {policies.some((policy) => policy.prescription) && (
            <BaseCheckField
              label="已完成處方與調劑流程確認（展示）"
              checked={prescription}
              onChange={setPrescription}
            />
          )}
          <details className="pos-payment-remark">
            <summary>備註（選填）</summary>
            <Field name="checkout-remark" label="銷售備註">
              <BaseTextarea
                rows={2}
                value={remark}
                maxLength={300}
                placeholder="補充本筆交易事項"
                onChange={(event) => setRemark(event.target.value)}
              />
            </Field>
          </details>
        </section>
      </div>
    </BaseForm>
  );
}
