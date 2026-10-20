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
  lines: OperationLine[];
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
}
