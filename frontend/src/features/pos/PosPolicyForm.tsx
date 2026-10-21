import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BaseForm, BaseField as Field } from "@/components/ui/BaseForm";
import { BaseInput } from "@/components/ui/BaseInput";
import { BaseCheckField } from "@/components/ui/BaseCheckField";
import type { Item } from "@/types/items";
import type { PosPolicy } from "@/types/pos";

const posPolicySchema = z.object({
  sellable: z.boolean(),
  favorite: z.boolean(),
  prescription: z.boolean(),
  professional: z.boolean(),
  price: z
    .number()
    .refine((n) => Number.isFinite(n) && n >= 0, {
      message: "售價須為非負數，排序須為非負整數。",
    }),
  sort: z
    .number()
    .refine((n) => Number.isInteger(n) && n >= 0, {
      message: "售價須為非負數，排序須為非負整數。",
    }),
});

type PosPolicyFormValues = z.infer<typeof posPolicySchema>;

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
  const form = useForm<PosPolicyFormValues>({
    resolver: zodResolver(posPolicySchema),
    defaultValues: {
      sellable: initial.sellable,
      favorite: initial.favorite,
      prescription: initial.prescription,
      professional: initial.professional,
      price: initial.price,
      sort: initial.sort,
    },
  });

  const { control, register } = form;

  function check(
    name: "sellable" | "favorite" | "prescription" | "professional",
    label: string,
  ) {
    return (
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <BaseCheckField
            label={label}
            checked={field.value}
            onChange={(val) => {
              field.onChange(val);
              onDirty();
            }}
          />
        )}
      />
    );
  }

  const handleValidSubmit = (values: PosPolicyFormValues) => {
    onSave(values as Required<PosPolicyFormValues>);
  };

  return (
    <BaseForm
      form={form}
      submitText="儲存 POS 設定"
      onCancel={onCancel}
      onDirty={onDirty}
      onSubmit={handleValidSubmit}
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
          <Field name="price" label="預設 POS 售價" required>
            <BaseInput
              type="number"
              min="0"
              step="0.01"
              {...register("price", {
                valueAsNumber: true,
                onChange: () => onDirty(),
              })}
            />
          </Field>
          <Field name="sort" label="常用排序" required>
            <BaseInput
              type="number"
              min="0"
              step="1"
              {...register("sort", {
                valueAsNumber: true,
                onChange: () => onDirty(),
              })}
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
