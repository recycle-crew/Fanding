import { useEffect } from "react";
import { Navigate, useLocation } from "react-router";
import type { RouteObject } from "react-router";
const documentPaths: Record<string, string> = {
  "/planning": "/docs/planning.html",
  "/planning.html": "/docs/planning.html",
  "/architecture": "/docs/architecture.html",
  "/architecture.html": "/docs/architecture.html",
};
function LegacyRedirect() {
  const location = useLocation();
  const documentPath = documentPaths[location.pathname.replace(/\/+$/, "")];
  useEffect(() => {
    if (documentPath)
      window.location.replace(documentPath + location.search + location.hash);
  }, [documentPath, location.search, location.hash]);
  if (documentPath) return <p role="status">正在開啟規劃文件…</p>;
  let path =
    location.pathname === "/board.html"
      ? "/board"
      : location.pathname.replace(/^\/demo(?:\/|\.html)?/, "/");
  if (
    ["/index.html", "/overview"].includes(location.pathname.replace(/\/+$/, ""))
  )
    path = "/";
  let hash = location.hash;
  if (
    (location.pathname === "/demo" || location.pathname === "/demo.html") &&
    hash.startsWith("#/stocktake/")
  ) {
    path = hash.slice(1);
    hash = "";
  }
  return <Navigate replace to={path + location.search + hash} />;
}
export const legacyRoutes: RouteObject[] = [
  ...Object.keys(documentPaths),
  "/index.html",
  "/overview",
  "/board.html",
  "/demo.html",
  "/demo",
  "/demo/*",
].map((path) => ({ path, element: <LegacyRedirect /> }));
