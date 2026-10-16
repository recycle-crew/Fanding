import { lazy } from "react";
import type { RouteObject } from "react-router";
import { demoModulePaths } from "@/constants/demoRoutes";
import { DemoLayout } from "@/pages/Demo/Layout";

const DemoPage = lazy(() =>
  import("@/pages/Demo/Home").then((m) => ({ default: m.DemoPage })),
);

export const demoRoutes: RouteObject[] = [
  {
    path: "/demo",
    element: <DemoLayout />,
    children: [
      { index: true, element: <DemoPage /> },
      ...Object.values(demoModulePaths)
        .filter((path) => path !== "/demo")
        .map((path) => ({
          path: path.slice("/demo/".length),
          element: <DemoPage />,
        })),
      { path: "overview", element: <DemoPage /> },
    ],
  },
];
