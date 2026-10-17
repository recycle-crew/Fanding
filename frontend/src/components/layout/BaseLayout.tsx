import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { useAppSelector } from "@/store/hooks";
import { BaseFooter } from "@/components/layout/BaseFooter";
import { BaseHeader } from "@/components/layout/BaseHeader";
import { BaseSidebar } from "@/components/layout/BaseSidebar";

type BaseLayoutProps = {
  variant: "planning" | "architecture" | "workspace" | "board" | "bare";
};

export function BaseLayout({ variant }: BaseLayoutProps) {
  const location = useLocation();
  const loggedIn = useAppSelector((root) => root.demo.loggedIn);
  const embedded = new URLSearchParams(location.search).get("embed") === "1";
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebar, setSidebar] = useState({
    width: embedded ? 195 : 228,
    floating: false,
  });

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
  if (variant !== "workspace") {
    return (
      <div className="shell mx-auto max-w-[1200px] px-[18px] sm:px-6 md:px-[40px] print:max-w-none print:p-0">
        <BaseHeader variant="document" />
        <Outlet />
        <BaseFooter variant={variant} />
      </div>
    );
  }

  return (
    <div
      id={loggedIn ? "workspace" : undefined}
      className={`demo-frame${loggedIn ? " authenticated" : ""}${sidebar.floating ? " sidebar-detached" : ""}`}
      style={{ "--sidebar-width": `${sidebar.width}px` } as CSSProperties}
    >
      <BaseSidebar
        hidden={!loggedIn}
        open={menuOpen}
        embedded={embedded}
        onWidth={(width, floating) =>
          setSidebar((previous) =>
            previous.width === width && previous.floating === floating
              ? previous
              : { width, floating },
          )
        }
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
