export type Workspace = "HIS" | "OTC";
export interface Product {
  id: string;
  barcode: string;
  name: string;
  spec: string;
  unit: string;
  stock: number;
  status: string;
  vendorId?: string;
  costPrice?: number | null;
  salePrice?: number | null;
  minStock?: number;
  activationDate?: string;
  deactivationDate?: string;
  filledBy?: string;
}
export interface Movement {
  id: number;
  workspace: Workspace;
  productId: string;
  type: string;
  quantity: number;
  note: string;
  time: string;
  recordedAt?: string;
  filledBy?: string;
  voucherId?: string;
  unitCost?: number | null;
}
export interface InventoryFilter {
  voucherId?: string;
  materialNumber: string;
  person: string;
  start?: string;
  end?: string;
  date?: string | null;
  product?: string;
  action?: string;
  workspace?: string;
}
export interface Change {
  id: number;
  kind: string;
  recordId: string | number;
  field: string;
  before: string;
  after: string;
  time: string;
  filledBy: string;
  permission: string;
}
