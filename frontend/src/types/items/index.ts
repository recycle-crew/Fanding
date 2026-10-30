export type ItemGroup = "NURSING" | "GLASSES" | "HIS_MEDICINE" | "GENERAL";

export interface Item {
  id: string;
  code: string;
  group: ItemGroup;
  name: string;
  englishName: string;
  barcode: string;
  nhiCode: string;
  category: string;
  specification: string;
  unit: string;
  supplier: string;
  safetyStock: number;
  safetyStockSixMonths: number;
  trackBatch: boolean;
  trackExpiry: boolean;
  referenceCost: string;
  suggestedPrice: string;
  effectiveFrom: string;
  effectiveUntil: string;
  active: boolean;
  remark: string;
}

export interface InventoryBatch {
  id: string;
  itemId: string;
  warehouse: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unavailable: number;
  receivedAt: string;
}

export interface PurchaseCost {
  id: string;
  itemId: string;
  batchId: string;
  order: string;
  date: string;
  supplier: string;
  batchNumber: string;
  quantity: number;
  unitCost: number;
}

export interface ItemTransaction {
  id: string;
  itemId: string;
  batchId: string;
  date: string;
  type: string;
  reference: string;
  warehouse: string;
  batchNumber: string;
  change: number;
  after: number;
  operator: string;
  remark: string;
}

export interface ItemsState {
  items: Item[];
  batches: InventoryBatch[];
  costs: PurchaseCost[];
  transactions: ItemTransaction[];
}
