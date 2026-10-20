import type { stocktakeStatuses } from "@/features/stocktakes/model";

export type StocktakeStatus = (typeof stocktakeStatuses)[number];

export interface StocktakeScope {
  itemId: string;
  code: string;
  name: string;
  specification: string;
  unit: string;
  barcode: string;
  trackBatch: boolean;
  baseline: number;
  movement: number;
  batches: {
    id: string;
    number: string;
    expiry: string;
    quantity: number;
    unavailable: number;
  }[];
}

export interface CountRecord {
  id: string;
  itemId: string;
  quantity: number;
  zero: boolean;
  person: string;
  time: string;
  round: number;
  area: string;
  valid: boolean;
  invalidReason: string;
  invalidatedBy: string;
  invalidatedAt: string;
}

export interface Recount {
  id: string;
  itemId: string;
  round: number;
  person: string;
  reason: string;
  status: "待複盤" | "已提交" | "已採用" | "不採用";
}

export interface StocktakeAdjustment {
  id: string;
  itemId: string;
  type: "STOCKTAKE_SURPLUS_IN" | "STOCKTAKE_SHORTAGE_OUT";
  quantity: number;
  expected: number;
  counted: number;
  batches: { batchId: string; batchNumber: string; quantity: number }[];
  time: string;
  actor: string;
  reference: string;
}

export interface Stocktake {
  id: string;
  number: string;
  name: string;
  date: string;
  warehouse: string;
  type: "全盤" | "部分盤點";
  status: StocktakeStatus;
  people: string[];
  finished: string[];
  createdBy: string;
  createdAt: string;
  snapshotAt: string;
  closedAt: string;
  completedAt: string;
  confirmedBy: string;
  remark: string;
  scope: StocktakeScope[];
  records: CountRecord[];
  recounts: Recount[];
  selectedRounds: Record<string, number>;
  confirmedItems: string[];
  batchPlans: Record<string, { batchId: string; quantity: number }[]>;
  adjustments: StocktakeAdjustment[];
  audit: string[];
  cancelReason: string;
  alignmentConfirmed: boolean;
}
