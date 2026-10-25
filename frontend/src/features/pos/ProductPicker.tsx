import { useEffect, useState } from "react";
import { Package, Settings2 } from "lucide-react";
import { BaseButton } from "@/components/ui/BaseButton";
import { BaseInput } from "@/components/ui/BaseInput";
import { BaseField as Field } from "@/components/ui/BaseForm";
import { BaseCheckField } from "@/components/ui/BaseCheckField";
import {
  BaseNativeSelect as Select,
  BaseNativeSelectOption as Option,
} from "@/components/ui/BaseNativeSelect";
import { eligible, money } from "./model";
import type { Item } from "@/types/items";
import type { CartLine, PosPolicy } from "@/types/pos";

export function ProductPicker({
  items,
  cart,
  initialSearch,
  authorized,
  stock,
  policy,
  noStockReason,
  onAdd,
  onPolicy,
  onClose,
}: {
  items: Item[];
  cart: CartLine[];
  initialSearch: string;
  authorized: boolean;
  stock: (id: string) => number;
  policy: (item: Item) => PosPolicy;
  noStockReason: (id: string) => string;
  onAdd: (item: Item) => void;
  onPolicy: (id: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState("");
  const [favorites, setFavorites] = useState(true);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const matching = items
    .filter(
      (item) =>
        (!category || item.category === category) &&
        (!favorites || search.trim() || policy(item).favorite) &&
        [item.code, item.name, item.englishName, item.barcode, item.nhiCode]
          .join(" ")
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
    )
    .sort((a, b) => policy(a).sort - policy(b).sort);
  return (
    <>
      <div className="items-modal-scroll pos-picker">
        <div className="pos-picker-filters">
          <Field name="pos-picker-search" label="搜尋可選商品">
            <BaseInput
              value={search}
              placeholder="條碼、料號、品名或健保碼"
              onChange={(event) => setSearch(event.target.value)}
            />
          </Field>
          <Field name="pos-category" label="商品分類">
            <Select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <Option value="">全部分類</Option>
              {[...new Set(items.map((item) => item.category))].map((value) => (
                <Option key={value}>{value}</Option>
              ))}
            </Select>
          </Field>
        </div>
        <BaseCheckField
          label="只看常用商品（搜尋時顯示全部符合項目）"
          checked={favorites}
          onChange={setFavorites}
        />
        <p>可連續加入多個商品，完成後返回銷售明細。</p>
        <div className="pos-products">
          {matching.map((item) => {
            const settings = policy(item);
            const invalid = eligible(item, settings);
            const count =
              cart.find((line) => line.itemId === item.id)?.quantity || 0;
            return (
              <article className="pos-product" key={item.id}>
                <BaseButton
                  variant="product"
                  disabled={Boolean(invalid) || stock(item.id) <= count}
                  aria-label={`加入${item.name}`}
                  onClick={() => {
                    onAdd(item);
                    setNotice(
                      `已加入 ${item.name}，本單數量 ${count + 1} ${item.unit}。`,
                    );
                  }}
                >
                  <Package aria-hidden="true" />
                  <strong>{item.name}</strong>
                  <span>
                    {item.code} ／ {item.specification}
                  </span>
                  <span>
                    {money(settings.price)}／{item.unit}
                  </span>
                  <span>
                    {invalid ||
                      (stock(item.id)
                        ? `可用 ${stock(item.id)} ${item.unit}`
                        : noStockReason(item.id))}
                  </span>
                  {count > 0 && (
                    <small>
                      本單已選 {count} {item.unit}
                    </small>
                  )}
                  {(settings.professional || settings.prescription) && (
                    <small>
                      結帳需{settings.prescription ? "處方及" : ""}專業確認
                    </small>
                  )}
                </BaseButton>
                {authorized && (
                  <BaseButton
                    variant="outline"
                    aria-label={`設定${item.name} POS`}
                    onClick={() => onPolicy(item.id)}
                  >
                    <Settings2 aria-hidden="true" />
                    POS 設定
                  </BaseButton>
                )}
              </article>
            );
          })}
        </div>
        {!matching.length && <p className="pos-empty">查無符合商品。</p>}
      </div>
      <footer className="items-modal-footer pos-actions">
        <span>本單共 {cart.length} 項商品</span>
        <BaseButton onClick={onClose}>完成選品</BaseButton>
      </footer>
      {notice && (
        <div className="items-toast" role="status">
          {notice}
        </div>
      )}
    </>
  );
}
