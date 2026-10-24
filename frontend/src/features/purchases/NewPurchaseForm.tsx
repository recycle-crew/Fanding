import type { NewPurchaseInput } from "@/types/purchases/form";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const [header, setHeader] = useState({
    date: taipeiToday(),
    supplier: "",
    warehouse: "",
    remark: "",
  });
  const [search, setSearch] = useState("");
  const [composing, setComposing] = useState(false);
  const [lines, setLines] = useState<PurchaseLine[]>([]);
  const [message, setMessage] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const lineTableRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<string | null>(null);
  const [latestLine, setLatestLine] = useState<string | null>(null);
  const validLine = (line: PurchaseLine) =>
    Number.isFinite(line.quantity) &&
    line.quantity > 0 &&
    Number.isFinite(line.unitCost) &&
    line.unitCost >= 0;
  const incompleteCount = lines.filter((line) => !validLine(line)).length;
  const total = lines.reduce(
    (sum, line) =>
      sum + (validLine(line) ? rounded(line.quantity * line.unitCost) : 0),
    0,
  );
  function focusLine(id: string) {
    const input = lineTableRef.current?.querySelector<HTMLInputElement>(
      `input[data-line-id="${id}"]`,
    );
    input?.focus();
    input?.scrollIntoView({ block: "nearest" });
  }
  useEffect(() => {
    if (pendingFocus.current) {
      focusLine(pendingFocus.current);
      pendingFocus.current = null;
    }
  }, [lines]);
  const matches = search.trim()
    ? items.filter(
        (i) =>
          usageStatus(i) === "使用中" &&
          [i.code, i.name, i.barcode, i.nhiCode].some((v) =>
            v.toLowerCase().includes(search.trim().toLowerCase()),
          ),
      )
    : [];
  const add = useCallback(
    (itemId: string) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;
      const line = snapshot(item, crypto.randomUUID());
      setLines((current) => [...current, line]);
      setLatestLine(line.id);
      setSearch("");
      setMessage(`已加入${item.name}，可繼續掃描下一項。`);
      onDirty();
      searchRef.current?.focus();
    },
    [items, onDirty],
  );
  useEffect(() => {
    const value = search.trim().toLowerCase();
    if (!value || composing) return;
    const exact = items.filter(
      (item) =>
        usageStatus(item) === "使用中" &&
        item.barcode &&
        item.barcode.toLowerCase() === value,
    );
    const hasLongerBarcode = items.some(
      (item) =>
        item.barcode.toLowerCase().startsWith(value) &&
        item.barcode.length > value.length,
    );
    if (exact.length !== 1 || hasLongerBarcode) return;
    const timer = window.setTimeout(() => add(exact[0].id), 120);
    return () => window.clearTimeout(timer);
  }, [search, composing, items, add]);
  function addBatch(line: PurchaseLine) {
    const next = {
      ...line,
      id: crypto.randomUUID(),
      batch: "",
      expiry: "",
      quantity: 1,
      traceableQuantity: 1,
      remark: "",
    };
    pendingFocus.current = next.id;
    setLines((current) => {
      const index = current.findIndex((row) => row.id === line.id);
      return [
        ...current.slice(0, index + 1),
        next,
        ...current.slice(index + 1),
      ];
    });
    setLatestLine(next.id);
    setMessage(`已加入${line.name}的另一批次。`);
    onDirty();
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
      submitText="下一步：確認內容"
      footerSummary={
        <div className="purchase-draft-total" role="status" aria-live="polite">
          <span>
            共 {lines.length} 筆
            {incompleteCount > 0 && `・${incompleteCount} 筆數量或成本待補齊`}
          </span>
          <strong>暫計金額 {currency(total)}</strong>
        </div>
      }
      submit={() => {
        if (!lines.length)
          return {
            message:
              "請至少加入一筆進貨商品。請在商品搜尋中選取商品，或輸入完整料號後按 Enter 加入。",
            field: "purchase-item-search",
          };
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
          relatedReturn: "",
          lines: lines.map((l) => ({ ...l, traceableQuantity: l.quantity })),
        });
      }}
    >
      <p className="items-note">選擇供應商與倉別，再加入進貨商品。</p>
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
        </div>
        <details className="purchase-optional-fields">
          <summary>
            單據備註<span>選填</span>
          </summary>
          <div className="items-form-grid">
            <Field name="purchase-remark" label="備註">
              <BaseInput
                value={header.remark}
                onChange={(e) =>
                  setHeader({ ...header, remark: e.target.value })
                }
                placeholder="本次進貨說明（選填）"
              />
            </Field>
          </div>
        </details>
      </section>
      <section>
        <h3>進貨商品（必填，至少加入一筆）</h3>
        <div className="purchase-product-search">
          <Field
            name="purchase-item-search"
            label="條碼掃描／搜尋商品"
            hint="掃描完整條碼會自動加入，可連續掃描；料號、品名或健保碼也可搜尋。"
          >
            <BaseInput
              ref={searchRef}
              value={search}
              placeholder="直接掃描條碼，自動加入商品"
              onChange={(e) => setSearch(e.target.value)}
              onCompositionStart={() => setComposing(true)}
              onCompositionEnd={() => setComposing(false)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                e.preventDefault();
                e.stopPropagation();
                const value = e.currentTarget.value.trim().toLowerCase();
                if (!value || e.repeat || composing) return;
                const currentMatches = items.filter(
                  (item) =>
                    usageStatus(item) === "使用中" &&
                    [item.code, item.name, item.barcode, item.nhiCode].some(
                      (text) => text.toLowerCase().includes(value),
                    ),
                );
                const exact = currentMatches.filter((i) =>
                  [i.code, i.barcode, i.nhiCode].some(
                    (v) => v && v.toLowerCase() === value,
                  ),
                );
                if (
                  exact.length === 1 ||
                  (exact.length === 0 && currentMatches.length === 1)
                )
                  add((exact[0] || currentMatches[0]).id);
                else {
                  setMessage(
                    currentMatches.length
                      ? "找到多筆商品，請選擇正確品項。"
                      : "找不到對應商品，請確認條碼或改用搜尋。",
                  );
                  searchRef.current?.select();
                }
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
        <div role="status" className="items-note purchase-added-message">
          <span>{message || "批號、效期選填；不同批次請分筆填寫。"}</span>
          {latestLine && lines.some((line) => line.id === latestLine) && (
            <BaseButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => focusLine(latestLine)}
            >
              填寫這筆
            </BaseButton>
          )}
        </div>
        <div
          className="purchase-table-scroll purchase-new-lines"
          ref={lineTableRef}
          role="region"
          tabIndex={0}
          aria-label="新增進貨商品明細，可左右捲動"
        >
          <BaseTable variant="lines">
            <BaseTableHeader>
              <BaseTableRow>
                {[
                  "品項／規格",
                  "批號",
                  "效期",
                  "數量／單位",
                  "單位成本",
                  "小計",
                  "其他資訊",
                ].map((h) => (
                  <BaseTableHead key={h}>{h}</BaseTableHead>
                ))}
              </BaseTableRow>
            </BaseTableHeader>
            <BaseTableBody>
              {lines.map((l, i) => (
                <BaseTableRow
                  key={l.id}
                  className={
                    l.id === latestLine ? "purchase-line-new" : undefined
                  }
                >
                  <BaseTableCell>
                    <strong>{l.name}</strong>
                    <small>
                      {l.code} · {l.specification || "—"}
                    </small>
                  </BaseTableCell>
                  <BaseTableCell>
                    <small>
                      <span className="purchase-line-mobile-label">
                        批號 ·{" "}
                      </span>
                      選填
                    </small>
                    <BaseInput
                      aria-label={`第${i + 1}筆批號`}
                      data-line-id={l.id}
                      value={l.batch}
                      onChange={(e) => update(l.id, "batch", e.target.value)}
                    />
                  </BaseTableCell>
                  <BaseTableCell>
                    <small>
                      <span className="purchase-line-mobile-label">
                        效期 ·{" "}
                      </span>
                      選填
                    </small>
                    <BaseInput
                      aria-label={`第${i + 1}筆效期`}
                      type="date"
                      value={l.expiry}
                      onChange={(e) => update(l.id, "expiry", e.target.value)}
                    />
                  </BaseTableCell>
                  <BaseTableCell>
                    <small>
                      <span className="purchase-line-mobile-label">
                        數量 ·{" "}
                      </span>
                      必填，大於 0
                    </small>
                    <div className="purchase-quantity-input">
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
                            e.target.value === ""
                              ? NaN
                              : Number(e.target.value),
                          )
                        }
                      />
                      <span>{l.unit}</span>
                    </div>
                  </BaseTableCell>
                  <BaseTableCell>
                    <small>
                      <span className="purchase-line-mobile-label">
                        單位成本 ·{" "}
                      </span>
                      必填，可為 0
                    </small>
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
                    <small className="purchase-line-mobile-label">小計</small>
                    {currency(
                      Number.isFinite(l.quantity * l.unitCost)
                        ? rounded(l.quantity * l.unitCost)
                        : 0,
                    )}
                  </BaseTableCell>
                  <BaseTableCell>
                    <details className="purchase-line-notes">
                      <summary>備註</summary>
                      <BaseInput
                        aria-label={`第${i + 1}筆備註`}
                        value={l.remark}
                        onChange={(e) => update(l.id, "remark", e.target.value)}
                      />
                    </details>
                    <BaseButton
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label={`新增第${i + 1}筆${l.name}的同商品批次`}
                      onClick={() => addBatch(l)}
                    >
                      新增同商品批次
                    </BaseButton>
                    <BaseButton
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label={`移除第${i + 1}筆${l.name}`}
                      onClick={() => {
                        setLines((current) =>
                          current.filter((row) => row.id !== l.id),
                        );
                        if (latestLine === l.id) setLatestLine(null);
                        setMessage(`已移除${l.name}。`);
                        onDirty();
                      }}
                    >
                      <Trash2 size={15} />
                      移除
                    </BaseButton>
                  </BaseTableCell>
                </BaseTableRow>
              ))}
              {!lines.length && (
                <BaseTableRow>
                  <BaseTableCell variant="empty-lines" colSpan={7}>
                    尚未加入商品，請先搜尋並加入。
                  </BaseTableCell>
                </BaseTableRow>
              )}
            </BaseTableBody>
          </BaseTable>
        </div>
      </section>
    </PurchaseForm>
  );
}
