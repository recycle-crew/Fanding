import { Link, Outlet } from "react-router";
import architectureDocument from "../../../../docs/architecture.md?url";
export function ArchitectureLayout() {
  return (
    <>
      <a className={"skip"} href={"#document"}>
        {"跳至架構文件"}
      </a>
      <div
        className={
          "shell tw:mx-auto tw:max-w-[1200px] tw:px-[40px] tw:compact:px-6 tw:phone:px-[18px] tw:print:max-w-none tw:print:p-0"
        }
      >
        {"\n"}
        <header className="tw:flex tw:items-center tw:justify-between tw:gap-6 tw:py-6 tw:compact:items-start tw:phone:flex-col">
          <Link className={"brand"} to={"/"}>
            {"庫存管理系統"}
          </Link>
          <nav
            className="tw:flex tw:flex-wrap tw:justify-end tw:gap-[18px] tw:compact:gap-3 tw:phone:justify-start"
            aria-label={"主要導覽"}
          >
            <Link to={"/"}>{"功能與流程規劃"}</Link>
            <Link to={"/architecture"} aria-current={"page"}>
              {"程式架構"}
            </Link>
            <Link to={"/board"}>{"畫面規劃板 ↗"}</Link>
            <Link to={"/demo"}>{"系統 Demo ↗"}</Link>
          </nav>
        </header>
        {"\n"}
        <Outlet />
        {"\n"}
        <footer className="tw:flex tw:justify-between tw:gap-5 tw:phone:flex-col">
          <span>{"庫存管理系統 · 程式架構規劃"}</span>
          <a href={architectureDocument}>{"Markdown 原始文件 ↗"}</a>
          <Link to={"/"}>{"← 返回功能規劃"}</Link>
        </footer>
      </div>
    </>
  );
}
