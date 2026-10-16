import { Link, Outlet } from "react-router";
export function PlanningLayout() {
  return (
    <>
      {"\n  "}
      <div
        className={
          "shell tw:mx-auto tw:max-w-[1200px] tw:px-[40px] tw:compact:px-6 tw:print:max-w-none tw:print:p-0"
        }
      >
        {"\n    "}
        <header className="tw:flex tw:items-center tw:justify-between tw:gap-6 tw:py-6 tw:compact:items-start tw:phone:flex-col">
          {"\n      "}
          <a className={"brand"} href={"#overview"}>
            {"庫存管理系統"}
          </a>
          {"\n      "}
          <nav
            className="tw:flex tw:flex-wrap tw:justify-end tw:gap-[18px] tw:compact:gap-3 tw:phone:justify-start"
            aria-label={"主要導覽"}
          >
            <a href={"#overview"}>{"系統概要"}</a>
            <a href={"#workspaces"}>{"系統分工"}</a>
            <a href={"#features"}>{"功能需求"}</a>
            <a href={"#workflow"}>{"作業流程"}</a>
            <a href={"#development-readiness"}>{"開發前確認"}</a>
            <a href={"#discussion"}>{"待確認問題"}</a>
            <Link to={"/architecture"}>{"程式架構 ↗"}</Link>
            <Link to={"/board"}>{"畫面規劃板 ↗"}</Link>
            <Link to={"/demo"}>{"系統 Demo ↗"}</Link>
          </nav>
          {"\n    "}
        </header>
        {"\n    "}
        <Outlet />
        {"\n    "}
        <footer className="tw:flex tw:justify-between tw:gap-5 tw:phone:flex-col">
          <span>{"庫存管理系統 · HIS 與 OTC 庫存系統"}</span>
          <span>{"規劃草稿 05 · 作業細節待確認"}</span>
        </footer>
        {"\n  "}
      </div>
      {"\n"}
    </>
  );
}
