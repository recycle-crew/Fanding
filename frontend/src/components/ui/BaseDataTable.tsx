import {
  TableRow,
  TableHead,
  TableCell,
  Table,
  TableCaption,
  TableHeader,
  TableBody,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { useLocation } from "react-router";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { downloadTable } from "@/helpers/excel";
type PageState = { page: number; pageSize: number };
export const BasePaginationContext = createContext<{
  revision: number;
  states: Map<string, PageState>;
}>({ revision: 0, states: new Map() });
export function BaseDataTable({
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
    <BaseTableFrame
      tableKey={tableKey}
      headers={
        <TableRow>
          {headers.map((header) => (
            <TableHead
              key={header}
              scope="col"
              data-export-ignore={
                header === "操作" && editableColumns ? "true" : undefined
              }
            >
              {header}
              {editableColumns && header !== "操作" && (
                <span
                  className={`mt-1 block text-[11px] leading-[1.4] font-medium ${editableColumns.includes(header) ? "text-[#24688b]" : "text-[#657480]"}`}
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
            </TableHead>
          ))}
        </TableRow>
      }
      rows={rows.map((row, index) => (
        <TableRow key={index}>
          {row.map((cell, i) => (
            <TableCell key={i}>{cell}</TableCell>
          ))}
        </TableRow>
      ))}
      columns={headers.length}
    />
  );
}
export function BaseTableFrame({
  tableKey,
  headers,
  rows,
  columns,
  caption,
  region = "資料表，可左右捲動",
  className = "",
}: {
  tableKey: string;
  headers: ReactNode;
  rows: ReactNode[];
  columns: number;
  caption?: ReactNode;
  region?: string;
  className?: string;
}) {
  const { states, revision } = useContext(BasePaginationContext);
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
  const routeLocation = useLocation();
  useEffect(() => {
    const reveal = () => {
      let id: string;
      try {
        id = decodeURIComponent(routeLocation.hash.slice(1));
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
  }, [pagination.pageSize, routeLocation.hash]);
  return (
    <>
      <div
        className={`table-wrap overflow-x-auto print:overflow-visible ${className}`}
        data-pagination-key={tableKey}
        tabIndex={0}
        role="region"
        aria-label={region}
      >
        <Table ref={table}>
          {caption && <TableCaption>{caption}</TableCaption>}
          <TableHeader>{headers}</TableHeader>
          <TableBody>
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
              <TableRow>
                <TableCell
                  colSpan={columns}
                  className="empty p-9 text-center text-[var(--muted)]"
                >
                  目前沒有符合的資料
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="table-pagination m-[14px_0_20px] flex flex-wrap items-center gap-x-5 gap-y-3 text-[12px] text-[var(--muted)] print:hidden">
        <span className="mr-auto tabular-nums" role="status" aria-live="polite">
          {rows.length
            ? `第 ${offset + 1}–${Math.min(offset + pagination.pageSize, rows.length)} 筆，共 ${rows.length} 筆`
            : "共 0 筆"}
        </span>
        <Button
          variant="outline"
          type="button"
          className="border border-[var(--line)] bg-white p-[6px_10px] text-[var(--ink)] disabled:cursor-default disabled:opacity-45"
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
        </Button>
        <Label className="flex items-center gap-2 whitespace-nowrap text-[12px] font-medium">
          每頁筆數
          <NativeSelect
            className="w-auto min-w-[60px] border border-[#bac9d4] bg-white p-[6px_9px] text-[var(--ink)]"
            data-page-size
            value={pagination.pageSize}
            onChange={(event) =>
              setPagination({ page: 1, pageSize: Number(event.target.value) })
            }
          >
            {[5, 10, 20, 50].map((size) => (
              <NativeSelectOption key={size}>{size}</NativeSelectOption>
            ))}
          </NativeSelect>
        </Label>
        <nav
          className="flex flex-wrap items-center justify-start gap-2"
          aria-label="表格分頁"
        >
          <Button
            variant="outline"
            type="button"
            className="border border-[var(--line)] bg-white p-[6px_10px] text-[var(--ink)] disabled:cursor-default disabled:opacity-45"
            data-page-previous
            disabled={page === 1}
            onClick={() => {
              setPagination({ ...pagination, page: page - 1 });
              if (page === 2)
                requestAnimationFrame(() => pageSelector.current?.focus());
            }}
          >
            上一頁
          </Button>
          <Label className="flex items-center gap-2 whitespace-nowrap text-[12px] font-medium">
            頁碼
            <NativeSelect
              className="w-auto min-w-[60px] border border-[#bac9d4] bg-white p-[6px_9px] text-[var(--ink)]"
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
                <NativeSelectOption key={i}>{i + 1}</NativeSelectOption>
              ))}
            </NativeSelect>
            <span className="pagination-total">／ {pageCount} 頁</span>
          </Label>
          <Button
            variant="outline"
            type="button"
            className="border border-[var(--line)] bg-white p-[6px_10px] text-[var(--ink)] disabled:cursor-default disabled:opacity-45"
            data-page-next
            disabled={page === pageCount}
            onClick={() => {
              setPagination({ ...pagination, page: page + 1 });
              if (page === pageCount - 1)
                requestAnimationFrame(() => pageSelector.current?.focus());
            }}
          >
            下一頁
          </Button>
        </nav>
        <span
          className="export-status basis-full text-[var(--muted)]"
          role="status"
          aria-live="polite"
        >
          {status}
        </span>
      </div>
    </>
  );
}
