import type { RouteObject } from "react-router";
import { planningRoutes } from "./planningRoutes";
import { demoRoutes } from "./demoRoutes";
import { legacyRoutes } from "./legacyRoutes";
import { NotFound } from "@/pages/Error/NotFound";
import { ErrorLayout } from "@/pages/Error/Layout";

export const routes: RouteObject[] = [
  ...planningRoutes,
  ...demoRoutes,
  ...legacyRoutes,
  {
    element: <ErrorLayout />,
    children: [{ path: "*", element: <NotFound /> }],
  },
];
