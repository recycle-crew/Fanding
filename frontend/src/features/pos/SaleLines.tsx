import { Trash2 } from "lucide-react";
import { BaseButton } from "@/components/ui/BaseButton";
import { BaseInput } from "@/components/ui/BaseInput";
import { BaseField as Field } from "@/components/ui/BaseForm";
import {
  BaseTable,
  BaseTableHeader,
  BaseTableBody,
  BaseTableRow,
  BaseTableHead,
  BaseTableCell,
} from "@/components/ui/BaseTable";
import { available } from "@/features/items/model";
import { money } from "./model";
import type { Item, InventoryBatch } from "@/types/items";
import type { CartLine } from "@/types/pos";

export function SaleLines({
  cart,
  items,
  batches,
  warehouse,
  authorized,
  recentItemId,
  onChange,
}: {
  cart: CartLine[];
  items: Item[];
  batches: InventoryBatch[];
  warehouse: string;
  authorized: boolean;
  recentItemId: string;
  onChange: (cart: CartLine[]) => void;
}) {
  return (
    <div className="pos-lines-wrap">
      <BaseTable className="pos-lines-table" aria-label="銷售明細">
        <BaseTableHeader>
          <BaseTableRow>
            {["商品／規格", "數量", "成交單價", "單品折扣", "小計", "操作"].map(
              (header) => (
                <BaseTableHead key={header} scope="col">
                  {header}
                </BaseTableHead>
              ),
            )}
          </BaseTableRow>
        </BaseTableHeader>
        <BaseTableBody>
          {!cart.length && (
            <BaseTableRow>
              <BaseTableCell colSpan={6} className="pos-lines-empty">
                <strong>尚未加入商品</strong>
                <p>掃描條碼即可自動加入，或使用「挑選商品」加入銷售明細。</p>
              </BaseTableCell>
            </BaseTableRow>
          )}
          {cart.map((line) => {
            const item = items.find((entry) => entry.id === line.itemId)!;
            const candidates = batches.filter(
              (batch) =>
                batch.itemId === item.id &&
                batch.warehouse === warehouse &&
                available(batch) > 0,
            );
            const stock = candidates.reduce(
              (sum, batch) => sum + available(batch),
              0,
            );
            const overStock = line.quantity > stock;
            function change(key: keyof CartLine, value: string | number) {
              onChange(
                cart.map((entry) =>
                  entry.itemId === line.itemId
                    ? { ...entry, [key]: value }
                    : entry,
                ),
              );
            }
            return (
              <BaseTableRow
                key={line.itemId}
                data-recent={recentItemId === line.itemId || undefined}
              >
                <BaseTableCell className="pos-line-product">
                  <strong>{item.name}</strong>
                  <small>
                    {item.code} ／ {item.specification}
                  </small>
                  <small className={overStock ? "items-error" : undefined}>
                    可用 {stock} {item.unit}
                    {overStock && "・數量超過可用庫存"}
                  </small>
                </BaseTableCell>
                <BaseTableCell data-label="數量" className="pos-line-field">
                  <Field name={`qty-${item.id}`} label={`${item.name}數量`}>
                    <BaseInput
                      type="number"
                      min="0.001"
                      step="0.001"
                      aria-invalid={overStock || undefined}
                      value={line.quantity}
                      onChange={(event) =>
                        change("quantity", Number(event.target.value))
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          document.getElementById("pos-search")?.focus();
                        }
                      }}
                    />
                  </Field>
                  <small>{item.unit}</small>
                </BaseTableCell>
                <BaseTableCell data-label="成交單價" className="pos-line-field">
                  <Field
                    name={`price-${item.id}`}
                    label={`${item.name}成交單價`}
                  >
                    <BaseInput
                      type="number"
                      min="0"
                      step="0.01"
                      readOnly={!authorized}
                      value={line.price}
                      onChange={(event) =>
                        change("price", Number(event.target.value))
                      }
                    />
                  </Field>
                </BaseTableCell>
                <BaseTableCell data-label="單品折扣" className="pos-line-field">
                  <Field
                    name={`discount-${item.id}`}
                    label={`${item.name}單品折扣`}
                  >
                    <BaseInput
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.discount}
                      onChange={(event) =>
                        change("discount", Number(event.target.value))
                      }
                    />
                  </Field>
                </BaseTableCell>
                <BaseTableCell data-label="小計" className="pos-line-subtotal">
                  {money(
                    Math.max(0, line.quantity * line.price - line.discount),
                  )}
                </BaseTableCell>
                <BaseTableCell className="pos-line-remove">
                  <BaseButton
                    variant="ghost"
                    size="icon"
                    aria-label={`移除${item.name}`}
                    onClick={() =>
                      onChange(
                        cart.filter((entry) => entry.itemId !== line.itemId),
                      )
                    }
                  >
                    <Trash2 aria-hidden="true" />
                  </BaseButton>
                </BaseTableCell>
              </BaseTableRow>
            );
          })}
        </BaseTableBody>
      </BaseTable>
    </div>
  );
}
