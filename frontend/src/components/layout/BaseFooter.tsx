import { Link } from "react-router";
import architectureDocument from "../../../../docs/architecture.md?url";

export function BaseFooter({
  variant,
}: {
  variant: "planning" | "architecture";
}) {
  return (
    <footer className="flex flex-col flex-wrap justify-between gap-5 sm:flex-row">
      {variant === "architecture" ? (
        <>
          <span>庫存管理系統 · 程式架構規劃</span>
          <a href={architectureDocument}>Markdown 原始文件 ↗</a>
          <Link to="/">← 返回功能規劃</Link>
        </>
      ) : (
        <>
          <span>庫存管理系統 · HIS 與 OTC 庫存系統</span>
          <span>規劃草稿 05 · 作業細節待確認</span>
        </>
      )}
    </footer>
  );
}
