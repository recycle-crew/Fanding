import type { ModuleKey } from "@/types/demo";

export const demoModulePaths: Record<ModuleKey, string> = {
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
