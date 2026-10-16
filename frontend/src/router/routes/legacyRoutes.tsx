import { Navigate, useLocation } from "react-router";
import type { RouteObject } from "react-router";

const legacyPaths: Record<string, string> = {
  "/index.html": "/",
  "/architecture.html": "/architecture",
  "/board.html": "/board",
  "/demo.html": "/demo",
};

// 保留舊頁面網址、文件錨點及展示參數，盤點 hash 轉換成 SPA 路徑。
function LegacyRedirect() {
  const location = useLocation();
  let path = legacyPaths[location.pathname];
  let hash = location.hash;
  if (path === "/demo") {
    if (hash.startsWith("#/stocktake/")) path += hash.slice(1);
    hash = "";
  }
  return <Navigate replace to={`${path}${location.search}${hash}`} />;
}

export const legacyRoutes: RouteObject[] = Object.keys(legacyPaths).map(
  (path) => ({ path, element: <LegacyRedirect /> }),
);
