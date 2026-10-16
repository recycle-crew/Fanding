import { Link, Outlet } from "react-router";

export function BoardLayout() {
  return (
    <>
      <header className="board-header tw:flex tw:items-center tw:justify-between tw:gap-5 tw:px-[26px] tw:py-[18px] tw:board:flex-wrap tw:board:gap-2 tw:board:px-4 tw:board:py-[14px]">
        <Link className="brand" to="/">
          庫存管理系統 <span>畫面規劃板</span>
        </Link>
        <nav aria-label="相關頁面">
          <Link to="/">規劃文件</Link>
          <Link to="/demo">完整 Demo ↗</Link>
        </nav>
      </header>
      <Outlet />
    </>
  );
}
