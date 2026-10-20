import { useState } from "react";
import { BaseField as Field } from "@/components/ui/BaseForm";
import { BaseInput } from "@/components/ui/BaseInput";
import {
  BaseNativeSelect as Select,
  BaseNativeSelectOption as Option,
} from "@/components/ui/BaseNativeSelect";
import { BaseButton } from "@/components/ui/BaseButton";
import { BaseDataTable } from "@/components/ui/BaseDataTable";
import { useAppSelector } from "@/store/hooks";
import { relativeDate, taipeiToday } from "@/features/items/model";
import { paymentMethods, refunded, saleStatus } from "./model";
const initial = () => ({
  search: "",
  from: relativeDate(-30),
  to: taipeiToday(),
  method: "",
  status: "",
  cashier: "",
});
export function SalesList({ onView }: { onView: (id: string) => void }) {
  const sales = useAppSelector((root) => root.pos.sales),
    [filters, setFilters] = useState(initial);
  const [sort, setSort] = useState("newest");
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
        [
          sale.number,
          sale.customer.name,
          ...sale.lines.map((line) => `${line.name} ${line.code}`),
        ]
          .join(" ")
          .toLowerCase()
          .includes(filters.search.trim().toLowerCase()),
    )
    .sort((a, b) =>
      sort === "oldest"
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date),
    );
  return (
    <>
      <div className="pos-filters">
        <Field name="sales-search" label="搜尋銷售紀錄">
          <BaseInput
            placeholder="單號、商品、料號或顧客"
            value={filters.search}
            onChange={(event) =>
              setFilters({ ...filters, search: event.target.value })
            }
          />
        </Field>
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
        {(
          [
            ["method", "付款方式", paymentMethods],
            ["status", "銷售狀態", ["完成", "部分退貨", "全部退貨", "作廢"]],
            [
              "cashier",
              "收銀人員",
              [...new Set(sales.map((sale) => sale.cashier))],
            ],
          ] as const
        ).map(([key, label, values]) => (
          <Field name={`sales-${key}`} key={key} label={label}>
            <Select
              value={filters[key]}
              onChange={(event) =>
                setFilters({ ...filters, [key]: event.target.value })
              }
            >
              <Option value="">全部</Option>
              {values.map((value) => (
                <Option key={value}>{value}</Option>
              ))}
            </Select>
          </Field>
        ))}
        <Field name="sales-sort" label="日期排序">
          <Select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <Option value="newest">新到舊</Option>
            <Option value="oldest">舊到新</Option>
          </Select>
        </Field>
        <BaseButton variant="outline" onClick={() => setFilters(initial())}>
          清除
        </BaseButton>
      </div>
      {invalidDates && (
        <p role="alert" className="items-error">
          請填寫有效日期區間；開始日期不可晚於結束日期。
        </p>
      )}
      <p>
        共 {list.length} 筆；待退款不列為實際支付退款，作廢交易的淨銷售為零。
      </p>
      <BaseDataTable
        tableKey="pos-sales"
        headers={[
          "銷售單號",
          "銷售日期",
          "顧客",
          "品項數",
          "原始成交金額",
          "已退款金額",
          "待退款金額",
          "淨銷售金額",
          "付款方式",
          "狀態",
          "收銀人員",
          "操作",
        ]}
        rows={list.map((sale) => [
          sale.number,
          sale.date,
          sale.customer.name,
          sale.lines.length,
          sale.total,
          refunded(sale),
          sale.refunds
            .filter((refund) => refund.status === "待退款")
            .reduce((sum, refund) => sum + refund.amount, 0),
          sale.void ? 0 : Math.round((sale.total - refunded(sale)) * 100) / 100,
          sale.payment.method,
          saleStatus(sale),
          sale.cashier,
          <BaseButton
            variant="outline"
            aria-label={`查看銷售 ${sale.number}`}
            onClick={() => onView(sale.id)}
          >
            查看／退貨／作廢
          </BaseButton>,
        ])}
      />
    </>
  );
}
