import type { InventoryBatch, ItemTransaction } from "@/types/items";

export type InventoryDocumentKind = "requisition" | "disposal";
export type InventoryPersona = "作業人員" | "主管" | "唯讀";
export interface InventoryDocumentLine {
  id: string;
  itemId: string;
  batchId: string;
  portion: "normal" | "unavailable";
  quantity: number;
  reason: string;
  explanation: string;
  code: string;
  name: string;
  specification: string;
  unit: string;
  batchNumber: string;
  expiryDate: string;
}
export interface InventoryDocument {
  id: string;
  number: string;
  kind: InventoryDocumentKind;
  date: string;
  warehouse: string;
  person: string;
  personId: string;
  purpose: string;
  status: "草稿" | "已確認" | "已作廢";
  createdBy: string;
  createdAt: string;
  confirmedBy: string;
  confirmedAt: string;
  cancelledBy: string;
  cancelledAt: string;
  cancelReason: string;
  lines: InventoryDocumentLine[];
  audit: string[];
}
export interface InventoryDocumentCommit {
  document: InventoryDocument;
  batches: InventoryBatch[];
  transactions: ItemTransaction[];
}
