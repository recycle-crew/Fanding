import { configureStore, type UnknownAction } from "@reduxjs/toolkit";
import { describe, expect, it } from "vitest";
import { store as rootStore } from "@/store";
import type { RootState } from "@/store";
import posReducer, {
  checkoutPos,
  returnPos,
  refundPos,
  voidPos,
} from "@/store/pos";
import type { CheckoutInput } from "@/types/store/pos";
import itemsReducer, { saveItem } from "@/store/items";
import {
  allocate,
  cents,
  createPosSeed,
  priceCart,
  returnAmount,
  refunded,
  saleStatus,
  walkIn,
} from "./model";
import { createItemsSeed, available } from "@/features/items/model";
function freshStore() {
  const initial: RootState = rootStore.getState();
  return configureStore({
    reducer: (state: RootState = initial, action: UnknownAction): RootState => ({
      ...state,
      items: itemsReducer(state.items, action),
      pos: posReducer(state.pos, action),
    }),
  });
}
function checkoutInput(
  store: ReturnType<typeof freshStore>,
  quantity = 4,
): CheckoutInput {
  const item = store
    .getState()
    .items.items.find((row) => row.code === "OTC0001")!;
  return {
    requestId: crypto.randomUUID(),
    cart: [
      {
        itemId: item.id,
        quantity,
        price: Number(item.suggestedPrice),
        discount: 10,
        batchId: "",
      },
    ],
    orderDiscount: 3.01,
    warehouse: "主倉庫",
    customer: walkIn,
    seller: "示範商行",
    receiptType: "一般銷售憑證",
    remark: "",
    method: "現金",
    received: 5000,
    reference: "",
    paymentConfirmed: false,
    professional: false,
    prescription: false,
    sellerConfirmed: true,
    authorized: true,
  };
}
describe("POS 展示金額、批次、退貨與防重複", () => {
  it("整單折扣按分攤餘數分配到分，合計精確且不負值", () => {
    const result = priceCart(
      [1, 2, 3].map((i) => ({
        itemId: String(i),
        quantity: 1,
        price: 0.01,
        discount: 0,
        batchId: "",
      })),
      0.02,
    );
    expect(result.priced.map((line) => cents(line.orderShare))).toEqual([
      1, 1, 0,
    ]);
    expect(cents(result.total)).toBe(1);
    expect(result.priced.reduce((sum, line) => sum + cents(line.net), 0)).toBe(
      1,
    );
    expect(
      priceCart(
        [{ itemId: "i", quantity: 1, price: 10, discount: 11, batchId: "" }],
        0,
      ).error,
    ).not.toBe("");
  });
  it("僅取指定倉別可用未過期批次，FEFO 可跨批次且指定批次不足會阻擋", () => {
    const seed = createPosSeed(),
      item = createItemsSeed().items.find((row) => row.code === "OTC0001")!;
    const allocations = allocate(seed.batches, item, "主倉庫", 4)!;
    expect(allocations).toHaveLength(2);
    expect(allocations.reduce((sum, row) => sum + row.quantity, 0)).toBe(4);
    expect(
      allocate(seed.batches, item, "主倉庫", 4, allocations[0].batchId),
    ).toBeNull();
    expect(allocate(seed.batches, item, "主倉庫", 9)).toBeNull();
  });
  it("結帳重複識別碼只建立一單，主檔改名改價不覆寫銷售快照，模組一庫存不變", () => {
    const store = freshStore(),
      input = checkoutInput(store);
    const originalStock = store.getState().items.batches;
    const result = store.dispatch(checkoutPos(input));
    expect(result.error).toBe("");
    const sale = store.getState().pos.sales[0];
    expect(sale.lines[0].allocations).toHaveLength(2);
    const count = store.getState().pos.sales.length,
      remaining = store
        .getState()
        .pos.batches.reduce((sum, row) => sum + row.quantity, 0);
    expect(store.dispatch(checkoutPos(input)).saleId).toBe(sale.id);
    expect(store.getState().pos.sales).toHaveLength(count);
    expect(
      store.getState().pos.batches.reduce((sum, row) => sum + row.quantity, 0),
    ).toBe(remaining);
    const item = store
      .getState()
      .items.items.find((row) => row.id === sale.lines[0].itemId)!;
    store.dispatch(
      saveItem({ ...item, name: "新名稱", suggestedPrice: "9999" }),
    );
    expect(store.getState().pos.sales[0].lines[0].name).toBe(
      sale.lines[0].name,
    );
    expect(store.getState().items.batches).toEqual(originalStock);
  });
  it("退貨依歷史淨額累計到分，待退款不視為實付，超退及重複退款被阻擋", () => {
    const store = freshStore();
    store.dispatch(checkoutPos(checkoutInput(store, 3)));
    let sale = store.getState().pos.sales[0],
      line = sale.lines[0];
    const originalNet = line.net;
    const before = store
      .getState()
      .pos.batches.reduce((sum, row) => sum + available(row), 0);
    let returned = 0;
    for (let i = 0; i < 3; i++) {
      const amount = returnAmount(sale, line, 1);
      const result = store.dispatch(
        returnPos({
          saleId: sale.id,
          requestId: `R${i}`,
          date: sale.date.slice(0, 10),
          reason: "退貨",
          quantities: { [line.id]: 1 },
          method: "現金",
          disposition: "不可售",
          professional: false,
          confirmed: true,
        }),
      );
      expect(result.error).toBe("");
      returned += cents(amount);
      sale = store.getState().pos.sales[0];
    }
    expect(returned).toBe(cents(originalNet));
    expect(saleStatus(sale)).toBe("全部退貨");
    expect(refunded(sale)).toBe(0);
    expect(
      store
        .getState()
        .pos.batches.reduce((sum, row) => sum + available(row), 0),
    ).toBe(before);
    expect(
      store.dispatch(
        returnPos({
          saleId: sale.id,
          requestId: "over",
          date: sale.date.slice(0, 10),
          reason: "退",
          quantities: { [line.id]: 1 },
          method: "現金",
          disposition: "不可售",
          professional: false,
          confirmed: true,
        }),
      ).error,
    ).not.toBe("");
    const refund = sale.refunds[0];
    expect(
      store.dispatch(
        refundPos({
          saleId: sale.id,
          refundId: refund.id,
          confirmed: true,
          reference: "",
          authorized: true,
        }),
      ).error,
    ).toBe("");
    expect(refunded(store.getState().pos.sales[0])).toBe(refund.amount);
    expect(
      store.dispatch(
        refundPos({
          saleId: sale.id,
          refundId: refund.id,
          confirmed: true,
          reference: "",
          authorized: true,
        }),
      ).error,
    ).not.toBe("");
  });
  it("未交付作廢反向回庫、保留發票狀態並建立待退款，禁止重複作廢", () => {
    const store = freshStore(),
      initial = store
        .getState()
        .pos.batches.reduce((sum, row) => sum + row.quantity, 0);
    store.dispatch(checkoutPos(checkoutInput(store)));
    const sale = store.getState().pos.sales[0];
    expect(
      store.dispatch(
        voidPos({
          saleId: sale.id,
          reason: "重複輸入",
          notDelivered: false,
          authorized: true,
        }),
      ).error,
    ).not.toBe("");
    expect(
      store.dispatch(
        voidPos({
          saleId: sale.id,
          reason: "重複輸入",
          notDelivered: true,
          authorized: true,
        }),
      ).error,
    ).toBe("");
    expect(
      store.getState().pos.batches.reduce((sum, row) => sum + row.quantity, 0),
    ).toBe(initial);
    expect(store.getState().pos.sales[0].invoiceStatus).toBe(
      sale.invoiceStatus,
    );
    expect(store.getState().pos.sales[0].refunds[0].status).toBe("待退款");
    expect(
      store.dispatch(
        voidPos({
          saleId: sale.id,
          reason: "再作廢",
          notDelivered: true,
          authorized: true,
        }),
      ).error,
    ).not.toBe("");
  });
});
