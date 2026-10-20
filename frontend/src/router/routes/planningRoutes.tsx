import { lazy } from "react";
import type { RouteObject } from "react-router";
import { BoardLayout } from "@/pages/Board/Layout";
const BoardPage = lazy(() =>
  import("@/pages/Board/Home").then((m) => ({ default: m.BoardPage })),
);
export const planningRoutes: RouteObject[] = [
  {
    path: "/board",
    element: <BoardLayout />,
    children: [{ index: true, element: <BoardPage /> }],
  },
];
