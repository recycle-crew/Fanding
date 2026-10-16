import { lazy } from "react";
import type { RouteObject } from "react-router";
import { PlanningLayout } from "@/pages/Planning/Layout";
import { ArchitectureLayout } from "@/pages/Architecture/Layout";
import { BoardLayout } from "@/pages/Board/Layout";

const PlanningPage = lazy(() =>
  import("@/pages/Planning/Home").then((m) => ({ default: m.PlanningPage })),
);
const ArchitecturePage = lazy(() =>
  import("@/pages/Architecture/Home").then((m) => ({
    default: m.ArchitecturePage,
  })),
);
const BoardPage = lazy(() =>
  import("@/pages/Board/Home").then((m) => ({ default: m.BoardPage })),
);

export const planningRoutes: RouteObject[] = [
  {
    path: "/",
    element: <PlanningLayout />,
    children: [{ index: true, element: <PlanningPage /> }],
  },
  {
    path: "/architecture",
    element: <ArchitectureLayout />,
    children: [{ index: true, element: <ArchitecturePage /> }],
  },
  {
    path: "/board",
    element: <BoardLayout />,
    children: [{ index: true, element: <BoardPage /> }],
  },
];
