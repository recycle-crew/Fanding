import type { NewPurchaseInput } from "@/types/purchases/form";
import { useRef, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { BaseButton } from "@/components/ui/BaseButton";
import { BaseInput } from "@/components/ui/BaseInput";
import {
  BaseNativeSelect,
  BaseNativeSelectOption as Option,
} from "@/components/ui/BaseNativeSelect";
import {
  BaseTable,
  BaseTableHeader,
  BaseTableHead,
  BaseTableBody,
  BaseTableCell,
  BaseTableRow,
} from "@/components/ui/BaseTable";
import { taipeiToday, usageStatus } from "@/features/items/model";
import { Field, PurchaseForm } from "./FormParts";
import { currency, rounded, snapshot } from "./model";
import type { PurchaseLine } from "@/types/purchases";
import { useBaseDataOptions } from "@/features/base-data/useBaseDataOptions";

export function NewPurchaseForm({
  onCancel,
  onDirty,
  onSubmit,
}: {
  onCancel: () => void;
  onDirty: () => void;
  onSubmit: (input: NewPurchaseInput) => void;
}) {
  const items = useAppSelector((s) => s.items.items);
  const { suppliers, warehouses } = useBaseDataOptions();
  const orders = useAppSelector((s) => s.purchases.orders);
  const [header, setHeader] = useState({
    date: taipeiToday(),
    supplier: "",
    warehouse: "",
    remark: "",
    relatedReturn: "",
  });
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState<PurchaseLine[]>([]);
  const [message, setMessage] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const matches = search.trim()
    ? items.filter(
        (i) =>
          usageStatus(i) === "使用中" &&
          [i.code, i.name, i.barcode, i.nhiCode].some((v) =>
            v.toLowerCase().includes(search.trim().toLowerCase()),
          ),
      )
    : [];
  const returnRecords = orders.flatMap((o) =>
    o.records
      .filter((r) => r.kind === "return" && r.resolution === "換貨")
      .map((r) => ({ value: r.number, label: `${r.number} · ${o.supplier}` })),
  );
  function add(itemId: string) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    setLines((current) => [...current, snapshot(item, crypto.randomUUID())]);
    setSearch("");
    setMessage(`已加入${item.name}，請填寫批號、效期與數量。`);
    onDirty();
    searchRef.current?.focus();
  }
  function update(id: string, key: keyof PurchaseLine, value: string | number) {
    setLines((current) =>
      current.map((l) => (l.id === id ? { ...l, [key]: value } : l)),
    );
  }
  return (
    <PurchaseForm
      onCancel={onCancel}
      onDirty={onDirty}
      submitText="確認入庫"
      submit={() => {
        if (!lines.length) return { message: "請至少加入一筆進貨商品。" };
        if (
          lines.some(
            (l) =>
              !Number.isFinite(l.quantity) ||
              l.quantity <= 0 ||
              !Number.isFinite(l.unitCost) ||
              l.unitCost < 0,
          )
        )
          return { message: "數量必須大於 0，單位成本不可為負數。" };
        onSubmit({
          ...header,
          lines: lines.map((l) => ({ ...l, traceableQuantity: l.quantity })),
        });
      }}
    >
      <section>
        <h3>基本資料</h3>
        <div className="items-form-grid purchase-header-grid">
          <Field name="purchase-supplier" label="供應商" required>
            <BaseNativeSelect
              value={header.supplier}
              onChange={(e) =>
                setHeader({ ...header, supplier: e.target.value })
              }
            >
              <Option value="">請選擇供應商</Option>
              {suppliers.map((s) => (
                <Option key={s}>{s}</Option>
              ))}
            </BaseNativeSelect>
          </Field>
          <Field name="purchase-warehouse" label="入庫倉別" required>
            <BaseNativeSelect
              value={header.warehouse}
              onChange={(e) =>
                setHeader({ ...header, warehouse: e.target.value })
              }
            >
              <Option value="">請選擇倉別</Option>
              {warehouses.map((w) => (
                <Option key={w}>{w}</Option>
              ))}
            </BaseNativeSelect>
          </Field>
          <Field name="purchase-date" label="收貨日期" required>
            <BaseInput
              type="date"
              value={header.date}
              onChange={(e) => setHeader({ ...header, date: e.target.value })}
            />
          </Field>
          <Field
            name="purchase-related-return"
            label="關聯換貨退貨單"
            hint="換貨採原商品退貨與替換商品入庫兩筆紀錄。"
          >
            <BaseNativeSelect
              value={header.relatedReturn}
              onChange={(e) =>
                setHeader({ ...header, relatedReturn: e.target.value })
              }
            >
              <Option value="">一般進貨，不關聯退貨單</Option>
              {returnRecords.map((r) => (
                <Option key={r.value} value={r.value}>
                  {r.label}
                </Option>
              ))}
            </BaseNativeSelect>
          </Field>
          <Field name="purchase-remark" label="備註">
            <BaseInput
              value={header.remark}
              onChange={(e) => setHeader({ ...header, remark: e.target.value })}
              placeholder="本次進貨說明（選填）"
            />
          </Field>
        </div>
      </section>
      <section>
        <h3>進貨商品</h3>
        <div className="purchase-product-search">
          <Field
            name="purchase-item-search"
            label="搜尋商品／條碼掃描"
            hint="可輸入條碼、料號、品名或健保碼；精確符合條碼或料號時可按 Enter 加入。"
          >
            <BaseInput
              ref={searchRef}
              value={search}
              placeholder="掃描條碼，或輸入商品關鍵字"
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                const exact = matches.find((i) =>
                  [i.code, i.barcode, i.nhiCode].some(
                    (v) => v && v.toLowerCase() === search.trim().toLowerCase(),
                  ),
                );
                if (exact || matches.length === 1)
                  add((exact || matches[0]).id);
              }}
            />
          </Field>
          <Search aria-hidden="true" size={20} />
        </div>
        {search.trim() && (
          <div className="purchase-search-results" aria-label="商品搜尋結果">
            {matches.length ? (
              matches.map((i) => (
                <BaseButton
                  key={i.id}
                  type="button"
                  variant="ghost"
                  onClick={() => add(i.id)}
                >
                  <span>
                    <strong>{i.name}</strong>
                    <small>
                      {i.code} · {i.specification} · {i.unit}
                    </small>
                  </span>
                  <Plus size={17} aria-hidden="true" />
                </BaseButton>
              ))
            ) : (
              <p>
                查無可使用的品項。請先取消目前進貨單，再從側欄「品項與庫存管理」建立。
              </p>
            )}
          </div>
        )}
        <p role="status" className="items-note">
          {message || "加入商品後可分列不同批號與效期，不直接新增品項主檔。"}
        </p>
        <div
          className="purchase-table-scroll"
          role="region"
          tabIndex={0}
          aria-label="新增進貨商品明細，可左右捲動"
        >
          <BaseTable className="purchase-lines-table">
            <BaseTableHeader>
              <BaseTableRow>
                {[
                  "料號／品名",
                  "規格",
                  "批號",
                  "效期",
                  "數量",
                  "單位",
                  "單位成本",
                  "小計",
                  "備註",
                  "操作",
                ].map((h) => (
                  <BaseTableHead key={h}>{h}</BaseTableHead>
                ))}
              </BaseTableRow>
            </BaseTableHeader>
            <BaseTableBody>
              {lines.map((l, i) => (
                <BaseTableRow key={l.id}>
                  <BaseTableCell>
                    <strong>{l.name}</strong>
                    <small>{l.code}</small>
                  </BaseTableCell>
                  <BaseTableCell>{l.specification}</BaseTableCell>
                  <BaseTableCell>
                    <BaseInput
                      aria-label={`第${i + 1}筆批號`}
                      required={l.trackBatch}
                      value={l.batch}
                      disabled={!l.trackBatch}
                      onChange={(e) => update(l.id, "batch", e.target.value)}
                    />
                  </BaseTableCell>
                  <BaseTableCell>
                    <BaseInput
                      aria-label={`第${i + 1}筆效期`}
                      type="date"
                      required={l.trackExpiry}
                      disabled={!l.trackExpiry}
                      value={l.expiry}
                      onChange={(e) => update(l.id, "expiry", e.target.value)}
                    />
                  </BaseTableCell>
                  <BaseTableCell>
                    <BaseInput
                      aria-label={`第${i + 1}筆數量`}
                      type="number"
                      required
                      min="0.001"
                      step="0.001"
                      value={Number.isNaN(l.quantity) ? "" : l.quantity}
                      onChange={(e) =>
                        update(
                          l.id,
                          "quantity",
                          e.target.value === "" ? NaN : Number(e.target.value),
                        )
                      }
                    />
                  </BaseTableCell>
                  <BaseTableCell>{l.unit}</BaseTableCell>
                  <BaseTableCell>
                    <BaseInput
                      aria-label={`第${i + 1}筆單位成本`}
                      type="number"
                      required
                      min="0"
                      step="0.0001"
                      value={Number.isNaN(l.unitCost) ? "" : l.unitCost}
                      onChange={(e) =>
                        update(
                          l.id,
                          "unitCost",
                          e.target.value === "" ? NaN : Number(e.target.value),
                        )
                      }
                    />
                  </BaseTableCell>
                  <BaseTableCell>
                    {currency(
                      Number.isFinite(l.quantity * l.unitCost)
                        ? rounded(l.quantity * l.unitCost)
                        : 0,
                    )}
                  </BaseTableCell>
                  <BaseTableCell>
                    <BaseInput
                      aria-label={`第${i + 1}筆備註`}
                      value={l.remark}
                      onChange={(e) => update(l.id, "remark", e.target.value)}
                    />
                  </BaseTableCell>
                  <BaseTableCell>
                    <BaseButton
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={`移除第${i + 1}筆${l.name}`}
                      onClick={() => {
                        setLines((current) =>
                          current.filter((row) => row.id !== l.id),
                        );
                        onDirty();
                      }}
                    >
                      <Trash2 size={15} />
                    </BaseButton>
                  </BaseTableCell>
                </BaseTableRow>
              ))}
              {!lines.length && (
                <BaseTableRow>
                  <BaseTableCell colSpan={10} className="purchase-empty">
                    尚未加入商品，請從上方搜尋。
                  </BaseTableCell>
                </BaseTableRow>
              )}
            </BaseTableBody>
          </BaseTable>
        </div>
        <div className="purchase-total">
          <span>共 {lines.length} 筆明細 · 不同單位數量不合計</span>
          <strong>
            進貨金額{" "}
            {currency(
              lines.reduce(
                (s, l) =>
                  s +
                  (Number.isFinite(l.quantity * l.unitCost)
                    ? rounded(l.quantity * l.unitCost)
                    : 0),
                0,
              ),
            )}
          </strong>
        </div>
      </section>
      <p className="purchase-callout">
        本階段僅展示單據建立與狀態，不連動模組一庫存；確認後保留原始品項與成本快照，不儲存進貨草稿。
      </p>
    </PurchaseForm>
  );
}
