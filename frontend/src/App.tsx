import { BaseButton } from "@/components/ui/BaseButton";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { store } from "@/store";
import { Component, Suspense, useEffect, useLayoutEffect } from "react";
import type { ReactNode } from "react";
import { Outlet, useBlocker, useLocation } from "react-router";
import { executeWorkspaceCommand } from "@/store/workspace";
import boardCss from "@/styles/layout/board.css?inline";
import workspaceCss from "@/styles/layout/workspace.css?inline";
import themeCss from "@/styles/themes/default.css?inline";

// 載入失敗仍提供可見的重試入口；重新整理會依 工作區規則重置記憶體資料。
class PageErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="shell route-status">
          <h1>畫面載入失敗</h1>
          <p>請重新載入後重試；展示資料將重置。</p>
          <BaseButton
            variant="default"
            onClick={() => window.location.reload()}
          >
            重新載入
          </BaseButton>
        </main>
      );
    return this.props.children;
  }
}

export function App() {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/+$/, "") || "/";
  const state = useAppSelector((root) => root.workspace);
  const dispatch = useAppDispatch();
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    // A save can clear dirty state and navigate in one event, before React re-renders.
    const current = store.getState();
    return (
      Boolean(
        current.workspace.editor ||
        current.workspace.confirmation ||
        current.moduleUi.dirty,
      ) && currentLocation.pathname !== nextLocation.pathname
    );
  });
  const page = pathname === "/board" ? "board" : "workspace";
  const css = {
    board: boardCss,
    workspace: workspaceCss,
  }[page];

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    dispatch(
      executeWorkspaceCommand({
        type: "update",
        update: (d) => {
          d.notice = "請先儲存、取消或完成目前的確認，再切換路由。";
        },
      }),
    );
    blocker.reset();
  }, [blocker]);

  useLayoutEffect(() => {
    const query = new URLSearchParams(location.search);
    document.body.className = `${page}-page${page === "workspace" && query.get("embed") === "1" ? " embedded" : ""}${page === "workspace" && query.get("preview") === "1" ? " preview-mode" : ""}`;
    document.title = {
      board: "庫存管理系統 — 畫面規劃板",
      workspace: "庫存管理系統",
    }[page];
    // 工作區自行管理工作區焦點與捲動，避免模組切換改變黏附側欄的位置。
    if (!location.hash && page !== "workspace") window.scrollTo(0, 0);
  }, [page, location.pathname, location.search]);

  // 跨路由的章節可能等延遲載入後才出現，表格列還需先展開所在分頁。
  useEffect(() => {
    if (!location.hash) return;
    let id: string;
    try {
      id = decodeURIComponent(location.hash.slice(1));
    } catch {
      return;
    }
    const reveal = () => {
      const target = document.getElementById(id);
      for (let ancestor = target; ancestor; ancestor = ancestor.parentElement) {
        if (
          ancestor.dataset.slot === "accordion-item" &&
          ancestor.dataset.state === "closed"
        ) {
          ancestor
            .querySelector<HTMLButtonElement>('[data-slot="accordion-trigger"]')
            ?.click();
        }
      }
      if (!target?.checkVisibility()) return;
      target.scrollIntoView({ block: "start" });
      observer.disconnect();
    };
    const observer = new MutationObserver(reveal);
    observer.observe(document.getElementById("root")!, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["hidden", "data-state"],
    });
    reveal();
    return () => observer.disconnect();
  }, [location.pathname, location.hash]);

  return (
    <>
      {/* 每次只套用目前頁面的樣式，避免多頁原有的全域選擇器互相污染。 */}
      <style>{css}</style>
      <style>{themeCss}</style>
      <PageErrorBoundary key={page}>
        <Suspense fallback={<p role="status">正在載入畫面…</p>}>
          <Outlet />
        </Suspense>
      </PageErrorBoundary>
    </>
  );
}
