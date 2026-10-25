import { useSearchParams } from "react-router";
import "./sales.css";
import { SaleActions } from "./SaleActions";
import type { SaleAction } from "@/types/pos";
import { ArrowDownUp, Clock3, Eye } from "lucide-react";
import { BaseField as Field } from "@/components/ui/BaseForm";
import { BaseInput } from "@/components/ui/BaseInput";
import {
  BaseNativeSelect as Select,
  BaseNativeSelectOption as Option,
} from "@/components/ui/BaseNativeSelect";
import { BaseButton } from "@/components/ui/BaseButton";
import { BaseTableFrame } from "@/components/ui/BaseDataTable";
import {
  BaseTableRow,
  BaseTableHead,
  BaseTableCell,
} from "@/components/ui/BaseTable";
import { useAppSelector } from "@/store/hooks";
import { relativeDate, taipeiToday } from "@/features/items/model";
import {
  money,
  cents,
  paymentMethods,
  pendingRefund,
  refundStatus,
  saleStatus,
} from "./model";
const initial = () => ({
  search: "",
  from: relativeDate(-30),
  to: taipeiToday(),
  method: "",
  status: "",
  cashier: "",
  refund: "",
});
export function SalesList({
  onView,
  onAction,
  authorized,
}: {
  onView: (id: string) => void;
  onAction: (id: string, action: SaleAction) => void;
  authorized: boolean;
}) {
  const sales = useAppSelector((root) => root.pos.sales);
  const [params, setParams] = useSearchParams();
  const defaults = initial();
  const filters = Object.fromEntries(
    Object.entries(defaults).map(([key, value]) => [
      key,
      params.get(`sales-${key}`) ?? value,
    ]),
  ) as ReturnType<typeof initial>;
  const sort = params.get("sales-sort") || "newest";
  function setSort(value: string) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.set("sales-sort", value);
        return next;
      },
      { replace: true },
    );
  }
  function setFilters(next: ReturnType<typeof initial>) {
    setParams(
      (previous) => {
        const result = new URLSearchParams(previous);
        for (const [key, value] of Object.entries(next)) {
          if (value === defaults[key as keyof typeof defaults])
            result.delete(`sales-${key}`);
          else result.set(`sales-${key}`, value);
        }
        return result;
      },
      { replace: true },
    );
  }
  const invalidDates =
    !filters.from || !filters.to || filters.from > filters.to;
  const list = sales
    .filter(
      (sale) =>
        !invalidDates &&
        sale.date.slice(0, 10) >= filters.from &&
        sale.date.slice(0, 10) <= filters.to &&
        (!filters.method || sale.payment.method === filters.method) &&
        (!filters.status || saleStatus(sale) === filters.status) &&
        (!filters.cashier || sale.cashier === filters.cashier) &&
        (!filters.refund ||
          (filters.refund === "待處理"
            ? pendingRefund(sale) > 0
            : refundStatus(sale) === filters.refund)) &&
        [
          sale.number,
          sale.customer.name,
          sale.customer.phone,
          sale.customer.id,
          sale.payment.reference,
          ...sale.lines.map((line) => `${line.name} ${line.code}`),
        ]
          .join(" ")
          .toLowerCase()
          .includes(filters.search.trim().toLowerCase()),
    )
    .sort((a, b) => {
      if (sort === "amount-high")
        return b.total - a.total || b.date.localeCompare(a.date);
      if (sort === "amount-low")
        return a.total - b.total || b.date.localeCompare(a.date);
      return sort === "oldest"
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date);
    });
  const pending = list.filter((sale) => pendingRefund(sale) > 0);
  const pendingAmount =
    pending.reduce((sum, sale) => sum + cents(pendingRefund(sale)), 0) / 100;
  const originalAmount =
    list.reduce((sum, sale) => sum + cents(sale.total), 0) / 100;
  const choices = {
    status: {
      label: "銷售狀態",
      values: ["完成", "部分退貨", "全部退貨", "作廢"],
    },
    refund: {
      label: "退款狀態",
      values: ["待處理", "無須退款", "待退款", "部分已退款", "已退款"],
    },
    method: { label: "付款方式", values: paymentMethods },
    cashier: {
      label: "收銀人員",
      values: [...new Set(sales.map((sale) => sale.cashier))],
    },
  };
  function filterField(key: keyof typeof choices) {
    return (
      <Field key={key} name={`sales-${key}`} label={choices[key].label}>
        <Select
          value={filters[key]}
          onChange={(event) =>
            setFilters({ ...filters, [key]: event.target.value })
          }
        >
          <Option value="">全部</Option>
          {choices[key].values.map((value) => (
            <Option key={value}>{value}</Option>
          ))}
        </Select>
      </Field>
    );
  }
  return (
    <div className="sales-list">
      <div className="purchase-summary sales-summary" aria-live="polite">
        <span>
          共 <strong>{list.length}</strong> 筆銷售紀錄
        </span>
        <span>
          原始成交合計 <strong>{money(originalAmount)}</strong>
        </span>
        <span className="purchase-summary-pending">
          <Clock3 size={15} aria-hidden="true" />
          待退款 {pending.length} 筆・{money(pendingAmount)}
        </span>
      </div>
      <div className="sales-searchbar">
        <Field name="sales-search" label="搜尋銷售紀錄">
          <BaseInput
            placeholder="單號、商品、顧客姓名／電話／編號、付款參考號碼"
            value={filters.search}
            onChange={(event) =>
              setFilters({ ...filters, search: event.target.value })
            }
          />
        </Field>
        <div className="sales-date-shortcuts" aria-label="快速篩選銷售紀錄">
          {[
            ["今天", 0],
            ["昨天", -1],
            ["近 7 天", -6],
          ].map(([label, offset]) => (
            <BaseButton
              key={label}
              variant="outline"
              onClick={() =>
                setFilters({
                  ...filters,
                  from: relativeDate(Number(offset)),
                  to: label === "昨天" ? relativeDate(-1) : taipeiToday(),
                })
              }
            >
              {label}
            </BaseButton>
          ))}
          <BaseButton
            variant={filters.refund === "待處理" ? "default" : "outline"}
            aria-pressed={filters.refund === "待處理"}
            onClick={() =>
              setFilters({
                ...filters,
                refund: filters.refund === "待處理" ? "" : "待處理",
              })
            }
          >
            待退款（目前日期區間）
          </BaseButton>
        </div>
      </div>
      <div className="items-filter-bar sales-filters">
        <Field name="sales-from" label="開始日期">
          <BaseInput
            type="date"
            value={filters.from}
            onChange={(event) =>
              setFilters({ ...filters, from: event.target.value })
            }
          />
        </Field>
        <Field name="sales-to" label="結束日期">
          <BaseInput
            type="date"
            value={filters.to}
            onChange={(event) =>
              setFilters({ ...filters, to: event.target.value })
            }
          />
        </Field>
        {filterField("status")}
        {filterField("refund")}
        <BaseButton
          variant="ghost"
          onClick={() =>
            setParams(
              (previous) => {
                const next = new URLSearchParams(previous);
                for (const key of [...next.keys()])
                  if (key.startsWith("sales-")) next.delete(key);
                return next;
              },
              { replace: true },
            )
          }
        >
          重設篩選
        </BaseButton>
        <details className="purchase-advanced-filters sales-advanced-filters">
          <summary>
            更多篩選
            {[filters.method, filters.cashier].filter(Boolean).length > 0 &&
              `（已套用 ${[filters.method, filters.cashier].filter(Boolean).length} 項）`}
          </summary>
          <div>
            {filterField("method")}
            {filterField("cashier")}
          </div>
        </details>
      </div>
      {invalidDates && (
        <p role="alert" className="items-error">
          請填寫有效日期區間；開始日期不可晚於結束日期。
        </p>
      )}
      <div className="sales-list-note">
        <span>金額單位：NT$；成交金額為原始交易金額，退款另列狀態。</span>
        <span>日期與金額可點選表頭排序</span>
      </div>
      <div className="sales-mobile-sort">
        <Field name="sales-sort" label="日期／金額排序">
          <Select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <Option value="newest">銷售日期：新到舊</Option>
            <Option value="oldest">銷售日期：舊到新</Option>
            <Option value="amount-high">成交金額：高到低</Option>
            <Option value="amount-low">成交金額：低到高</Option>
          </Select>
        </Field>
      </div>
      <div className="purchase-list-card sales-list-card">
        <BaseTableFrame
          key={`${JSON.stringify(filters)}-${sort}`}
          tableKey={`pos-sales-${JSON.stringify(filters)}-${sort}`}
          columns={9}
          region="銷售紀錄列表，可左右捲動"
          variant="sticky-actions"
          className="sales-table"
          headers={
            <BaseTableRow>
              {[
                "銷售單號",
                "銷售日期",
                "顧客",
                "品項數",
                "原始成交金額",
                "付款方式",
                "銷售狀態",
                "退款狀態",
                "操作",
              ].map((header, index) => {
                const dateColumn = index === 1;
                const amountColumn = index === 4;
                const activeSort = dateColumn
                  ? ["newest", "oldest"].includes(sort)
                  : amountColumn &&
                    ["amount-high", "amount-low"].includes(sort);
                return (
                  <BaseTableHead
                    key={header}
                    scope="col"
                    data-export-ignore={index === 8 ? "true" : undefined}
                    aria-sort={
                      activeSort
                        ? ["oldest", "amount-low"].includes(sort)
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                  >
                    {dateColumn || amountColumn ? (
                      <BaseButton
                        type="button"
                        variant="sort"
                        size="sm"
                        onClick={() =>
                          setSort(
                            dateColumn
                              ? sort === "newest"
                                ? "oldest"
                                : "newest"
                              : sort === "amount-high"
                                ? "amount-low"
                                : "amount-high",
                          )
                        }
                      >
                        {header}
                        <ArrowDownUp size={12} aria-hidden="true" />
                      </BaseButton>
                    ) : (
                      header
                    )}
                  </BaseTableHead>
                );
              })}
            </BaseTableRow>
          }
          rows={list.map((sale) => {
            const status = saleStatus(sale);
            const refund = refundStatus(sale);
            const waiting = pendingRefund(sale);
            return (
              <BaseTableRow key={sale.id}>
                <BaseTableCell data-label="銷售單號" className="items-code">
                  <strong>{sale.number}</strong>
                </BaseTableCell>
                <BaseTableCell data-label="銷售日期">
                  <time dateTime={`${sale.date.replace(" ", "T")}+08:00`}>
                    {sale.date.slice(0, 10)}{" "}
                    <small>{sale.date.slice(11)}</small>
                  </time>
                </BaseTableCell>
                <BaseTableCell data-label="顧客">
                  {sale.customer.name}
                </BaseTableCell>
                <BaseTableCell data-label="品項數">
                  {sale.lines.length}
                </BaseTableCell>
                <BaseTableCell data-label="原始成交金額" variant="money">
                  <strong>{sale.total.toFixed(2)}</strong>
                </BaseTableCell>
                <BaseTableCell data-label="付款方式">
                  {sale.payment.method}
                </BaseTableCell>
                <BaseTableCell data-label="銷售狀態">
                  <span
                    className={`items-status ${status === "作廢" ? "neutral" : status === "完成" ? "" : "info"}`}
                  >
                    {status}
                  </span>
                </BaseTableCell>
                <BaseTableCell data-label="退款狀態">
                  <span
                    className={`items-status ${waiting > 0 ? "warning" : refund === "無須退款" ? "neutral" : ""}`}
                  >
                    {refund}
                  </span>
                  {waiting > 0 && (
                    <small className="sales-pending-amount">
                      待退 {money(waiting)}
                    </small>
                  )}
                </BaseTableCell>
                <BaseTableCell>
                  <div className="purchase-row-actions">
                    <BaseButton
                      variant="outline"
                      size="sm"
                      aria-label={`查看銷售 ${sale.number}`}
                      onClick={() => onView(sale.id)}
                    >
                      <Eye size={16} aria-hidden="true" />
                      明細
                    </BaseButton>
                    <SaleActions
                      sale={sale}
                      authorized={authorized}
                      onAction={(action) => onAction(sale.id, action)}
                    />
                  </div>
                </BaseTableCell>
              </BaseTableRow>
            );
          })}
        />
      </div>
    </div>
  );
}
