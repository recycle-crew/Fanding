import { BaseCheckbox } from "@/components/ui/BaseCheckbox";
import { BaseTextarea } from "@/components/ui/BaseTextarea";
import { useState, useEffect, useRef, type FormEvent } from "react";
import { BaseInput } from "@/components/ui/BaseInput";
import { BaseLabel } from "@/components/ui/BaseLabel";
import { BaseButton } from "@/components/ui/BaseButton";
import {
  BaseNativeSelect,
  BaseNativeSelectOption,
} from "@/components/ui/BaseNativeSelect";
import { useAppSelector } from "@/store/hooks";
import { categories, units, validateItem } from "./model";
import type { Item } from "@/types/items";
import { useBaseDataOptions } from "@/features/base-data/useBaseDataOptions";

export function ItemEditor({
  initial,
  onSave,
  onCancel,
  onDirty,
}: {
  initial: Item;
  onSave: (item: Item) => void;
  onCancel: () => void;
  onDirty: (dirty: boolean) => void;
}) {
  const state = useAppSelector((s) => s.items);
  const options = useBaseDataOptions();
  const suppliers = Array.from(
    new Set([
      ...options.suppliers,
      ...(initial.supplier ? [initial.supplier] : []),
    ]),
  );
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState("");
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (!error) return;
    const input = document.getElementById(`item-${errorField}`);
    const section = input?.closest("details");
    if (section) section.open = true;
    if (input) {
      input.focus();
      input.scrollIntoView({ block: "center" });
    } else errorRef.current?.focus({ preventScroll: true });
  }, [error, errorField]);
  const [saving, setSaving] = useState(false);
  const locked =
    !!initial.id &&
    (state.batches.some((b) => b.itemId === initial.id) ||
      state.transactions.some((t) => t.itemId === initial.id) ||
      state.costs.some((c) => c.itemId === initial.id));
  function change<K extends keyof Item>(key: K, value: Item[K]) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    onDirty(JSON.stringify(next) !== JSON.stringify(initial));
    setError("");
    setErrorField("");
  }
  function field(
    key: keyof Item,
    title: string,
    options: {
      required?: boolean;
      type?: string;
      disabled?: boolean;
      hint?: string;
      step?: string;
    } = {},
  ) {
    return (
      <BaseLabel
        variant="field"
        key={key}
        htmlFor={`item-${key}`}
        className={key === "name" ? "items-field-wide" : undefined}
      >
        <span id={`item-${key}-label`}>
          {title}
          {options.required && <em> *</em>}
        </span>
        <BaseInput
          id={`item-${key}`}
          name={key}
          aria-labelledby={`item-${key}-label`}
          aria-invalid={errorField === key || undefined}
          aria-describedby={
            [
              options.hint ? `item-${key}-hint` : "",
              errorField === key ? "items-editor-error" : "",
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
          type={options.type || "text"}
          value={
            key === "safetyStock" && Number.isNaN(draft[key])
              ? ""
              : String(draft[key])
          }
          required={options.required}
          disabled={options.disabled}
          readOnly={key === "code" && !!initial.id}
          min={options.type === "number" ? 0 : undefined}
          step={options.step}
          onChange={(e) =>
            change(
              key,
              key === "safetyStock"
                ? e.target.value === ""
                  ? NaN
                  : Number(e.target.value)
                : e.target.value,
            )
          }
        />
        {options.hint && <small id={`item-${key}-hint`}>{options.hint}</small>}
      </BaseLabel>
    );
  }
  function select(
    key: "category" | "unit" | "supplier",
    title: string,
    values: string[],
    required = false,
    disabled = false,
  ) {
    return (
      <BaseLabel variant="field" htmlFor={`item-${key}`}>
        <span id={`item-${key}-label`}>
          {title}
          {required && <em> *</em>}
        </span>
        <BaseNativeSelect
          id={`item-${key}`}
          name={key}
          aria-labelledby={`item-${key}-label`}
          aria-invalid={errorField === key || undefined}
          aria-describedby={
            errorField === key ? "items-editor-error" : undefined
          }
          value={draft[key]}
          required={required}
          disabled={disabled}
          onChange={(e) => change(key, e.target.value)}
        >
          <BaseNativeSelectOption value="">
            {required ? "請選擇" : "未指定"}
          </BaseNativeSelectOption>
          {values.map((value) => (
            <BaseNativeSelectOption key={value} value={value}>
              {value}
            </BaseNativeSelectOption>
          ))}
        </BaseNativeSelect>
      </BaseLabel>
    );
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    const invalid = (event.currentTarget as HTMLFormElement).querySelector<
      HTMLInputElement | HTMLSelectElement
    >(":invalid");
    if (invalid) {
      setErrorField(invalid.name);
      const label =
        invalid.labels?.[0]?.querySelector("span")?.textContent || "欄位";
      setError(`${label}：${invalid.validationMessage}`);
      return;
    }
    const normalized = {
      ...draft,
      code: draft.code.trim(),
      name: draft.name.trim(),
      barcode: draft.barcode.trim(),
    };
    const message = validateItem(normalized, state);
    if (message) {
      setErrorField(
        message.includes("料號")
          ? "code"
          : message.includes("條碼")
            ? "barcode"
            : message.includes("日期")
              ? "effectiveUntil"
              : message.includes("安全庫存")
                ? "safetyStock"
                : message.includes("價格")
                  ? Number(draft.referenceCost) < 0
                    ? "referenceCost"
                    : "suggestedPrice"
                  : "name",
      );
      setError(message);
      return;
    }
    setSaving(true);
    onSave(normalized);
  }
  return (
    <form
      id="items-editor-form"
      className="items-editor-form"
      onSubmit={submit}
      noValidate
    >
      <div className="items-modal-scroll">
        <section>
          <h3>基本資料</h3>
          <div className="items-form-grid">
            <BaseLabel variant="field" htmlFor="item-group">
              <span>品項類型 *</span>
              <BaseNativeSelect
                id="item-group"
                value={draft.group}
                disabled={!!initial.id}
                onChange={(e) =>
                  change("group", e.target.value as Item["group"])
                }
              >
                <BaseNativeSelectOption value="HIS_MEDICINE">
                  HIS 藥品
                </BaseNativeSelectOption>
                <BaseNativeSelectOption value="GENERAL">
                  自費／OTC／其他商品
                </BaseNativeSelectOption>
              </BaseNativeSelect>
            </BaseLabel>
            {field("code", "料號", {
              required: true,
              hint: initial.id
                ? "料號建立後不可修改"
                : "系統建議料號，可自行修改",
            })}
            {field("name", "品名", { required: true })}
            {select("category", "品項分類", categories, true)}
            {select("unit", "基本單位", units, true, locked)}
            {field("safetyStock", "安全庫存", {
              required: true,
              type: "number",
              step: "0.001",
            })}
            {field("effectiveFrom", "開始使用日期", {
              type: "date",
              required: true,
            })}
          </div>
          {locked && (
            <p className="items-note">
              此品項已有庫存或交易，基本單位不可修改。
            </p>
          )}
        </section>
        <details className="items-editor-section" open={!!initial.id}>
          <summary>
            其他資料<span>選填</span>
          </summary>
          <div className="items-form-grid">
            {field("englishName", "英文名稱")}
            {field("specification", "規格")}
            {field("barcode", "國際條碼")}
            {field("nhiCode", "健保碼")}
            {select("supplier", "預設供應商", suppliers)}
            <BaseLabel variant="field" htmlFor="item-remark">
              <span>備註</span>
              <BaseTextarea
                id="item-remark"
                value={draft.remark}
                onChange={(e) => change("remark", e.target.value)}
                rows={2}
              />
            </BaseLabel>
          </div>
        </details>

        <details className="items-editor-section" open={!!initial.id}>
          <summary>
            價格與使用設定
            <span>{draft.active ? "啟用" : "停用"}・價格選填</span>
          </summary>
          <div className="items-form-grid">
            {field("referenceCost", "參考成本", {
              type: "number",
              step: "0.0001",
              hint: "修改不影響歷史進貨成本",
            })}
            {field("suggestedPrice", "建議售價", {
              type: "number",
              step: "0.01",
            })}
            {field("effectiveUntil", "停止使用日期", { type: "date" })}
            <BaseLabel variant="check">
              <BaseCheckbox
                checked={draft.active}
                onCheckedChange={(checked) =>
                  change("active", checked === true)
                }
              />
              啟用品項
            </BaseLabel>
          </div>
        </details>
        {initial.active &&
          !draft.active &&
          state.batches.some(
            (b) => b.itemId === initial.id && b.quantity > 0,
          ) && (
            <p className="items-error">
              此品項仍有庫存，停用後庫存與歷史紀錄都會保留。
            </p>
          )}
      </div>
      {error && (
        <p
          ref={errorRef}
          id="items-editor-error"
          tabIndex={-1}
          role="alert"
          className="items-error items-form-alert"
        >
          {error}
        </p>
      )}
      <footer className="items-modal-footer">
        <span>＊ 必填欄位</span>
        <BaseButton type="button" variant="outline" onClick={onCancel}>
          取消
        </BaseButton>
        <BaseButton type="submit" disabled={saving}>
          {saving ? "儲存中…" : initial.id ? "儲存變更" : "儲存品項"}
        </BaseButton>
      </footer>
    </form>
  );
}
