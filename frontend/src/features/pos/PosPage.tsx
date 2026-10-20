import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { ShoppingCart, Package, Plus, Settings2, Trash2 } from "lucide-react";
import { BaseButton } from "@/components/ui/BaseButton";
import { BaseInput } from "@/components/ui/BaseInput";
import { BaseField as Field } from "@/components/ui/BaseForm";
import {
  BaseNativeSelect as Select,
  BaseNativeSelectOption as Option,
} from "@/components/ui/BaseNativeSelect";
import { BaseCheckField } from "@/components/ui/BaseCheckField";
import { BaseWorkspaceModal } from "@/components/ui/BaseWorkspaceModal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { savePosPolicy } from "@/store/pos";
import { useWorkspaceDirty } from "@/features/workspace/useWorkspaceDirty";
import { available, taipeiToday } from "@/features/items/model";
import type { Item } from "@/types/items";
import { useBaseDataOptions } from "@/features/base-data/useBaseDataOptions";
import { CheckoutForm } from "./CheckoutForm";
import { PosPolicyForm } from "./PosPolicyForm";
import { SaleDetails } from "./SaleDetails";
import { SalesList } from "./SalesList";
import { SaleReturnForm, SaleRefundForm, SaleVoidForm } from "./SaleForms";
import {
  customers,
  walkIn,
  eligible,
  money,
  policyFor,
  priceCart,
} from "./model";
import type { CartLine, Customer } from "@/types/pos";
import "@/features/items/items.css";
import "@/features/purchases/purchases.css";
import "./pos.css";
type View = {
  kind: "checkout" | "policy" | "sale" | "return" | "refund" | "void" | "clear";
  id?: string;
  refundId?: string;
};
export function PosPage() {
  const dispatch = useAppDispatch(),
    navigate = useNavigate(),
    location = useLocation();
  const state = useAppSelector((root) => root.pos),
    items = useAppSelector((root) => root.items.items);
  const options = useBaseDataOptions();
  const salesView = location.pathname === "/sales";
  const [cart, setCart] = useState<CartLine[]>([]),
    [orderDiscount, setOrderDiscount] = useState(0),
    [warehouse, setWarehouse] = useState("主倉庫");
  const [customer, setCustomer] = useState<Customer>(walkIn),
    [customerSearch, setCustomerSearch] = useState("");
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState(""),
    [favorites, setFavorites] = useState(true),
    [authorized, setAuthorized] = useState(false);
  const [view, setView] = useState<View | null>(null),
    [dirty, setDirty] = useState(false),
    [discard, setDiscard] = useState(false),
    [notice, setNotice] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  useWorkspaceDirty(cart.length > 0 || dirty);
  const priced = priceCart(cart, orderDiscount),
    sale = state.sales.find((record) => record.id === view?.id),
    selected = items.find((item) => item.id === view?.id);
  const stock = (id: string) =>
    state.batches
      .filter((batch) => batch.itemId === id && batch.warehouse === warehouse)
      .reduce((sum, batch) => sum + available(batch), 0);
  const noStockReason = (id: string) =>
    state.batches.some(
      (batch) =>
        batch.itemId === id &&
        batch.warehouse === warehouse &&
        batch.quantity > 0 &&
        batch.expiryDate &&
        batch.expiryDate < taipeiToday(),
    )
      ? "批次已過期，不可銷售"
      : "無可用庫存";
  const policy = (item: Item) => state.policies[item.id] || policyFor(item);
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
  function add(item: Item) {
    const error = eligible(item, policy(item));
    if (error || stock(item.id) <= 0) {
      setNotice(`${item.name}：${error || noStockReason(item.id)}。`);
      return;
    }
    const existing = cart.find((line) => line.itemId === item.id);
    if ((existing?.quantity || 0) + 1 > stock(item.id)) {
      setNotice(`${item.name}：數量超過可用庫存。`);
      return;
    }
    setCart(
      existing
        ? cart.map((line) =>
            line.itemId === item.id
              ? { ...line, quantity: line.quantity + 1 }
              : line,
          )
        : [
            ...cart,
            {
              itemId: item.id,
              quantity: 1,
              price: policy(item).price,
              discount: 0,
              batchId: "",
            },
          ],
    );
    setSearch("");
    setNotice(`已加入 ${item.name}；購物車尚未扣庫存。`);
    searchRef.current?.focus();
  }
  function close(force = false) {
    if (dirty && !force) {
      setDiscard(true);
      return;
    }
    setView(null);
    setDirty(false);
    setDiscard(false);
  }
  function done() {
    setDirty(false);
    setView(sale ? { kind: "sale", id: sale.id } : null);
    setNotice("展示作業已完成；庫存與退款歷史保留，未更新模組一。");
  }
  const title =
    view?.kind === "checkout"
      ? "POS 結帳確認"
      : view?.kind === "policy"
        ? "POS 商品設定（展示）"
        : view?.kind === "return"
          ? "銷售退貨"
          : view?.kind === "refund"
            ? "確認退款"
            : view?.kind === "void"
              ? "作廢交易"
              : view?.kind === "clear"
                ? "清空購物車"
                : "銷售明細與交易憑證";
  return (
    <div className="items-page pos-page">
      <header className="items-heading">
        <div className="items-title">
          <ShoppingCart aria-hidden="true" />
          <div>
            <h2>{salesView ? "銷售紀錄" : "POS 銷售收銀"}</h2>
            <p>商品銷售、付款與退貨追蹤的前端展示</p>
          </div>
        </div>
        <div className="pos-actions">
          <BaseButton
            variant="outline"
            onClick={() => navigate(salesView ? "/pos" : "/sales")}
          >
            {salesView ? "前往 POS" : "銷售紀錄"}
          </BaseButton>
          <Field name="pos-role" label="展示角色">
            <Select
              value={authorized ? "manager" : "cashier"}
              onChange={(event) => {
                const enabled = event.target.value === "manager";
                setAuthorized(enabled);
                if (!enabled) {
                  setCart(
                    cart.map((line) => ({
                      ...line,
                      price: policy(
                        items.find((item) => item.id === line.itemId)!,
                      ).price,
                      discount: 0,
                      batchId: "",
                    })),
                  );
                  setOrderDiscount(0);
                }
              }}
            >
              <Option value="cashier">櫃檯（展示）</Option>
              <Option value="manager">主管／財務（展示）</Option>
            </Select>
          </Field>
        </div>
      </header>
      <p role="status" aria-live="polite" className="pos-feedback">
        {notice}
      </p>
      {salesView ? (
        <SalesList onView={(id) => setView({ kind: "sale", id })} />
      ) : (
        <div className="pos-layout">
          <section className="pos-catalog" aria-label="商品選擇">
            <div className="pos-card">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (matching.length === 1) add(matching[0]);
                  else
                    setNotice(
                      matching.length
                        ? "符合多筆商品，請在下方選擇。"
                        : "查無符合商品，請確認條碼或料號。",
                    );
                }}
              >
                <Field name="pos-search" label="掃碼／搜尋商品">
                  <BaseInput
                    ref={searchRef}
                    placeholder="條碼、料號、品名、英文名、健保碼；Enter 加入"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </Field>
                <BaseButton type="submit" variant="outline">
                  掃碼加入
                </BaseButton>
              </form>
              <div className="pos-form-grid">
                <Field name="pos-category" label="商品分類">
                  <Select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  >
                    <Option value="">全部分類</Option>
                    {[...new Set(items.map((item) => item.category))].map(
                      (value) => (
                        <Option key={value}>{value}</Option>
                      ),
                    )}
                  </Select>
                </Field>
                <Field name="pos-warehouse" label="銷售倉別">
                  <Select
                    value={warehouse}
                    onChange={(event) => setWarehouse(event.target.value)}
                  >
                    {options.warehouses.map((value) => (
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
            </div>
            <h3>{search ? "搜尋結果" : favorites ? "常用商品" : "商品列表"}</h3>
            <div className="pos-products">
              {matching.map((item) => {
                const settings = policy(item),
                  invalid = eligible(item, settings);
                return (
                  <article className="pos-product" key={item.id}>
                    <BaseButton
                      className="pos-product-main"
                      variant="ghost"
                      disabled={Boolean(invalid) || stock(item.id) <= 0}
                      onClick={() => add(item)}
                      aria-label={`加入${item.name}`}
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
                        onClick={() => setView({ kind: "policy", id: item.id })}
                      >
                        <Settings2 aria-hidden="true" />
                        POS 設定
                      </BaseButton>
                    )}
                  </article>
                );
              })}
            </div>
            {!matching.length && <p className="pos-card">查無符合商品。</p>}
          </section>
          <section className="pos-card pos-cart" aria-label="購物車">
            <div className="pos-actions">
              <h3>購物車（{cart.length} 項）</h3>
              <BaseButton
                variant="outline"
                disabled={!cart.length}
                onClick={() => setView({ kind: "clear" })}
              >
                清空
              </BaseButton>
            </div>
            <Field name="pos-customer-search" label="搜尋顧客">
              <BaseInput
                placeholder="姓名、電話或顧客編號"
                value={customerSearch}
                onChange={(event) => setCustomerSearch(event.target.value)}
              />
            </Field>
            <Field name="pos-customer" label="顧客">
              <Select
                value={customer.id}
                onChange={(event) =>
                  setCustomer(
                    customers.find(
                      (entry) => entry.id === event.target.value,
                    ) || walkIn,
                  )
                }
              >
                <Option value="">散客</Option>
                {customers
                  .filter(
                    (entry) =>
                      entry.id === customer.id ||
                      [entry.id, entry.name, entry.phone]
                        .join(" ")
                        .toLowerCase()
                        .includes(customerSearch.toLowerCase()),
                  )
                  .map((entry) => (
                    <Option key={entry.id} value={entry.id}>
                      {entry.id} {entry.name} {entry.phone}
                    </Option>
                  ))}
              </Select>
            </Field>
            <p>已選：{customer.name}；顧客為展示資料，不查詢 HIS 病歷。</p>
            {!cart.length && (
              <p className="pos-empty">請從左側加入商品，或掃碼後按 Enter。</p>
            )}
            {cart.map((line) => {
              const item = items.find((entry) => entry.id === line.itemId)!;
              function change(key: keyof CartLine, value: string | number) {
                setCart(
                  cart.map((entry) =>
                    entry.itemId === line.itemId
                      ? { ...entry, [key]: value }
                      : entry,
                  ),
                );
              }
              return (
                <article className="pos-cart-line" key={line.itemId}>
                  <div className="pos-actions">
                    <strong>{item.name}</strong>
                    <BaseButton
                      variant="ghost"
                      size="icon"
                      aria-label={`移除${item.name}`}
                      onClick={() =>
                        setCart(
                          cart.filter((entry) => entry.itemId !== line.itemId),
                        )
                      }
                    >
                      <Trash2 aria-hidden="true" />
                    </BaseButton>
                  </div>
                  <small>
                    {item.specification} ／ 可用 {stock(item.id)} {item.unit}
                  </small>
                  <div className="pos-form-grid">
                    <Field name={`qty-${item.id}`} label={`${item.name}數量`}>
                      <BaseInput
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={line.quantity}
                        onChange={(event) =>
                          change("quantity", Number(event.target.value))
                        }
                      />
                    </Field>
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
                    {authorized && (
                      <>
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
                        <Field
                          name={`batch-${item.id}`}
                          label={`${item.name}實際批次`}
                        >
                          <Select
                            value={line.batchId}
                            onChange={(event) =>
                              change("batchId", event.target.value)
                            }
                          >
                            <Option value="">自動 FEFO（可跨批次）</Option>
                            {state.batches
                              .filter(
                                (batch) =>
                                  batch.itemId === item.id &&
                                  batch.warehouse === warehouse &&
                                  available(batch) > 0,
                              )
                              .map((batch) => (
                                <Option key={batch.id} value={batch.id}>
                                  {batch.batchNumber || "無批號"} ／{" "}
                                  {batch.expiryDate || "不追蹤效期"} ／{" "}
                                  {available(batch)} {item.unit}
                                </Option>
                              ))}
                          </Select>
                        </Field>
                      </>
                    )}
                  </div>
                  <p>
                    明細小計{" "}
                    {money(
                      Math.max(0, line.quantity * line.price - line.discount),
                    )}
                  </p>
                </article>
              );
            })}
            <Field name="pos-order-discount" label="整單折扣金額">
              <BaseInput
                type="number"
                min="0"
                step="0.01"
                readOnly={!authorized}
                value={orderDiscount}
                onChange={(event) =>
                  setOrderDiscount(Number(event.target.value))
                }
              />
            </Field>
            <p>
              商品小計 {money(priced.subtotal)} ／ 折扣 {money(orderDiscount)}
            </p>
            <strong className="pos-total">應收 {money(priced.total)}</strong>
            {priced.error && cart.length > 0 && (
              <p role="alert" className="items-error">
                {priced.error}
              </p>
            )}
            <BaseButton
              className="pos-checkout"
              disabled={!cart.length || Boolean(priced.error)}
              onClick={() => setView({ kind: "checkout" })}
            >
              <Plus aria-hidden="true" />
              前往結帳
            </BaseButton>
            <small>購物車不預扣；確認結帳才更新本模組展示庫存。</small>
          </section>
        </div>
      )}
      <p className="pos-note">
        展示模式：付款、授權與銷售資格皆為人工情境；僅更新 POS
        記憶體庫存，不更新模組一、不連線金流或
        HIS，重新整理即重置。正式跨系統扣庫與權限待後續串接。
      </p>
      <BaseWorkspaceModal
        open={Boolean(view)}
        title={title}
        description="前端展示操作；不執行正式收付款。"
        onClose={() => close()}
      >
        {discard && (
          <div className="items-modal-scroll">
            <h3>尚有未儲存變更</h3>
            <p>確定放棄此視窗的修改？購物車仍會保留。</p>
            <div className="pos-actions">
              <BaseButton
                autoFocus
                variant="outline"
                onClick={() => setDiscard(false)}
              >
                繼續編輯
              </BaseButton>
              <BaseButton onClick={() => close(true)}>放棄變更</BaseButton>
            </div>
          </div>
        )}
        <div className="pos-modal-slot" hidden={discard}>
          {view?.kind === "checkout" && (
            <CheckoutForm
              cart={cart}
              orderDiscount={orderDiscount}
              warehouse={warehouse}
              customer={customer}
              authorized={authorized}
              onCancel={() => close()}
              onDirty={() => setDirty(true)}
              onSuccess={(id) => {
                setCart([]);
                setOrderDiscount(0);
                setCustomer(walkIn);
                setDirty(false);
                setView({ kind: "sale", id });
                setNotice("展示銷售完成，已更新 POS 庫存；付款與發票未串接。");
              }}
            />
          )}
          {view?.kind === "policy" && selected && (
            <PosPolicyForm
              item={selected}
              initial={policy(selected)}
              onCancel={() => close()}
              onDirty={() => setDirty(true)}
              onSave={(value) => {
                dispatch(savePosPolicy({ itemId: selected.id, policy: value }));
                close(true);
                setNotice("POS 設定已儲存，歷史銷售快照保留。");
              }}
            />
          )}
          {view?.kind === "sale" && sale && (
            <SaleDetails
              sale={sale}
              authorized={authorized}
              onClose={() => close()}
              onReturn={() => setView({ kind: "return", id: sale.id })}
              onVoid={() => setView({ kind: "void", id: sale.id })}
              onRefund={(refundId) =>
                setView({ kind: "refund", id: sale.id, refundId })
              }
            />
          )}
          {view?.kind === "return" && sale && (
            <SaleReturnForm
              sale={sale}
              authorized={authorized}
              onCancel={() => close()}
              onDirty={() => setDirty(true)}
              onDone={done}
            />
          )}
          {view?.kind === "void" && sale && (
            <SaleVoidForm
              sale={sale}
              authorized={authorized}
              onCancel={() => close()}
              onDirty={() => setDirty(true)}
              onDone={done}
            />
          )}
          {view?.kind === "refund" && sale && (
            <SaleRefundForm
              sale={sale}
              refund={sale.refunds.find(
                (record) => record.id === view.refundId,
              )!}
              authorized={authorized}
              onCancel={() => close()}
              onDirty={() => setDirty(true)}
              onDone={done}
            />
          )}
          {view?.kind === "clear" && (
            <>
              <div className="items-modal-scroll">
                <p>確定移除購物車全部商品？尚未扣庫存。</p>
              </div>
              <footer className="items-modal-footer">
                <BaseButton variant="outline" onClick={() => close()}>
                  取消
                </BaseButton>
                <BaseButton
                  onClick={() => {
                    setCart([]);
                    setOrderDiscount(0);
                    close(true);
                    setNotice("購物車已清空。");
                  }}
                >
                  確認清空
                </BaseButton>
              </footer>
            </>
          )}
        </div>
      </BaseWorkspaceModal>
    </div>
  );
}
