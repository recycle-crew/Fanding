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
export type OrderAction =
  "view" | "settle" | "reversal" | "return" | "correction";
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
              ["settle", "核對單據"],
              ["reversal", "進貨沖銷"],
              ["return", "進貨退貨"],
              ["correction", "結帳後更正"],
            ] as const
          ).map(([key, text]) => (
            <BaseDropdownMenuItem
              key={key}
              disabled={
                ((key === "settle" || key === "reversal") &&
                  !!order.settlement) ||
                (key === "correction" && !order.settlement)
              }
              onSelect={() => onAction(key)}
            >
              {text}
            </BaseDropdownMenuItem>
          ))}
          <BaseDropdownMenuSeparator />
          <small>
            {order.settlement
              ? "已結帳：請透過更正保留原紀錄"
              : "尚未結帳：可核對或處理沖銷"}
          </small>
        </BaseDropdownMenuContent>
      </BaseDropdownMenuPortal>
    </BaseDropdownMenu>
  );
}
