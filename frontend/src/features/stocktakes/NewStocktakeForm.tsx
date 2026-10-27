import { useState } from "react";
import { BaseForm, BaseField as Field } from "@/components/ui/BaseForm";
import { BaseInput } from "@/components/ui/BaseInput";
import { BaseTextarea } from "@/components/ui/BaseTextarea";
import {
  BaseNativeSelect as Select,
  BaseNativeSelectOption as Option,
} from "@/components/ui/BaseNativeSelect";
import { BaseCheckField } from "@/components/ui/BaseCheckField";
import { BaseButton } from "@/components/ui/BaseButton";
import { X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createStocktake } from "@/store/stocktakes";
import type { NewStocktakeInput } from "@/types/store/stocktakes";
import { useBaseDataOptions } from "@/features/base-data/useBaseDataOptions";
import { taipeiToday } from "@/features/items/model";
export function NewStocktakeForm({
  onCancel,
  onDirty,
  onDone,
}: {
  onCancel: () => void;
  onDirty: () => void;
  onDone: (id: string) => void;
}) {
  const dispatch = useAppDispatch(),
    items = useAppSelector((root) => root.items.items),
    batches = useAppSelector((root) => root.items.batches),
    options = useBaseDataOptions();
  const [form, setForm] = useState<NewStocktakeInput>({
    name: "",
    date: taipeiToday(),
    warehouse: options.warehouses.includes("主倉庫")
      ? "主倉庫"
      : options.warehouses[0] || "",
    type: "部分盤點",
    itemIds: [],
    remark: "",
  });
  const [search, setSearch] = useState("");
  const warehouseItemIds = new Set(
    batches
      .filter((batch) => batch.warehouse === form.warehouse)
      .map((batch) => batch.itemId),
  );
  const warehouseItems = items.filter((item) => warehouseItemIds.has(item.id));
  const selectedItems = items.filter((item) => form.itemIds.includes(item.id));
  const matchesSearch = (item: (typeof items)[number]) =>
    `${item.code} ${item.name} ${item.barcode}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
  const matchingItems = warehouseItems.filter(matchesSearch);
  const unavailableMatches = search.trim()
    ? items.filter(
        (item) => !warehouseItemIds.has(item.id) && matchesSearch(item),
      )
    : [];
  const scopeCount =
    form.type === "全盤" ? warehouseItems.length : form.itemIds.length;
  function toggle(value: string, checked: boolean) {
    setForm({
      ...form,
      itemIds: checked
        ? [...form.itemIds, value]
        : form.itemIds.filter((entry) => entry !== value),
    });
    onDirty();
  }
  return (
    <BaseForm
      submitText="建立盤點單"
      footerSummary={
        <div className="stocktake-new-summary" role="status" aria-live="polite">
          <span>
            {form.warehouse || "尚未選擇倉別"}・{form.type}
          </span>
          <strong>預計盤點 {scopeCount} 項</strong>
        </div>
      }
      onCancel={onCancel}
      onDirty={onDirty}
      submit={() => {
        if (form.type === "部分盤點" && !form.itemIds.length)
          return {
            message: "請至少選擇一項盤點品項。",
            field: "stocktake-scope-search",
          };
        const result = dispatch(createStocktake(form));
        if (result.error) return { message: result.error };
        onDone(result.id!);
      }}
    >
      <p className="items-note stocktake-new-intro">
        選擇盤點倉別與品項範圍即可建立；盤點輸入時會逐筆記錄輸入人員。
      </p>
      <section>
        <h3>1. 盤點基本資料</h3>
        <div className="stocktake-form-grid">
          <Field name="stocktake-name" label="盤點名稱" required>
            <BaseInput
              value={form.name}
              maxLength={100}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
          </Field>
          <Field name="stocktake-date" label="盤點日期" required>
            <BaseInput
              type="date"
              value={form.date}
              onChange={(event) =>
                setForm({ ...form, date: event.target.value })
              }
            />
          </Field>
          <Field name="stocktake-warehouse" label="盤點倉別" required>
            <Select
              value={form.warehouse}
              onChange={(event) => {
                setForm({
                  ...form,
                  warehouse: event.target.value,
                  itemIds: [],
                });
                setSearch("");
              }}
            >
              {!form.warehouse && <Option value="">請選擇倉別</Option>}
              {options.warehouses.map((value) => (
                <Option key={value}>{value}</Option>
              ))}
            </Select>
          </Field>
          <Field name="stocktake-type" label="盤點類型" required>
            <Select
              value={form.type}
              onChange={(event) =>
                setForm({
                  ...form,
                  type: event.target.value as NewStocktakeInput["type"],
                })
              }
            >
              <Option>部分盤點</Option>
              <Option>全盤</Option>
            </Select>
          </Field>
        </div>
      </section>
      <section>
        <h3>2. 盤點範圍</h3>
        {form.type === "部分盤點" ? (
          <>
            <p className="items-note">
              清單只顯示 {form.warehouse} 有庫存紀錄的商品；已選{" "}
              {form.itemIds.length} 項。
            </p>
            <Field name="stocktake-scope-search" label="搜尋盤點範圍">
              <BaseInput
                value={search}
                placeholder="搜尋料號、品名或條碼"
                onChange={(event) => setSearch(event.target.value)}
              />
            </Field>
            <div className="stocktake-scope-options" aria-label="可選盤點品項">
              {matchingItems.length ? (
                matchingItems.map((item) => (
                  <div
                    className="stocktake-scope-option stocktake-scope-option--available"
                    key={item.id}
                  >
                    <BaseCheckField
                      label={`${item.code} ${item.name}（${item.unit}）`}
                      checked={form.itemIds.includes(item.id)}
                      onChange={(checked) => toggle(item.id, checked)}
                    />
                    <small className="stocktake-scope-status">
                      此倉有庫存紀錄
                    </small>
                  </div>
                ))
              ) : (
                <p className="stocktake-scope-empty">
                  此倉找不到符合的可盤點商品。
                </p>
              )}
            </div>
            {unavailableMatches.length > 0 && (
              <div
                className="stocktake-unavailable-results"
                aria-label="此倉無庫存紀錄的搜尋結果"
              >
                <strong>
                  以下商品在 {form.warehouse} 沒有庫存紀錄，不能選取
                </strong>
                {unavailableMatches.map((item) => (
                  <div
                    className="stocktake-scope-option stocktake-scope-option--unavailable"
                    key={item.id}
                  >
                    <BaseCheckField
                      label={`${item.code} ${item.name}（${item.unit}）`}
                      checked={false}
                      onChange={() => {}}
                      disabled
                    />
                    <small className="stocktake-scope-status">
                      此倉無庫存紀錄
                    </small>
                  </div>
                ))}
              </div>
            )}
            <div className="stocktake-selected-scope" aria-label="已選盤點品項">
              <strong>已選品項（{selectedItems.length}）</strong>
              {selectedItems.length ? (
                <ul>
                  {selectedItems.map((item) => (
                    <li key={item.id}>
                      <span>
                        {item.code} {item.name}
                      </span>
                      <BaseButton
                        type="button"
                        variant="ghost"
                        aria-label={`移除 ${item.name}`}
                        onClick={() => toggle(item.id, false)}
                      >
                        <X size={15} aria-hidden="true" />
                        移除
                      </BaseButton>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>尚未選擇品項。</p>
              )}
            </div>
          </>
        ) : (
          <div className="stocktake-full-scope">
            <strong>
              {form.warehouse}目前有 {warehouseItems.length} 項商品有庫存紀錄
            </strong>
            <p>
              建立時會將這些商品及其庫存紀錄納入盤點範圍，包含暫時不可使用的數量；建立後範圍不再變更。
            </p>
            {warehouseItems.length === 0 && (
              <p role="alert">
                此倉別尚無可建立全盤的品項，請更換倉別或改用部分盤點。
              </p>
            )}
          </div>
        )}
      </section>
      <section>
        <h3>3. 其他資訊</h3>
        <Field name="stocktake-remark" label="盤點備註（選填）">
          <BaseTextarea
            maxLength={1000}
            value={form.remark}
            placeholder="例如：本次盤點目的或現場注意事項"
            onChange={(event) =>
              setForm({ ...form, remark: event.target.value })
            }
          />
        </Field>
      </section>
      <p className="items-note">
        建立後盤點品項與當下的系統庫存數量會固定；建立盤點單不會改動庫存。
      </p>
    </BaseForm>
  );
}
