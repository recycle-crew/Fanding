import { useSearchParams } from "react-router";
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
import {
  money,
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
export function SalesList({ onView }: { onView: (id: string) => void }) {
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
    .sort((a, b) =>
      sort === "oldest"
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date),
    );
  return (
    <>
      <div className="pos-date-shortcuts" aria-label="快速篩選銷售紀錄">
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
      <div className="pos-filters">
        <Field name="sales-search" label="搜尋銷售紀錄">
          <BaseInput
            placeholder="單號、商品、顧客姓名／電話／編號、付款參考號碼"
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
              "refund",
              "退款狀態",
              ["待處理", "無須退款", "待退款", "部分已退款", "已退款"],
            ],
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
            onChange={(event) =>
              setParams(
                (previous) => {
                  const next = new URLSearchParams(previous);
                  next.set("sales-sort", event.target.value);
                  return next;
                },
                { replace: true },
              )
            }
          >
            <Option value="newest">新到舊</Option>
            <Option value="oldest">舊到新</Option>
          </Select>
        </Field>
        <BaseButton
          variant="outline"
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
      </div>
      {invalidDates && (
        <p role="alert" className="items-error">
          請填寫有效日期區間；開始日期不可晚於結束日期。
        </p>
      )}
      <p>
        共 {list.length} 筆；待退款{" "}
        {list.filter((sale) => pendingRefund(sale) > 0).length} 筆，待退金額{" "}
        {money(list.reduce((sum, sale) => sum + pendingRefund(sale), 0))}。
      </p>
      <BaseDataTable
        tableKey="pos-sales"
        headers={[
          "銷售單號",
          "銷售日期",
          "顧客",
          "成交金額",
          "付款方式",
          "狀態",
          "退款狀態",
          "操作",
        ]}
        rows={list.map((sale) => [
          sale.number,
          sale.date,
          sale.customer.name,
          money(sale.total),
          sale.payment.method,
          saleStatus(sale),
          <span
            className={
              pendingRefund(sale) > 0 ? "pos-refund-pending" : undefined
            }
          >
            {refundStatus(sale)}
            {pendingRefund(sale) > 0 && `・${money(pendingRefund(sale))}`}
          </span>,
          <BaseButton
            variant="outline"
            aria-label={`查看銷售 ${sale.number}`}
            onClick={() => onView(sale.id)}
          >
            查看明細
          </BaseButton>,
        ])}
      />
    </>
  );
}
