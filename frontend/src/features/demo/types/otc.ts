export interface Requisition {
  id: number;
  productId: string;
  person: string;
  quantity: number;
  note: string;
  requisitionedAt?: string;
  filledBy?: string;
}
export interface VoucherLine {
  productId: string;
  quantity: number;
  note: string;
  filledBy: string;
  unitCost: number | null;
  productName?: string;
  unit?: string;
}
export interface Voucher {
  id: string;
  direction: string;
  createdAt: string;
  createdBy: string;
  submittedAt: string | null;
  submittedBy?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  lines: VoucherLine[];
}
