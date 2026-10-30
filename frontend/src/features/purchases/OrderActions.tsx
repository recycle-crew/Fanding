import {
  BaseDropdownMenu,
  BaseDropdownMenuTrigger,
  BaseDropdownMenuPortal,
  BaseDropdownMenuContent,
  BaseDropdownMenuLabel,
  BaseDropdownMenuItem,
  BaseDropdownMenuSeparator,
} from "@/components/ui/BaseDropdownMenu";
import { ChevronDown } from "lucide-react";
import { BaseButton } from "@/components/ui/BaseButton";
import type { Purchase } from "@/types/purchases";
import { reversalStatus, lineBalance } from "./model";
export type OrderAction =
  "view" | "edit" | "settle" | "reversal" | "return" | "correction";
export function OrderActions({
  order,
  onAction,
}: {
  order: Purchase;
  onAction: (action: OrderAction) => void;
}) {
  return (
    <BaseDropdownMenu>
      <BaseDropdownMenuTrigger asChild>
        <BaseButton
          variant="outline"
          size="sm"
          aria-label={`更多作業 ${order.number}`}
        >
          作業
          <ChevronDown size={16} aria-hidden="true" />
        </BaseButton>
      </BaseDropdownMenuTrigger>
      <BaseDropdownMenuPortal>
        <BaseDropdownMenuContent variant="menu" sideOffset={6} align="end">
          <BaseDropdownMenuLabel>進貨單作業</BaseDropdownMenuLabel>
          {(
            [
              ["view", "查看進貨明細"],
              ["edit", "修改出貨與發票資料"],
              ["settle", "核對單據"],
              ["reversal", "進貨沖銷"],
              ["return", "進貨退貨"],
              ["correction", "核對後更正"],
            ] as const
          ).map(([key, text]) => (
            <BaseDropdownMenuItem
              key={key}
              disabled={
                (key !== "view" && reversalStatus(order) === "全部沖銷") ||
                ((key === "return" || key === "reversal") &&
                  !order.lines.some(
                    (line) => lineBalance(order, line).remaining > 0,
                  )) ||
                ((key === "settle" || key === "reversal") &&
                  !!order.settlement) ||
                (key === "edit" &&
                  (!!order.settlement ||
                    order.records.some(
                      (record) => record.kind === "reversal",
                    ))) ||
                (key === "correction" && !order.settlement)
              }
              onSelect={() => onAction(key)}
            >
              {text}
            </BaseDropdownMenuItem>
          ))}
          <BaseDropdownMenuSeparator />
          <small>
            {reversalStatus(order) === "全部沖銷"
              ? "全部沖銷：保留明細與歷史紀錄"
              : order.settlement
                ? "已核對：請透過更正保留原紀錄"
                : "尚未核對：可核對或處理沖銷"}
          </small>
        </BaseDropdownMenuContent>
      </BaseDropdownMenuPortal>
    </BaseDropdownMenu>
  );
}
