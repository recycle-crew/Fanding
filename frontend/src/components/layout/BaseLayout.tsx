import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { useAppSelector } from "@/store/hooks";
import { BaseHeader } from "@/components/layout/BaseHeader";
import { BaseSidebar } from "@/components/layout/BaseSidebar";

type BaseLayoutProps = {
  variant: "workspace" | "board" | "bare";
};

export function BaseLayout({ variant }: BaseLayoutProps) {
  const location = useLocation();
  const loggedIn = useAppSelector((root) => root.demo.loggedIn);
  const embedded = new URLSearchParams(location.search).get("embed") === "1";
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(embedded ? 195 : 228);

  // 路由切換完成或登出後收合手機選單；被阻擋的切頁仍保留目前畫面。
  useEffect(() => {
    setMenuOpen(false);
  }, [location.key, loggedIn]);

  if (variant === "bare") return <Outlet />;
  if (variant === "board") {
    return (
      <>
        <BaseHeader variant="board" />
        <Outlet />
      </>
    );
  }

  return (
    <div
      id={loggedIn ? "workspace" : undefined}
      className={`demo-frame${loggedIn ? " authenticated" : ""}`}
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      {loggedIn && (
        <a
          href="#content"
          className="fixed left-4 top-4 z-[100] -translate-y-[200%] rounded-md border border-blue-800 bg-white px-4 py-3 font-semibold text-blue-800 focus:translate-y-0 focus:outline-2 focus:outline-blue-800"
          onClick={(event) => {
            event.preventDefault();
            document.getElementById("content")?.focus();
          }}
        >
          跳至主要內容
        </a>
      )}
      <BaseSidebar
        hidden={!loggedIn}
        open={menuOpen}
        embedded={embedded}
        onWidth={setSidebarWidth}
      />
      <div className="main-shell">
        <BaseHeader
          variant="demo"
          hidden={!loggedIn}
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen((open) => !open)}
        />
        <Outlet />
      </div>
    </div>
  );
}
