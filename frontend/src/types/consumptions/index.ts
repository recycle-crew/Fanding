import type { exceptionTypes } from "@/features/consumptions/model";

export interface ConsumptionMapping {
  id: string;
  system: string;
  code: string;
  name: string;
  itemId: string;
  sourceUnit: string;
  factor: number;
  active: boolean;
}

export interface ConsumptionRecord {
  id: string;
  sourceId: string;
  lineId: string;
  version: number;
  code: string;
  itemId: string;
  itemCode: string;
  name: string;
  nhiCode: string;
  category: string;
  specification: string;
  unit: string;
  original: number;
  sourceUnit: string;
  factor: number;
  converted: number;
  applied: number;
  date: string;
  synced: string;
  warehouse: string;
  status: "正常" | "已更正" | "已取消";
  allocations: {
    batch: string;
    quantity: number;
    source: "實際批號" | "FEFO 帳面推定";
  }[];
  history: {
    time: string;
    action: string;
    delta: number;
    description: string;
  }[];
}

export interface ConsumptionException {
  id: string;
  sourceId: string;
  lineId: string;
  code: string;
  name: string;
  quantity: number;
  sourceUnit: string;
  type: keyof typeof exceptionTypes;
  status: "待處理" | "待人工核對" | "已解決";
  date: string;
  history: string[];
}

export interface SyncRun {
  id: string;
  started: string;
  finished: string;
  status: "SUCCESS" | "PARTIAL_SUCCESS" | "FAILED";
  received: number;
  applied: number;
  skipped: number;
  failed: number;
  actor: string;
}
