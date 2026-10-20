import { BaseButton } from "@/components/ui/BaseButton";
import { Link } from "react-router";
type BaseHeaderProps = {
  variant: "demo" | "board";
  hidden?: boolean;
  menuOpen?: boolean;
  onMenuToggle?: () => void;
};
export function BaseHeader(props: BaseHeaderProps) {
  if (props.variant === "board")
    return (
      <header className="board-header flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] bg-white px-4 py-[14px] md:flex-nowrap md:gap-5 md:px-[26px] md:py-[18px]">
        <Link className="brand" to="/">
          庫存管理系統 <span>畫面規劃板</span>
        </Link>
        <nav
          className="flex flex-wrap justify-end gap-3 text-[13px] md:gap-[22px]"
          aria-label="相關頁面"
        >
          <Link to="/">庫存管理系統 ↗</Link>
        </nav>
      </header>
    );
  return (
    <header hidden={props.hidden} className="p-3 md:hidden">
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
    </header>
  );
}
