import type { ModuleKey } from "@/types/demo";

export const itemGroupPaths = {
  HIS_MEDICINE: "/items/his",
  GENERAL: "/items/general",
} as const;

export const demoModulePaths: Record<ModuleKey, string> = {
  "base-data": "/base-data",
  consumptions: "/consumptions",
  pos: "/pos",
  sales: "/sales",
  stocktakes: "/stocktakes",
  purchases: "/purchases",
  items: "/items",
  overview: "/",
  vendors: "/vendors",
  his: "/his",
  products: "/products",
  "historical-cost": "/historical-cost",
  receipt: "/receipt",
  issue: "/issue",
  requisitions: "/requisitions",
  stocktake: "/stocktake/current",
  "stocktake-history": "/stocktake/history",
};
