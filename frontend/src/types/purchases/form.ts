import type { PurchaseLine, PurchaseInvoice } from "@/types/purchases";

export interface NewPurchaseInput extends PurchaseInvoice {
  date: string;
  supplier: string;
  warehouse: string;
  remark: string;
  lines: PurchaseLine[];
  relatedReturn: string;
}
