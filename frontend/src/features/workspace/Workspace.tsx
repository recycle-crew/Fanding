import { Link, useLocation } from "react-router";

import { WORKSPACE_LOGIN_ENABLED } from "@/constants/workspaceAccess";

import { BasePaginationContext } from "@/components/ui/BaseDataTable";
import { usePresentation } from "@/features/planning/presentation";
import { useEffect, useMemo, useRef } from "react";

import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { executeWorkspaceCommand } from "@/store/workspace";

import type { ModuleKey } from "@/types/workspace";
import { Outlet, useMatches } from "react-router";
import { useLayoutEffect } from "react";
import { WorkspaceLogin } from "./WorkspaceLogin";
import { WorkspaceNotice } from "@/components/workspace/WorkspaceNotice";
import { WorkspaceConfirmation } from "@/components/workspace/WorkspaceConfirmation";
import { ReadonlyNotice } from "@/components/workspace/ReadonlyNotice";
export function Workspace() {
  const s = useAppSelector((root) => root.workspace);
  const dispatch = useAppDispatch();
  const matches = useMatches();
  const routeLocation = useLocation();
  const content = useRef<HTMLElement>(null);
  const wasLoggedIn = useRef(false);
  const pageStates = useMemo(() => new Map(), []);
  const embedded =
    new URLSearchParams(routeLocation.search).get("embed") === "1";
  const preview =
    new URLSearchParams(routeLocation.search).get("preview") === "1";
  const module = [...matches]
    .reverse()
    .map((match) => match.handle as { module?: ModuleKey } | undefined)
    .find((handle) => handle?.module)?.module;
  // 盤點與各模組路由支援直接連結與瀏覽器上一頁／下一頁，未完成表單由 App 保護。
  useLayoutEffect(() => {
    if (module && module !== s.activeModule)
      dispatch(executeWorkspaceCommand({ type: "navigate", module }));
  }, [module, dispatch]);
  usePresentation();
  useEffect(() => {
    document.body.inert = preview;
    return () => {
      document.body.inert = false;
    };
  }, [preview]);
  useEffect(() => {
    if (
      WORKSPACE_LOGIN_ENABLED &&
      !wasLoggedIn.current &&
      s.loggedIn &&
      !preview &&
      !embedded
    )
      content.current?.focus();
    if (wasLoggedIn.current && !s.loggedIn)
      document
        .querySelector<HTMLInputElement>("#login-form [name=account]")
        ?.focus();
    wasLoggedIn.current = s.loggedIn;
  }, [s.loggedIn]);
  return (
    <BasePaginationContext.Provider
      value={{ revision: s.pageRevision, states: pageStates }}
    >
      <div className="workspace-banner">
        <span>展示模式・假資料</span>
        {!embedded && (
          <nav
            aria-label="畫面規劃"
            className="flex flex-wrap items-center gap-3"
          >
            <Link to="/board">畫面規劃板 ↗</Link>
          </nav>
        )}
        <span>重新整理即重置</span>
      </div>
      <WorkspaceLogin />
      <div className="workspace-content min-w-0" hidden={!s.loggedIn}>
        <main
          ref={content}
          id="content"
          tabIndex={-1}
          hidden={Boolean(s.editor)}
        >
          {(!module || module === s.activeModule) && (
            <Outlet key={module || "home"} />
          )}
          {s.errors.page && (
            <p className="error" role="alert">
              {s.errors.page}
            </p>
          )}
        </main>
      </div>
      <WorkspaceNotice />
      <WorkspaceConfirmation />
      <ReadonlyNotice />
    </BasePaginationContext.Provider>
  );
}
