export type PurchaseOperation = "reversal" | "return" | "correction";

export type CorrectionType =
  "數量更正" | "品項更正" | "批號更正" | "成本更正" | "發票金額更正";

export interface PurchaseLine {
  id: string;
  itemId: string;
  code: string;
  name: string;
  specification: string;
  unit: string;
  batch: string;
  expiry: string;
  quantity: number;
  unitCost: number;
  remark: string;
  trackBatch: boolean;
  trackExpiry: boolean;
  traceableQuantity: number;
}

export interface Settlement {
  number: string;
  invoice: string;
  invoiceDate: string;
  tax: string;
  amount: number;
  accountingDate: string;
  differenceReason: string;
  remark: string;
  operator: string;
  createdAt: string;
}

export interface OperationLine {
  lineId: string;
  quantityChange: number;
  amount: number;
  newUnitCost?: number;
  replacement?: {
    itemId: string;
    code: string;
    name: string;
    specification: string;
    unit: string;
    batch: string;
    expiry: string;
  };
}

export interface PurchaseRecord {
  id: string;
  number: string;
  kind: PurchaseOperation;
  correctionType?: CorrectionType;
  date: string;
  reason: string;
  resolution: string;
  accountingStatus: "待處理" | "已完成";
  amount: number;
  resolutionAmount: string;
  reference: string;
  remark: string;
  operator: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  exchangeReceipt?: ExchangeReceipt;
  lines: OperationLine[];
}

export interface ExchangeReceipt {
  date: string;
  itemId: string;
  code: string;
  name: string;
  specification: string;
  unit: string;
  quantity: number;
  batch: string;
  expiry: string;
  warehouse: string;
}

export interface ExchangeOrder {
  id: string;
  number: string;
  purchaseId: string;
  purchaseNumber: string;
  returnRecordId: string;
  returnNumber: string;
  supplier: string;
  warehouse: string;
  date: string;
  status: "待收貨" | "已收貨";
  expectedLines: Array<{
    lineId: string;
    itemId: string;
    code: string;
    name: string;
    specification: string;
    unit: string;
    quantity: number;
  }>;
  receipt?: ExchangeReceipt;
}

export interface Purchase {
  id: string;
  number: string;
  date: string;
  supplier: string;
  warehouse: string;
  remark: string;
  createdBy: string;
  createdAt: string;
  lines: PurchaseLine[];
  settlement: Settlement | null;
  records: PurchaseRecord[];
  relatedReturn: string;
}

export interface PurchasesState {
  orders: Purchase[];
  exchanges: ExchangeOrder[];
}
