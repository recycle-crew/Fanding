import { useSearchParams } from "react-router";
import { ArrowDownUp, Eye } from "lucide-react";
import { BaseButton } from "@/components/ui/BaseButton";
import { BaseInput } from "@/components/ui/BaseInput";
import { BaseField as Field } from "@/components/ui/BaseForm";
import {
  BaseNativeSelect as Select,
  BaseNativeSelectOption as Option,
} from "@/components/ui/BaseNativeSelect";
import { BaseTableFrame } from "@/components/ui/BaseDataTable";
import {
  BaseTableRow,
  BaseTableHead,
  BaseTableCell,
} from "@/components/ui/BaseTable";
import { useAppSelector } from "@/store/hooks";
import { relativeDate, taipeiToday } from "@/features/items/model";
import {
  cents,
  money,
  paymentMethods,
  saleReturnAmount,
  saleReturnPending,
  saleReturnRefundStatus,
} from "./model";
import "./sales.css";

export function SalesReturnList({
  onView,
  onViewSale,
}: {
  onView: (saleId: string, returnId: string) => void;
  onViewSale: (saleId: string) => void;
}) {
  const sales = useAppSelector((root) => root.pos.sales);
  const [params, setParams] = useSearchParams();
  const filters = {
    search: params.get("return-search") || "",
    from: params.get("return-from") ?? relativeDate(-30),
    to: params.get("return-to") ?? taipeiToday(),
    status: params.get("return-status") || "",
    method: params.get("return-method") || "",
    sort: params.get("return-sort") || "newest",
  };
  function change(key: keyof typeof filters, value: string) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.set(`return-${key}`, value);
        return next;
      },
      { replace: true },
    );
  }
  const invalidDates =
    !filters.from || !filters.to || filters.from > filters.to;
  const rows = sales
    .flatMap((sale) => sale.returns.map((record) => ({ sale, record })))
    .filter(
      ({ sale, record }) =>
        !invalidDates &&
        record.date.slice(0, 10) >= filters.from &&
        record.date.slice(0, 10) <= filters.to &&
        (!filters.method || record.method === filters.method) &&
        (!filters.status ||
          (filters.status === "待處理"
            ? saleReturnPending(sale, record) > 0
            : saleReturnRefundStatus(sale, record) === filters.status)) &&
        [
          record.number,
          sale.number,
          sale.customer.name,
          sale.customer.phone,
          sale.customer.id,
          record.reason,
          ...record.lines.map((line) => {
            const original = sale.lines.find((item) => item.id === line.lineId);
            return `${original?.name || ""} ${original?.code || ""}`;
          }),
        ]
          .join(" ")
          .toLowerCase()
          .includes(filters.search.trim().toLowerCase()),
    )
    .sort((a, b) => {
      const dateOrder =
        b.record.date.localeCompare(a.record.date) ||
        b.record.createdAt.localeCompare(a.record.createdAt) ||
        b.record.number.localeCompare(a.record.number);
      if (filters.sort === "oldest") return -dateOrder;
      if (filters.sort === "amount-high")
        return (
          saleReturnAmount(b.record) - saleReturnAmount(a.record) || dateOrder
        );
      if (filters.sort === "amount-low")
        return (
          saleReturnAmount(a.record) - saleReturnAmount(b.record) || dateOrder
        );
      return dateOrder;
    });
  const total =
    rows.reduce((sum, row) => sum + cents(saleReturnAmount(row.record)), 0) /
    100;
  const pending = rows.filter(
    (row) => saleReturnPending(row.sale, row.record) > 0,
  );
  const pendingAmount =
    pending.reduce(
      (sum, row) => sum + cents(saleReturnPending(row.sale, row.record)),
      0,
    ) / 100;
  return (
    <div className="sales-list">
      <div className="purchase-summary sales-summary" aria-live="polite">
        <span>
          共 <strong>{rows.length}</strong> 張退貨單
        </span>
        <span>
          應退款合計 <strong>{money(total)}</strong>
        </span>
        <span className="purchase-summary-pending">
          待退款 {pending.length} 張・{money(pendingAmount)}
        </span>
      </div>
      <div className="sales-searchbar">
        <Field name="return-search" label="搜尋退貨紀錄">
          <BaseInput
            value={filters.search}
            placeholder="退貨單號、原銷售單號、顧客、商品或原因"
            onChange={(event) => change("search", event.target.value)}
          />
        </Field>
        <BaseButton
          variant={filters.status === "待處理" ? "default" : "outline"}
          onClick={() =>
            change("status", filters.status === "待處理" ? "" : "待處理")
          }
        >
          待退款退貨單
        </BaseButton>
      </div>
      <div className="items-filter-bar sales-filters">
        <Field name="return-from" label="退貨日期起">
          <BaseInput
            type="date"
            value={filters.from}
            onChange={(event) => change("from", event.target.value)}
          />
        </Field>
        <Field name="return-to" label="退貨日期迄">
          <BaseInput
            type="date"
            value={filters.to}
            onChange={(event) => change("to", event.target.value)}
          />
        </Field>
        <Field name="return-status" label="退款狀態">
          <Select
            value={filters.status}
            onChange={(event) => change("status", event.target.value)}
          >
            <Option value="">全部</Option>
            {["待處理", "待退款", "部分已退款", "已退款", "無須退款"].map(
              (status) => (
                <Option key={status}>{status}</Option>
              ),
            )}
          </Select>
        </Field>
        <Field name="return-method" label="退款方式">
          <Select
            value={filters.method}
            onChange={(event) => change("method", event.target.value)}
          >
            <Option value="">全部</Option>
            {paymentMethods.map((method) => (
              <Option key={method}>{method}</Option>
            ))}
          </Select>
        </Field>
        <BaseButton
          variant="ghost"
          onClick={() =>
            setParams(
              (previous) => {
                const next = new URLSearchParams(previous);
                for (const key of [...next.keys()])
                  if (key.startsWith("return-")) next.delete(key);
                return next;
              },
              { replace: true },
            )
          }
        >
          重設退貨篩選
        </BaseButton>
      </div>
      {invalidDates && (
        <p role="alert" className="items-error">
          請填寫有效退貨日期；開始日期不可晚於結束日期。
        </p>
      )}
      <p className="sales-list-note">
        金額單位：NT$；每張退貨單各自追蹤退款，作廢交易不列入退貨單。
      </p>
      <div className="sales-mobile-sort">
        <Field name="return-sort" label="退貨排序">
          <Select
            value={filters.sort}
            onChange={(event) => change("sort", event.target.value)}
          >
            <Option value="newest">退貨日期：新到舊</Option>
            <Option value="oldest">退貨日期：舊到新</Option>
            <Option value="amount-high">應退款金額：高到低</Option>
            <Option value="amount-low">應退款金額：低到高</Option>
          </Select>
        </Field>
      </div>
      <div className="purchase-list-card sales-list-card">
        <BaseTableFrame
          key={JSON.stringify(filters)}
          tableKey={`pos-returns-${JSON.stringify(filters)}`}
          region="退貨紀錄列表，可左右捲動"
          columns={9}
          variant="sticky-actions"
          className="sales-table sales-return-table"
          headers={
            <BaseTableRow>
              {[
                "退貨單號",
                "退貨日期",
                "原銷售單號",
                "顧客",
                "應退款金額",
                "退款方式",
                "退貨品項數",
                "退款狀態",
                "操作",
              ].map((header, index) => (
                <BaseTableHead
                  key={header}
                  scope="col"
                  data-export-ignore={index === 8 ? "true" : undefined}
                  aria-sort={
                    (index === 1 &&
                      ["oldest", "newest"].includes(filters.sort)) ||
                    (index === 4 && filters.sort.startsWith("amount-"))
                      ? ["oldest", "amount-low"].includes(filters.sort)
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  {index === 1 || index === 4 ? (
                    <BaseButton
                      variant="sort"
                      size="sm"
                      onClick={() =>
                        change(
                          "sort",
                          index === 1
                            ? filters.sort === "newest"
                              ? "oldest"
                              : "newest"
                            : filters.sort === "amount-high"
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
              ))}
            </BaseTableRow>
          }
          rows={rows.map(({ sale, record }) => {
            const status = saleReturnRefundStatus(sale, record);
            return (
              <BaseTableRow key={record.id}>
                <BaseTableCell
                  data-label="退貨單號"
                  data-export-value={record.number}
                >
                  <BaseButton
                    variant="record-link"
                    size="sm"
                    aria-label={`查看退貨單 ${record.number}`}
                    onClick={() => onView(sale.id, record.id)}
                  >
                    {record.number}
                  </BaseButton>
                </BaseTableCell>
                <BaseTableCell data-label="退貨日期">
                  {record.date.slice(0, 10)}
                </BaseTableCell>
                <BaseTableCell
                  data-label="原銷售單號"
                  data-export-value={sale.number}
                >
                  <BaseButton
                    variant="record-link"
                    size="sm"
                    aria-label={`查看原銷售單 ${sale.number}`}
                    onClick={() => onViewSale(sale.id)}
                  >
                    {sale.number}
                  </BaseButton>
                </BaseTableCell>
                <BaseTableCell data-label="顧客">
                  {sale.customer.name}
                </BaseTableCell>
                <BaseTableCell data-label="應退款金額" variant="money">
                  <strong>{saleReturnAmount(record).toFixed(2)}</strong>
                </BaseTableCell>
                <BaseTableCell data-label="退款方式">
                  {record.method}
                </BaseTableCell>
                <BaseTableCell data-label="退貨品項數">
                  {record.lines.length}
                </BaseTableCell>
                <BaseTableCell data-label="退款狀態">
                  <span
                    className={`items-status ${status === "已退款" ? "" : status === "無須退款" ? "neutral" : "warning"}`}
                  >
                    {status}
                  </span>
                </BaseTableCell>
                <BaseTableCell>
                  <div className="purchase-row-actions">
                    <BaseButton
                      variant="outline"
                      size="sm"
                      aria-label={`退貨明細 ${record.number}`}
                      onClick={() => onView(sale.id, record.id)}
                    >
                      <Eye size={16} aria-hidden="true" />
                      明細
                    </BaseButton>
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
