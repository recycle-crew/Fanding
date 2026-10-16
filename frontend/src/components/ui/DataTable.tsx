import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { CSSProperties, ReactNode } from "react";
import { downloadTable } from "./excel";
type PageState = { page: number; pageSize: number };
export const PaginationContext = createContext<{
  revision: number;
  states: Map<string, PageState>;
}>({ revision: 0, states: new Map() });
export function DataTable({
  headers,
  rows,
  editableColumns = null,
  tableKey,
  privileged = false,
}: {
  headers: string[];
  rows: ReactNode[][];
  editableColumns?: string[] | null;
  tableKey: string;
  privileged?: boolean;
}) {
  return (
    <TableFrame
      tableKey={tableKey}
      headers={
        <tr>
          {headers.map((header) => (
            <th
              key={header}
              scope="col"
              data-export-ignore={
                header === "操作" && editableColumns ? "true" : undefined
              }
            >
              {header}
              {editableColumns && header !== "操作" && (
                <span
                  className={`field-access ${editableColumns.includes(header) ? "editable" : "readonly"}`}
                >
                  {editableColumns.includes(header)
                    ? header === "確認盤點"
                      ? "可確認"
                      : header === "實盤數量"
                        ? "送出前可填寫"
                        : privileged
                          ? "高權限可修改"
                          : "空白可補填"
                    : "唯讀"}
                </span>
              )}
            </th>
          ))}
        </tr>
      }
      rows={rows.map((row, index) => (
        <tr key={index}>
          {row.map((cell, i) => (
            <td key={i}>{cell}</td>
          ))}
        </tr>
      ))}
      columns={headers.length}
    />
  );
}
export function TableFrame({
  tableKey,
  headers,
  rows,
  columns,
  caption,
  region = "資料表，可左右捲動",
  style,
}: {
  tableKey: string;
  headers: ReactNode;
  rows: ReactNode[];
  columns: number;
  caption?: ReactNode;
  region?: string;
  style?: CSSProperties;
}) {
  const { states, revision } = useContext(PaginationContext);
  const [pagination, setPagination] = useState<PageState>(
    () => states.get(tableKey) ?? { page: 1, pageSize: 5 },
  );
  const [status, setStatus] = useState("");
  const [exporting, setExporting] = useState(false);
  const table = useRef<HTMLTableElement>(null);
  // 到達首／末頁時將焦點移至頁碼，避免落在已停用的按鈕。
  const pageSelector = useRef<HTMLSelectElement>(null);
  const pageCount = Math.max(1, Math.ceil(rows.length / pagination.pageSize));
  const page = Math.min(pagination.page, pageCount);
  const offset = (page - 1) * pagination.pageSize;
  useEffect(() => {
    setPagination((previous) => ({ ...previous, page: 1 }));
  }, [revision]);
  useEffect(() => setStatus(""), [revision, tableKey, rows.length]);
  useEffect(() => {
    states.set(tableKey, pagination);
  }, [pagination, states, tableKey]);
  // 文件的章節連結可能指向表格內的列，先顯示該列所在頁再捲動。
  useEffect(() => {
    const reveal = () => {
      let id: string;
      try {
        id = decodeURIComponent(location.hash.slice(1));
      } catch {
        return;
      }
      const target = document.getElementById(id);
      const row = target?.closest("tbody tr");
      if (!row || !table.current?.contains(row)) return;
      const index = Array.from(table.current.tBodies[0].rows).indexOf(
        row as HTMLTableRowElement,
      );
      setPagination((previous) => ({
        ...previous,
        page: Math.floor(index / previous.pageSize) + 1,
      }));
      requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, [pagination.pageSize]);
  return (
    <>
      <div
        className="table-wrap"
        data-pagination-key={tableKey}
        tabIndex={0}
        role="region"
        aria-label={region}
        style={style}
      >
        <table ref={table}>
          {caption && <caption>{caption}</caption>}
          <thead>{headers}</thead>
          <tbody>
            {rows.length ? (
              rows.map((row, index) =>
                React.isValidElement<{ hidden?: boolean }>(row)
                  ? React.cloneElement(row, {
                      key: index,
                      hidden:
                        index < offset || index >= offset + pagination.pageSize,
                    })
                  : row,
              )
            ) : (
              <tr>
                <td colSpan={columns} className="empty">
                  目前沒有符合的資料
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="table-pagination">
        <span className="pagination-summary" role="status" aria-live="polite">
          {rows.length
            ? `第 ${offset + 1}–${Math.min(offset + pagination.pageSize, rows.length)} 筆，共 ${rows.length} 筆`
            : "共 0 筆"}
        </span>
        <button
          type="button"
          data-export-excel
          disabled={exporting}
          title="匯出目前篩選條件下的全部資料，包含所有分頁"
          onClick={async () => {
            if (!table.current) return;
            setExporting(true);
            setStatus("");
            try {
              const count = await downloadTable(table.current);
              setStatus(`已產生 XLSX，共 ${count} 筆（含所有分頁）。`);
            } catch (error) {
              setStatus(
                `匯出失敗：${error instanceof Error ? error.message : String(error)}。請重試。`,
              );
            } finally {
              setExporting(false);
            }
          }}
        >
          {exporting ? "匯出中…" : "匯出 Excel (.xlsx)"}
        </button>
        <label>
          每頁筆數
          <select
            data-page-size
            value={pagination.pageSize}
            onChange={(event) =>
              setPagination({ page: 1, pageSize: Number(event.target.value) })
            }
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size}>{size}</option>
            ))}
          </select>
        </label>
        <nav className="pagination-navigation" aria-label="表格分頁">
          <button
            type="button"
            data-page-previous
            disabled={page === 1}
            onClick={() => {
              setPagination({ ...pagination, page: page - 1 });
              if (page === 2)
                requestAnimationFrame(() => pageSelector.current?.focus());
            }}
          >
            上一頁
          </button>
          <label>
            頁碼
            <select
              ref={pageSelector}
              data-page-number
              value={page}
              disabled={pageCount === 1}
              onChange={(event) =>
                setPagination({
                  ...pagination,
                  page: Number(event.target.value),
                })
              }
            >
              {Array.from({ length: pageCount }, (_, i) => (
                <option key={i}>{i + 1}</option>
              ))}
            </select>
            <span className="pagination-total">／ {pageCount} 頁</span>
          </label>
          <button
            type="button"
            data-page-next
            disabled={page === pageCount}
            onClick={() => {
              setPagination({ ...pagination, page: page + 1 });
              if (page === pageCount - 1)
                requestAnimationFrame(() => pageSelector.current?.focus());
            }}
          >
            下一頁
          </button>
        </nav>
        <span className="export-status" role="status" aria-live="polite">
          {status}
        </span>
      </div>
    </>
  );
}
