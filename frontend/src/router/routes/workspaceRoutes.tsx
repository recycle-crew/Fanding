import { lazy } from "react";
import { redirect } from "react-router";
import type { RouteObject } from "react-router";
import { WorkspaceLayout } from "@/pages/Workspace/Layout";
import { Workspace } from "@/features/workspace/Workspace";
const RequisitionsPage = lazy(() =>
  import("@/pages/Requisitions/Home").then((m) => ({
    default: m.RequisitionsPage,
  })),
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
            loader: ({ request }) => {
              const url = new URL(request.url);
              return redirect(`/items${url.search}${url.hash}`);
            },
          },
          {
            path: "base-data",
            Component: BaseDataPage,
            handle: { module: "base-data" },
          },
          {
            path: "requisitions",
            Component: RequisitionsPage,
            handle: { module: "requisitions" },
          },
          {
            path: "disposals",
            loader: ({ request }) => {
              const url = new URL(request.url);
              url.searchParams.set("tab", "disposal");
              return redirect(`/requisitions${url.search}${url.hash}`);
            },
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
            path: "items/nursing",
            Component: ItemsPage,
            handle: { module: "items" },
          },
          {
            path: "items/glasses",
            Component: ItemsPage,
            handle: { module: "items" },
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
