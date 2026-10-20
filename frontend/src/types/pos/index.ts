import type { InventoryBatch } from "@/types/items";
import type { paymentMethods } from "@/features/pos/model";

export type PaymentMethod = (typeof paymentMethods)[number];

export interface PosPolicy {
  sellable: boolean;
  price: number;
  favorite: boolean;
  sort: number;
  prescription: boolean;
  professional: boolean;
}

export interface CartLine {
  itemId: string;
  quantity: number;
  price: number;
  discount: number;
  batchId: string;
}

export interface Allocation {
  batchId: string;
  batchNumber: string;
  expiry: string;
  quantity: number;
  estimatedCost: number;
}

export interface SaleLine {
  id: string;
  itemId: string;
  code: string;
  name: string;
  specification: string;
  category: string;
  unit: string;
  medicine: boolean;
  quantity: number;
  originalPrice: number;
  price: number;
  discount: number;
  orderShare: number;
  net: number;
  allocations: Allocation[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
}

export interface SaleReturn {
  id: string;
  date: string;
  reason: string;
  actor: string;
  method: PaymentMethod;
  lines: {
    lineId: string;
    quantity: number;
    refund: number;
    disposition: "可售回庫" | "不可售";
    allocations: Allocation[];
  }[];
}

export interface SaleRefund {
  id: string;
  sourceId: string;
  amount: number;
  method: PaymentMethod;
  status: "待退款" | "已退款";
  reference: string;
  actor: string;
  confirmedAt: string;
}

export interface Sale {
  id: string;
  requestId: string;
  number: string;
  date: string;
  warehouse: string;
  seller: string;
  sellerTaxId: string;
  customer: Customer;
  cashier: string;
  lines: SaleLine[];
  subtotal: number;
  orderDiscount: number;
  total: number;
  payment: {
    method: PaymentMethod;
    received: number;
    change: number;
    reference: string;
    confirmed: boolean;
  };
  receiptType: string;
  invoiceStatus: string;
  remark: string;
  authorization: string;
  returns: SaleReturn[];
  refunds: SaleRefund[];
  void: { reason: string; date: string; actor: string } | null;
}

export interface PosMovement {
  id: string;
  saleId: string;
  reference: string;
  batchId: string;
  itemId: string;
  quantity: number;
  type: "POS_OUT" | "POS_RETURN_IN" | "POS_VOID_REVERSAL_IN";
  time: string;
  actor: string;
}

export interface PosState {
  policies: Record<string, PosPolicy>;
  batches: InventoryBatch[];
  sales: Sale[];
  movements: PosMovement[];
}
