import { useState } from "react";
import { BaseForm, BaseField as Field } from "@/components/ui/BaseForm";
import { BaseInput } from "@/components/ui/BaseInput";
import { BaseCheckField } from "@/components/ui/BaseCheckField";
import type { Item } from "@/types/items";
import type { PosPolicy } from "@/types/pos";
export function PosPolicyForm({
  item,
  initial,
  onSave,
  onCancel,
  onDirty,
}: {
  item: Item;
  initial: PosPolicy;
  onSave: (policy: PosPolicy) => void;
  onCancel: () => void;
  onDirty: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  function check(
    key: "sellable" | "favorite" | "prescription" | "professional",
    label: string,
  ) {
    return (
      <BaseCheckField
        label={label}
        checked={draft[key]}
        onChange={(value) => {
          setDraft({ ...draft, [key]: value });
          onDirty();
        }}
      />
    );
  }
  return (
    <BaseForm
      submitText="儲存 POS 設定"
      onCancel={onCancel}
      onDirty={onDirty}
      submit={() => {
        if (
          !Number.isFinite(draft.price) ||
          draft.price < 0 ||
          !Number.isInteger(draft.sort) ||
          draft.sort < 0
        )
          return { message: "售價須為非負數，排序須為非負整數。" };
        onSave(draft);
      }}
    >
      <section>
        <h3>
          {item.code} {item.name}
        </h3>
        <p>
          分類 {item.group === "HIS_MEDICINE" ? "HIS 藥品" : "一般商品"}；POS
          資格另行設定，不會變更商品分類。
        </p>
        {check("sellable", "允許 POS 銷售（展示）")}
        {check("favorite", "設為常用商品")}
        <div className="pos-form-grid">
          <Field name="policy-price" label="預設 POS 售價" required>
            <BaseInput
              type="number"
              min="0"
              step="0.01"
              value={draft.price}
              onChange={(event) =>
                setDraft({ ...draft, price: Number(event.target.value) })
              }
            />
          </Field>
          <Field name="policy-sort" label="常用排序" required>
            <BaseInput
              type="number"
              min="0"
              step="1"
              value={draft.sort}
              onChange={(event) =>
                setDraft({ ...draft, sort: Number(event.target.value) })
              }
            />
          </Field>
        </div>
        {check("prescription", "需要處方確認")}
        {check("professional", "需要專業人員確認")}
        <p>開放銷售不代表取得法定資格。既有銷售價格與商品快照不會更新。</p>
      </section>
    </BaseForm>
  );
}
