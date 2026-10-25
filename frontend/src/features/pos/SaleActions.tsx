import { ChevronDown, RotateCcw, Ban, Banknote } from "lucide-react";
import { BaseButton } from "@/components/ui/BaseButton";
import {
  BaseDropdownMenu,
  BaseDropdownMenuTrigger,
  BaseDropdownMenuPortal,
  BaseDropdownMenuContent,
  BaseDropdownMenuLabel,
  BaseDropdownMenuItem,
  BaseDropdownMenuSeparator,
} from "@/components/ui/BaseDropdownMenu";
import { money, pendingRefund, saleActionReason } from "./model";
import type { Sale, SaleAction } from "@/types/pos";

export function SaleActions({
  sale,
  authorized,
  onAction,
}: {
  sale: Sale;
  authorized: boolean;
  onAction: (action: SaleAction) => void;
}) {
  return (
    <BaseDropdownMenu>
      <BaseDropdownMenuTrigger asChild>
        <BaseButton
          variant="outline"
          size="sm"
          aria-label={`銷售作業 ${sale.number}`}
        >
          作業
          <ChevronDown size={16} aria-hidden="true" />
        </BaseButton>
      </BaseDropdownMenuTrigger>
      <BaseDropdownMenuPortal>
        <BaseDropdownMenuContent
          variant="menu"
          sideOffset={6}
          align="end"
          className="sales-action-menu"
        >
          <BaseDropdownMenuLabel>銷售單作業</BaseDropdownMenuLabel>
          {(
            [
              ["return", "銷售退貨", RotateCcw],
              ["void", "作廢交易", Ban],
              ["refund", "確認退款", Banknote],
            ] as const
          ).map(([action, label, Icon]) => {
            const reason = saleActionReason(sale, action, authorized);
            return (
              <BaseDropdownMenuItem
                key={action}
                disabled={Boolean(reason)}
                onSelect={() => onAction(action)}
              >
                <Icon size={16} aria-hidden="true" />
                <span>
                  {label}
                  {reason && <small>{reason}</small>}
                </span>
              </BaseDropdownMenuItem>
            );
          })}
          <BaseDropdownMenuSeparator />
          <p>
            {pendingRefund(sale) > 0
              ? `待退款 ${money(pendingRefund(sale))}`
              : "退貨及作廢會保留原始交易紀錄"}
          </p>
        </BaseDropdownMenuContent>
      </BaseDropdownMenuPortal>
    </BaseDropdownMenu>
  );
}
