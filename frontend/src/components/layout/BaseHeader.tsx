import { BaseButton } from "@/components/ui/BaseButton";
import { Link, useLocation } from "react-router";

type BaseHeaderProps = {
  variant: "document" | "demo" | "board";
  hidden?: boolean;
  menuOpen?: boolean;
  onMenuToggle?: () => void;
};

export function BaseHeader(props: BaseHeaderProps) {
  const location = useLocation();
  const isDemo = props.variant === "demo";
  if (props.variant === "board") {
    return (
      <header className="board-header flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] bg-white px-4 py-[14px] md:flex-nowrap md:gap-5 md:px-[26px] md:py-[18px]">
        <Link className="brand" to="/">
          庫存管理系統 <span>畫面規劃板</span>
        </Link>
        <nav
          className="flex flex-wrap justify-end gap-3 text-[13px] md:gap-[22px]"
          aria-label="相關頁面"
        >
          <Link to="/">規劃文件</Link>
          <Link to="/demo">完整 Demo ↗</Link>
        </nav>
      </header>
    );
  }
  const headerClassName = isDemo
    ? "p-3 md:hidden"
    : "flex flex-col items-start justify-between gap-6 border-b border-[var(--line)] py-6 sm:flex-row md:items-center";

  return (
    <header hidden={props.hidden} className={headerClassName}>
      {isDemo ? (
        <>
          <BaseButton
            variant="outline"
            id="menu-toggle"
            aria-controls="sidebar"
            aria-expanded={props.menuOpen ?? false}
            onClick={props.onMenuToggle}
            className="block cursor-pointer px-[10px] py-[6px] md:hidden"
          >
            ☰ 功能選單
          </BaseButton>
        </>
      ) : (
        <>
          <Link
            to="/"
            className="shrink-0 text-[22px] font-bold tracking-[-0.7px] no-underline text-[var(--ink)]"
          >
            庫存管理系統
          </Link>
          <nav
            className="flex flex-wrap justify-start gap-3 text-[14px] md:justify-end md:gap-[18px]"
            aria-label="主要導覽"
          >
            <Link
              to="/"
              aria-current={location.pathname === "/" ? "page" : undefined}
              className="no-underline whitespace-nowrap"
            >
              功能與流程規劃
            </Link>
            <Link
              to="/architecture"
              aria-current={
                location.pathname === "/architecture" ? "page" : undefined
              }
              className="no-underline whitespace-nowrap"
            >
              程式架構
            </Link>
            <Link to="/board" className="no-underline whitespace-nowrap">
              畫面規劃板 ↗
            </Link>
            <Link to="/demo" className="no-underline whitespace-nowrap">
              系統 Demo ↗
            </Link>
          </nav>
        </>
      )}
    </header>
  );
}
