import { useEffect } from "react";
import { Navigate, useLocation } from "react-router";
import type { RouteObject } from "react-router";
import { staticAssetHref } from "@/helpers/deployment";
const documentPaths: Record<string, string> = {
  "/planning": "/docs/planning.html",
  "/planning.html": "/docs/planning.html",
  "/architecture": "/docs/architecture.html",
  "/architecture.html": "/docs/architecture.html",
};
const retiredWorkspacePaths: Record<string, string> = {
  "/vendors": "/base-data",
  "/his": "/items/his",
  "/products": "/items/general",
  "/historical-cost": "/items",
  "/receipt": "/purchases",
  "/issue": "/consumptions",
  "/stocktake/current": "/stocktakes",
  "/stocktake/history": "/stocktakes",
};
function LegacyRedirect() {
  const location = useLocation();
  const documentPath = documentPaths[location.pathname.replace(/\/+$/, "")];
  useEffect(() => {
    if (documentPath)
      window.location.replace(
        staticAssetHref(documentPath) + location.search + location.hash,
      );
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
  path = retiredWorkspacePaths[path.replace(/\/+$/, "")] || path;
  return <Navigate replace to={path + location.search + hash} />;
}
export const legacyRoutes: RouteObject[] = [
  ...Object.keys(documentPaths),
  ...Object.keys(retiredWorkspacePaths),
  "/index.html",
  "/overview",
  "/board.html",
  "/demo.html",
  "/demo",
  "/demo/*",
].map((path) => ({ path, element: <LegacyRedirect /> }));
