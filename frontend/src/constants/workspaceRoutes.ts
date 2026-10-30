import type { ModuleKey } from "@/types/workspace";

export const itemGroupPaths = {
  NURSING: "/items/nursing",
  GLASSES: "/items/glasses",
  HIS_MEDICINE: "/items/his",
  GENERAL: "/items/general",
} as const;

export const workspaceModulePaths: Record<ModuleKey, string> = {
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
