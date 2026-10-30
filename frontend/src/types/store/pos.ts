import type { CartLine, Customer, PaymentMethod } from "@/types/pos";

export interface CheckoutInput {
  requestId: string;
  cart: CartLine[];
  orderDiscount: number;
  warehouse: string;
  customer: Customer;
  seller: string;
  sellerTaxId?: string;
  receiptType: string;
  remark: string;
  method: PaymentMethod;
  received: number;
  reference: string;
  prescription: boolean;
  sellerConfirmed: boolean;
  authorized: boolean;
}

export interface ReturnInput {
  authorized: boolean;
  saleId: string;
  requestId: string;
  date: string;
  reason: string;
  method: PaymentMethod;
  quantities: Record<string, number>;
  disposition: "可售回庫" | "不可售";
  professional: boolean;
  confirmed: boolean;
}
