import { lazy } from "react";
import type { RouteObject } from "react-router";
import { WorkspaceLayout } from "@/pages/Workspace/Layout";
import { Workspace } from "@/features/workspace/Workspace";
const OverviewPage = lazy(() =>
  import("@/pages/Overview/Home").then((m) => ({ default: m.OverviewPage })),
);
const BaseDataPage = lazy(() =>
  import("@/pages/BaseData/Home").then((m) => ({ default: m.BaseDataPage })),
);
const ConsumptionsPage = lazy(() =>
  import("@/pages/Consumptions/Home").then((m) => ({
    default: m.ConsumptionsPage,
  })),
);
const PosPage = lazy(() =>
  import("@/pages/Pos/Home").then((m) => ({ default: m.PosPage })),
);
const StocktakesPage = lazy(() =>
  import("@/pages/Stocktakes/Home").then((m) => ({
    default: m.StocktakesPage,
  })),
);
const PurchasesPage = lazy(() =>
  import("@/pages/Purchases/Home").then((m) => ({ default: m.PurchasesPage })),
);
const ItemsPage = lazy(() =>
  import("@/pages/Items/Home").then((m) => ({ default: m.ItemsPage })),
);
const HistoricalCostPage = lazy(() =>
  import("@/pages/HistoricalCost/Home").then((m) => ({
    default: m.HistoricalCostPage,
  })),
);
const InventoryRecordsPage = lazy(() =>
  import("@/pages/InventoryRecords/Home").then((m) => ({
    default: m.InventoryRecordsPage,
  })),
);
const InventoryOperationsPage = lazy(() =>
  import("@/pages/InventoryOperations/Home").then((m) => ({
    default: m.InventoryOperationsPage,
  })),
);
export const workspaceRoutes: RouteObject[] = [
  {
    path: "/",
    Component: WorkspaceLayout,
    children: [
      {
        Component: Workspace,
        children: [
          {
            index: true,
            Component: OverviewPage,
            handle: { module: "overview" },
          },
          {
            path: "base-data",
            Component: BaseDataPage,
            handle: { module: "base-data" },
          },
          {
            path: "consumptions",
            Component: ConsumptionsPage,
            handle: { module: "consumptions" },
          },
          { path: "pos", Component: PosPage, handle: { module: "pos" } },
          { path: "sales", Component: PosPage, handle: { module: "sales" } },
          {
            path: "sales/returns",
            Component: PosPage,
            handle: { module: "sales" },
          },
          {
            path: "stocktakes",
            Component: StocktakesPage,
            handle: { module: "stocktakes" },
          },
          {
            path: "purchases",
            Component: PurchasesPage,
            handle: { module: "purchases" },
          },
          { path: "items", Component: ItemsPage, handle: { module: "items" } },
          {
            path: "vendors",
            Component: InventoryRecordsPage,
            handle: { module: "vendors" },
          },
          {
            path: "his",
            Component: InventoryRecordsPage,
            handle: { module: "his" },
          },
          {
            path: "products",
            Component: InventoryRecordsPage,
            handle: { module: "products" },
          },
          {
            path: "historical-cost",
            Component: HistoricalCostPage,
            handle: { module: "historical-cost" },
          },
          {
            path: "receipt",
            Component: InventoryOperationsPage,
            handle: { module: "receipt" },
          },
          {
            path: "issue",
            Component: InventoryOperationsPage,
            handle: { module: "issue" },
          },
          {
            path: "requisitions",
            Component: InventoryRecordsPage,
            handle: { module: "requisitions" },
          },
          {
            path: "stocktake/current",
            Component: InventoryOperationsPage,
            handle: { module: "stocktake" },
          },
          {
            path: "stocktake/history",
            Component: InventoryOperationsPage,
            handle: { module: "stocktake-history" },
          },
          {
            path: "consumptions/:view",
            Component: ConsumptionsPage,
            handle: { module: "consumptions" },
          },
          {
            path: "stocktakes/:id/count",
            Component: StocktakesPage,
            handle: { module: "stocktakes" },
          },
          {
            path: "stocktakes/:id/review",
            Component: StocktakesPage,
            handle: { module: "stocktakes" },
          },
          {
            path: "items/his",
            Component: ItemsPage,
            handle: { module: "items" },
          },
          {
            path: "items/general",
            Component: ItemsPage,
            handle: { module: "items" },
          },
        ],
      },
    ],
  },
];
