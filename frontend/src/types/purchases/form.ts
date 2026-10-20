import type { PurchaseLine } from "@/types/purchases";

export interface NewPurchaseInput {
  date: string;
  supplier: string;
  warehouse: string;
  remark: string;
  lines: PurchaseLine[];
  relatedReturn: string;
}
