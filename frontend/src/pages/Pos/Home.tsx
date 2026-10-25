import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { ShoppingCart, Plus } from "lucide-react";
import { BaseButton } from "@/components/ui/BaseButton";
import { BaseTabs } from "@/components/ui/BaseTabs";
import { BaseInput } from "@/components/ui/BaseInput";
import { BaseField as Field } from "@/components/ui/BaseForm";
import {
  BaseNativeSelect as Select,
  BaseNativeSelectOption as Option,
} from "@/components/ui/BaseNativeSelect";
import { BaseWorkspaceModal } from "@/components/ui/BaseWorkspaceModal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { savePosPolicy } from "@/store/pos";
import { useWorkspaceDirty } from "@/features/workspace/useWorkspaceDirty";
import { usePosDraft } from "@/features/pos/usePosDraft";
import { available } from "@/features/items/model";
import type { Item } from "@/types/items";
import { useBaseDataOptions } from "@/features/base-data/useBaseDataOptions";
import { CheckoutForm } from "@/features/pos/CheckoutForm";
import { PosPolicyForm } from "@/features/pos/PosPolicyForm";
import { SaleDetails } from "@/features/pos/SaleDetails";
import { SalesList } from "@/features/pos/SalesList";
import {
  SaleReturnForm,
  SaleRefundForm,
  SaleVoidForm,
} from "@/features/pos/SaleForms";
import {
  customers,
  walkIn,
  eligible,
  money,
  policyFor,
  priceCart,
} from "@/features/pos/model";
import { SaleLines } from "@/features/pos/SaleLines";
import { ProductPicker } from "@/features/pos/ProductPicker";
import "@/features/items/items.css";
import "@/features/purchases/purchases.css";
import "@/features/pos/pos.css";
type View = {
  kind:
    | "products"
    | "checkout"
    | "policy"
    | "sale"
    | "return"
    | "refund"
    | "void"
    | "clear";
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
  const salesView = location.pathname.replace(/\/+$/, "") === "/sales";
  useEffect(() => {
    if (location.state?.focusSalesTab)
      document.getElementById(salesView ? "pos-sales" : "pos-pos")?.focus();
  }, [salesView, location.key, location.state]);
  const [cart, setCart] = usePosDraft("cart"),
    [orderDiscount, setOrderDiscount] = usePosDraft("orderDiscount"),
    [warehouse, setWarehouse] = usePosDraft("warehouse");
  const [customer, setCustomer] = usePosDraft("customer"),
    [customerSearch, setCustomerSearch] = useState("");
  const [search, setSearch] = useState("");
  const [recentItemId, setRecentItemId] = useState("");
  const [composing, setComposing] = useState(false);
  const [authorized, setAuthorized] = usePosDraft("authorized");
  const [view, setView] = useState<View | null>(null),
    [dirty, setDirty] = useState(false),
    [discard, setDiscard] = useState(false),
    [notice, setNotice] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const lastAutoScan = useRef("");
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  useWorkspaceDirty(dirty);
  useEffect(() => {
    if (!cart.length) return;
    const warnOnRefresh = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnOnRefresh);
    return () => window.removeEventListener("beforeunload", warnOnRefresh);
  }, [cart.length]);
  const priced = priceCart(cart, orderDiscount),
    sale = state.sales.find((record) => record.id === view?.id),
    selected = items.find((item) => item.id === view?.id);
  const stock = (id: string) =>
    state.batches
      .filter((batch) => batch.itemId === id && batch.warehouse === warehouse)
      .reduce((sum, batch) => sum + available(batch), 0);
  const noStockReason = (_id: string) => "無可用庫存";
  const policy = (item: Item) => state.policies[item.id] || policyFor(item);
  const matching = items
    .filter((item) =>
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
    setRecentItemId(item.id);
    setNotice(
      `已加入 ${item.name}，本單數量 ${(existing?.quantity || 0) + 1} ${item.unit}。`,
    );
    searchRef.current?.focus();
  }
  useEffect(() => {
    if (!search.trim()) {
      lastAutoScan.current = "";
      return;
    }
    if (composing || salesView || view || lastAutoScan.current === search)
      return;
    const exact = items.filter((item) =>
      [item.code, item.barcode].some(
        (value) => value && value.toLowerCase() === search.trim().toLowerCase(),
      ),
    );
    if (exact.length !== 1) return;
    const timer = window.setTimeout(() => {
      lastAutoScan.current = search;
      add(exact[0]);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [
    search,
    composing,
    salesView,
    view,
    warehouse,
    cart,
    items,
    state.policies,
    state.batches,
  ]);
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
    const completed = view?.kind;
    setDirty(false);
    setView(sale ? { kind: "sale", id: sale.id } : null);
    setNotice(
      completed === "refund"
        ? "已確認退款完成。"
        : completed === "void"
          ? "交易已作廢，可在明細查看退款狀態。"
          : "退貨已建立，可在明細查看退款狀態。",
    );
  }
  const title =
    view?.kind === "products"
      ? "挑選商品"
      : view?.kind === "checkout"
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
    <div
      className={`items-page pos-page${salesView ? "" : " pos-register-page"}`}
    >
      <header className="items-heading">
        <div className="items-title">
          <ShoppingCart aria-hidden="true" />
          <div>
            <h2>{salesView ? "銷售紀錄" : "POS 銷售收銀"}</h2>
            <p>商品銷售、付款與退貨追蹤的前端展示</p>
          </div>
        </div>
        <div className="pos-actions">
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
                      batchId: "",
                    })),
                  );
                }
              }}
            >
              <Option value="cashier">櫃檯（展示）</Option>
              <Option value="manager">主管／財務（展示）</Option>
            </Select>
          </Field>
        </div>
      </header>
      <BaseTabs
        id="pos"
        label="銷售工作區"
        value={salesView ? "sales" : "pos"}
        options={[
          {
            value: "pos",
            label: `收銀${cart.length ? `（${cart.length} 項未結帳）` : ""}`,
          },
          { value: "sales", label: "銷售紀錄" },
        ]}
        onChange={(value) =>
          navigate(`/${value}${location.search}`, {
            state: { focusSalesTab: true },
          })
        }
      />
      <div
        id="pos-panel"
        role="tabpanel"
        aria-labelledby={salesView ? "pos-sales" : "pos-pos"}
        tabIndex={0}
      >
        {salesView && cart.length > 0 && (
          <p className="pos-draft-note">
            購物車已暫存，切換頁面可繼續收銀；重新整理即重置。
          </p>
        )}
        {salesView ? (
          <SalesList
            authorized={authorized}
            onView={(id) => setView({ kind: "sale", id })}
            onAction={(id, action) => {
              if (action === "refund") {
                const refund = state.sales
                  .find((record) => record.id === id)
                  ?.refunds.find((record) => record.status === "待退款");
                if (refund)
                  setView({ kind: "refund", id, refundId: refund.id });
              } else setView({ kind: action, id });
            }}
          />
        ) : (
          <div className="pos-register">
            <section className="pos-card pos-transaction" aria-label="交易資料">
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
            </section>
            <section className="pos-card pos-sale-sheet" aria-label="銷售單">
              <form
                className="pos-scan"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!search.trim()) {
                    return;
                  }
                  const exact = matching.find((item) =>
                    [item.code, item.barcode, item.nhiCode].some(
                      (value) =>
                        value &&
                        value.toLowerCase() === search.trim().toLowerCase(),
                    ),
                  );
                  if (exact || matching.length === 1) add(exact || matching[0]);
                  else if (matching.length) setView({ kind: "products" });
                  else
                    setNotice(
                      "查無符合商品。請確認條碼或料號，或使用挑選商品搜尋。",
                    );
                }}
              >
                <Field name="pos-search" label="掃碼／搜尋商品">
                  <BaseInput
                    ref={searchRef}
                    placeholder="掃描條碼自動加入；亦可輸入料號或品名搜尋"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onCompositionStart={() => setComposing(true)}
                    onCompositionEnd={() => setComposing(false)}
                  />
                </Field>
                <BaseButton type="submit" variant="outline">
                  搜尋商品
                </BaseButton>
                <BaseButton
                  type="button"
                  variant="outline"
                  onClick={() => setView({ kind: "products" })}
                >
                  <Plus aria-hidden="true" />
                  挑選商品
                </BaseButton>
              </form>
              <div className="pos-actions pos-lines-heading">
                <h3>
                  銷售明細{" "}
                  <span className="pos-item-count">{cart.length} 項</span>
                </h3>
                <small>掃碼自動加入；折扣欄填寫折讓金額</small>
                <BaseButton
                  variant="outline"
                  disabled={!cart.length}
                  onClick={() => setView({ kind: "clear" })}
                >
                  清空
                </BaseButton>
              </div>
              <SaleLines
                cart={cart}
                items={items}
                batches={state.batches}
                warehouse={warehouse}
                authorized={authorized}
                recentItemId={recentItemId}
                onChange={setCart}
              />
            </section>
            <section className="pos-card pos-settlement" aria-label="結帳摘要">
              <div className="pos-summary-heading">
                <h3>本筆交易</h3>
                <span>待結帳</span>
              </div>
              <div className="pos-amount">
                <small>應收金額</small>
                <strong>{money(priced.total)}</strong>
                <span>{cart.length} 項商品</span>
              </div>
              <div className="pos-settlement-subtotal">
                <span>
                  商品小計 <strong>{money(priced.subtotal)}</strong>
                </span>
                <small>顧客：{customer.name}</small>
              </div>
              <Field name="pos-order-discount" label="整單折扣金額">
                <BaseInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={orderDiscount}
                  onChange={(event) =>
                    setOrderDiscount(Number(event.target.value))
                  }
                />
              </Field>
              {priced.error && cart.length > 0 && (
                <p role="alert" className="items-error pos-settlement-error">
                  {priced.error}
                </p>
              )}
              <BaseButton
                className="pos-checkout"
                disabled={!cart.length || Boolean(priced.error)}
                onClick={() => setView({ kind: "checkout" })}
              >
                前往結帳
              </BaseButton>
              <small className="pos-settlement-hint">
                切換查單保留明細；確認結帳後出庫。
              </small>
            </section>
          </div>
        )}
        {!salesView && (
          <details className="pos-recent-sales">
            <summary>最近交易・查單與補印</summary>
            <div className="pos-actions">
              {[...state.sales]
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 3)
                .map((record) => (
                  <BaseButton
                    key={record.id}
                    variant="outline"
                    onClick={() => setView({ kind: "sale", id: record.id })}
                  >
                    {record.number}・{money(record.total)}
                  </BaseButton>
                ))}
            </div>
          </details>
        )}
        {!salesView && !view && cart.length > 0 && (
          <div className="pos-mobile-checkout" aria-label="快速結帳">
            <div>
              <small>{cart.length} 項商品</small>
              <strong>應收 {money(priced.total)}</strong>
            </div>
            <BaseButton
              disabled={Boolean(priced.error)}
              onClick={() => setView({ kind: "checkout" })}
            >
              結帳
            </BaseButton>
          </div>
        )}
        <p className="pos-note">
          展示模式：付款、授權與銷售資格皆為人工情境；僅更新 POS
          記憶體庫存，不更新模組一、不連線金流或
          HIS，重新整理即重置。正式跨系統扣庫與權限待後續串接。
        </p>
      </div>
      <BaseWorkspaceModal
        open={Boolean(view)}
        title={title}
        description={
          view?.kind === "checkout"
            ? "核對應收金額與付款方式後完成結帳。"
            : "前端展示操作；不執行正式收付款。"
        }
        onClose={() => close()}
      >
        {discard && (
          <div className="items-modal-scroll">
            <h3>尚有未儲存變更</h3>
            <p>
              {view?.kind === "return" ||
              view?.kind === "void" ||
              view?.kind === "refund"
                ? "確定放棄本次操作？原交易紀錄不會變更。"
                : "確定放棄此視窗的修改？購物車仍會保留。"}
            </p>
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
          {view?.kind === "products" && (
            <ProductPicker
              items={items}
              cart={cart}
              initialSearch={search}
              authorized={authorized}
              stock={stock}
              policy={policy}
              noStockReason={noStockReason}
              onAdd={add}
              onPolicy={(id) => setView({ kind: "policy", id })}
              onClose={() => close()}
            />
          )}
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
      {notice && (
        <div className="items-toast" role="status">
          {notice}
        </div>
      )}
    </div>
  );
}
