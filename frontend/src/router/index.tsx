import { createBrowserRouter, createHashRouter } from "react-router";
import { App } from "@/App";
import { routes } from "./routes";

const createRouter =
  import.meta.env.VITE_GITHUB_PAGES === "true"
    ? createHashRouter
    : createBrowserRouter;
export const router = createRouter([
  { path: "/", Component: App, children: routes },
]);
