import type { ModuleKey } from "@/types/demo";

export const itemGroupPaths = {
  HIS_MEDICINE: "/demo/items/his",
  GENERAL: "/demo/items/general",
} as const;

export const demoModulePaths: Record<ModuleKey, string> = {
  "base-data": "/demo/base-data",
  consumptions: "/demo/consumptions",
  pos: "/demo/pos",
  sales: "/demo/sales",
  stocktakes: "/demo/stocktakes",
  purchases: "/demo/purchases",
  items: "/demo/items",
  overview: "/demo",
  vendors: "/demo/vendors",
  his: "/demo/his",
  products: "/demo/products",
  "historical-cost": "/demo/historical-cost",
  receipt: "/demo/receipt",
  issue: "/demo/issue",
  requisitions: "/demo/requisitions",
  stocktake: "/demo/stocktake/current",
  "stocktake-history": "/demo/stocktake/history",
};
