import { lazy } from "react";
import type { RouteObject } from "react-router";
import { demoModulePaths, itemGroupPaths } from "@/constants/demoRoutes";
import { DemoLayout } from "@/pages/Demo/Layout";

const DemoPage = lazy(() =>
  import("@/pages/Demo/Home").then((m) => ({ default: m.DemoPage })),
);

export const demoRoutes: RouteObject[] = [
  {
    path: "/",
    element: <DemoLayout />,
    children: [
      { index: true, element: <DemoPage /> },
      ...Object.values(demoModulePaths)
        .filter((path) => path !== "/")
        .map((path) => ({
          path: path.slice("/".length),
          element: <DemoPage />,
        })),
      { path: "overview", element: <DemoPage /> },
      { path: "consumptions/:view", element: <DemoPage /> },
      { path: "stocktakes/:id/count", element: <DemoPage /> },
      { path: "stocktakes/:id/review", element: <DemoPage /> },
      ...Object.values(itemGroupPaths).map((path) => ({
        path: path.slice("/".length),
        element: <DemoPage />,
      })),
    ],
  },
];
