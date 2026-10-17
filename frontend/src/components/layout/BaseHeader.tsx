import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/store/hooks";
import { Link, useLocation } from "react-router";

type BaseHeaderProps = {
  variant: "document" | "demo" | "board";
  hidden?: boolean;
  menuOpen?: boolean;
  onMenuToggle?: () => void;
};

export function BaseHeader(props: BaseHeaderProps) {
  const location = useLocation();
  const s = useAppSelector((root) => root.demo);
  const workspaceLabel =
    s.activeModule === "his"
      ? "HIS 工作區"
      : ["stocktake", "stocktake-history"].includes(s.activeModule)
        ? `${s.stocktakeWorkspace} ${s.activeModule === "stocktake-history" ? "歷史查詢" : "現有週期"}工作區`
        : [
              "products",
              "historical-cost",
              "receipt",
              "issue",
              "requisitions",
            ].includes(s.activeModule)
          ? "OTC 工作區"
          : "共同工作區";
  const isDemo = props.variant === "demo";
  const isEmbedded = new URLSearchParams(location.search).get("embed") === "1";
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
    ? isEmbedded
      ? "topbar flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-white p-[12px_16px] sm:p-[12px_24px] md:flex-nowrap"
      : "topbar flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-white p-[12px_16px] sm:p-[14px_20px] md:flex-nowrap md:p-[16px_32px]"
    : "flex flex-col items-start justify-between gap-6 border-b border-[var(--line)] py-6 sm:flex-row md:items-center";

  return (
    <header hidden={props.hidden} className={headerClassName}>
      {isDemo ? (
        <>
          <Button
            variant="outline"
            id="menu-toggle"
            aria-controls="sidebar"
            aria-expanded={props.menuOpen ?? false}
            onClick={props.onMenuToggle}
            className="block cursor-pointer px-[10px] py-[6px] md:hidden"
          >
            ☰ 功能選單
          </Button>
          <span
            id="workspace-label"
            className="order-3 w-full border-l-[3px] border-[var(--primary)] pl-3 text-[14px] font-semibold sm:order-none sm:w-auto"
          >
            {workspaceLabel}
          </span>
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
