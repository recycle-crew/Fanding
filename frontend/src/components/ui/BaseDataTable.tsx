import {
  BaseTableRow,
  BaseTableHead,
  BaseTableCell,
  BaseTable,
  BaseTableCaption,
  BaseTableHeader,
  BaseTableBody,
} from "@/components/ui/BaseTable";
import { BaseButton } from "@/components/ui/BaseButton";
import { BaseLabel } from "@/components/ui/BaseLabel";
import {
  BaseNativeSelect,
  BaseNativeSelectOption,
} from "@/components/ui/BaseNativeSelect";
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
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
type PageState = { page: number; pageSize: number };
export const BasePaginationContext = createContext<{
  revision: number;
  states: Map<string, PageState>;
}>({ revision: 0, states: new Map() });
const tableColumnHintVariants = cva(
  "mt-1 block text-[11px] leading-[1.4] font-medium",
  {
    variants: {
      editable: {
        true: "text-[#24688b]",
        false: "text-[#657480]",
      },
    },
  },
);

export function BaseDataTable({
  headers,
  rows,
  editableColumns = null,
  tableKey,
  privileged = false,
  exportable = true,
}: {
  headers: string[];
  rows: ReactNode[][];
  editableColumns?: string[] | null;
  tableKey: string;
  privileged?: boolean;
  exportable?: boolean;
}) {
  return (
    <BaseTableFrame
      tableKey={tableKey}
      exportable={exportable}
      headers={
        <BaseTableRow>
          {headers.map((header) => (
            <BaseTableHead
              key={header}
              scope="col"
              data-export-ignore={header === "操作" ? "true" : undefined}
            >
              {header}
              {editableColumns && header !== "操作" && (
                <span
                  className={cn(
                    tableColumnHintVariants({
                      editable: editableColumns.includes(header),
                    }),
                  )}
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
            </BaseTableHead>
          ))}
        </BaseTableRow>
      }
      rows={rows.map((row, index) => (
        <BaseTableRow key={index}>
          {row.map((cell, i) => (
            <BaseTableCell key={i}>{cell}</BaseTableCell>
          ))}
        </BaseTableRow>
      ))}
      columns={headers.length}
    />
  );
}
const tableFrameVariants = cva(
  "table-wrap overflow-x-auto print:overflow-visible",
  {
    variants: {
      variant: { default: "", "sticky-actions": "purchase-main-table" },
    },
    defaultVariants: { variant: "default" },
  },
);

const tablePaginationVariants = cva(
  "table-pagination m-[14px_0_20px] flex flex-wrap items-center gap-x-5 gap-y-3 text-[12px] text-[var(--muted)] print:hidden",
);

const tablePaginationSummaryVariants = cva("mr-auto tabular-nums");

const tablePaginationNavigationVariants = cva(
  "flex flex-wrap items-center justify-start gap-2",
);

const tablePaginationTotalVariants = cva("pagination-total");

const tableExportStatusVariants = cva(
  "export-status basis-full text-[var(--muted)]",
);

export function BaseTableFrame({
  tableKey,
  headers,
  rows,
  columns,
  caption,
  region = "資料表，可左右捲動",
  className = "",
  variant = "default",
  exportable = true,
}: VariantProps<typeof tableFrameVariants> & {
  tableKey: string;
  headers: ReactNode;
  rows: ReactNode[];
  columns: number;
  caption?: ReactNode;
  region?: string;
  className?: string;
  exportable?: boolean;
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
        className={cn(tableFrameVariants({ variant }), className)}
        data-variant={variant}
        data-pagination-key={tableKey}
        tabIndex={0}
        role="region"
        aria-label={region}
      >
        <BaseTable ref={table}>
          {caption && <BaseTableCaption>{caption}</BaseTableCaption>}
          <BaseTableHeader>{headers}</BaseTableHeader>
          <BaseTableBody>
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
              <BaseTableRow>
                <BaseTableCell variant="empty" colSpan={columns}>
                  目前沒有符合的資料
                </BaseTableCell>
              </BaseTableRow>
            )}
          </BaseTableBody>
        </BaseTable>
      </div>
      <div className={cn(tablePaginationVariants())}>
        <span
          className={cn(tablePaginationSummaryVariants())}
          role="status"
          aria-live="polite"
        >
          {rows.length
            ? `第 ${offset + 1}–${Math.min(offset + pagination.pageSize, rows.length)} 筆，共 ${rows.length} 筆`
            : "共 0 筆"}
        </span>
        {exportable && (
          <BaseButton
            variant="pagination"
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
          </BaseButton>
        )}
        <BaseLabel variant="pagination">
          每頁筆數
          <BaseNativeSelect
            variant="pagination"

            data-page-size
            value={pagination.pageSize}
            onChange={(event) =>
              setPagination({ page: 1, pageSize: Number(event.target.value) })
            }
          >
            {[5, 10, 20, 50].map((size) => (
              <BaseNativeSelectOption key={size}>{size}</BaseNativeSelectOption>
            ))}
          </BaseNativeSelect>
        </BaseLabel>
        <nav
          className={cn(tablePaginationNavigationVariants())}
          aria-label="表格分頁"
        >
          <BaseButton
            variant="pagination"
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
          </BaseButton>
          <BaseLabel variant="pagination">
            頁碼
            <BaseNativeSelect
              variant="pagination"
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
                <BaseNativeSelectOption key={i}>{i + 1}</BaseNativeSelectOption>
              ))}
            </BaseNativeSelect>
            <span className={cn(tablePaginationTotalVariants())}>
              ／ {pageCount} 頁
            </span>
          </BaseLabel>
          <BaseButton
            variant="pagination"
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
          </BaseButton>
        </nav>
        <span
          className={cn(tableExportStatusVariants())}
          role="status"
          aria-live="polite"
        >
          {status}
        </span>
      </div>
    </>
  );
}
