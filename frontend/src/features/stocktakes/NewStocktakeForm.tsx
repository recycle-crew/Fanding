import { useState } from "react";
import { BaseForm, BaseField as Field } from "@/components/ui/BaseForm";
import { BaseInput } from "@/components/ui/BaseInput";
import { BaseTextarea } from "@/components/ui/BaseTextarea";
import {
  BaseNativeSelect as Select,
  BaseNativeSelectOption as Option,
} from "@/components/ui/BaseNativeSelect";
import { BaseCheckField } from "@/components/ui/BaseCheckField";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createStocktake } from "@/store/stocktakes";
import type { NewStocktakeInput } from "@/types/store/stocktakes";
import { useBaseDataOptions } from "@/features/base-data/useBaseDataOptions";
import { taipeiToday } from "@/features/items/model";
import { stocktakePeople } from "./model";
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
    options = useBaseDataOptions();
  const [form, setForm] = useState<NewStocktakeInput>({
    name: "",
    date: taipeiToday(),
    warehouse: "主倉庫",
    type: "部分盤點",
    itemIds: [],
    people: [],
    remark: "",
  });
  const [search, setSearch] = useState("");
  function toggle(key: "itemIds" | "people", value: string, checked: boolean) {
    setForm({
      ...form,
      [key]: checked
        ? [...form[key], value]
        : form[key].filter((entry) => entry !== value),
    });
    onDirty();
  }
  return (
    <BaseForm
      submitText="建立盤點單"
      onCancel={onCancel}
      onDirty={onDirty}
      submit={() => {
        const result = dispatch(createStocktake(form));
        if (result.error) return { message: result.error };
        onDone(result.id!);
      }}
    >
      <section>
        <h3>盤點基本資料</h3>
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
              onChange={(event) =>
                setForm({ ...form, warehouse: event.target.value })
              }
            >
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
        <h3>指派盤點人員</h3>
        {stocktakePeople.map((person) => (
          <BaseCheckField
            key={person}
            label={person}
            checked={form.people.includes(person)}
            onChange={(checked) => toggle("people", person, checked)}
          />
        ))}
        <p>採分區或分工累加，請在備註明確安排，避免同一批實物被重複計算。</p>
      </section>
      {form.type === "部分盤點" && (
        <section>
          <h3>指定品項（已選 {form.itemIds.length} 項）</h3>
          <Field name="stocktake-scope-search" label="搜尋盤點範圍">
            <BaseInput
              value={search}
              placeholder="品名或料號"
              onChange={(event) => setSearch(event.target.value)}
            />
          </Field>
          <div className="stocktake-scope-options">
            {items
              .filter((item) =>
                `${item.code} ${item.name}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .map((item) => (
                <BaseCheckField
                  key={item.id}
                  label={`${item.code} ${item.name}（${item.unit}）`}
                  checked={form.itemIds.includes(item.id)}
                  onChange={(checked) => toggle("itemIds", item.id, checked)}
                />
              ))}
          </div>
        </section>
      )}
      {form.type === "全盤" && (
        <p>
          建立時擷取該倉所有已有批次的品項，包括不可用庫存；無品項時會阻擋，不建立空白盤點單。
        </p>
      )}
      <Field name="stocktake-remark" label="分工與備註">
        <BaseTextarea
          maxLength={1000}
          value={form.remark}
          onChange={(event) => setForm({ ...form, remark: event.target.value })}
        />
      </Field>
      <p>建立後範圍與原始快照鎖定；本階段不修改正式庫存。</p>
    </BaseForm>
  );
}
