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
  percentageDiscount,
  paymentMethods,
  returnAmount,
  refunded,
  pendingRefund,
  refundStatus,
  saleActionReason,
  saleStatus,
  walkIn,
  nextSaleReturnNumber,
  saleReturnRefundStatus,
  saleReturnPending,
} from "./model";
import { createItemsSeed, available } from "@/features/items/model";

describe("整單百分比折扣", () => {
  it.each([
    [355, 10, 35.5],
    [355, 12.5, 44.38],
    [0.05, 10, 0.01],
    [355, 0, 0],
    [355, 100, 355],
  ])("小計 %s 折讓 %s%% 為 %s", (subtotal, percent, amount) => {
    expect(percentageDiscount(subtotal, percent)).toEqual({
      amount,
      error: "",
    });
  });
  it.each([-1, 101, NaN, Infinity, 10.001])("拒絕無效百分比 %s", (percent) => {
    expect(percentageDiscount(355, percent).error).toContain("0% 至 100%");
  });
  it("先扣除單品折扣，整單折扣分攤精確到分且結帳保存金額", () => {
    const store = freshStore();
    const input = checkoutInput(store, 2);
    const subtotal = priceCart(input.cart, 0).subtotal;
    input.orderDiscount = percentageDiscount(subtotal, 12.5).amount;
    const priced = priceCart(input.cart, input.orderDiscount);
    expect(
      priced.priced.reduce((sum, line) => sum + cents(line.orderShare), 0),
    ).toBe(cents(input.orderDiscount));
    expect(store.dispatch(checkoutPos(input)).error).toBe("");
    expect(store.getState().pos.sales[0]).toMatchObject({
      orderDiscount: input.orderDiscount,
      total: priced.total,
    });
  });
});

describe("POS 贈送品項", () => {
  it("贈品為零元且不分攤折扣，取消贈送保留原價與單品折扣", () => {
    const cart = [
      {
        itemId: "gift",
        quantity: 2,
        price: 100,
        discount: 10,
        batchId: "",
        gift: true,
      },
      { itemId: "paid", quantity: 1, price: 80, discount: 0, batchId: "" },
    ];
    const priced = priceCart(cart, 20);
    expect(priced.error).toBe("");
    expect(priced.total).toBe(60);
    expect(priced.priced[0]).toMatchObject({
      price: 0,
      discount: 0,
      orderShare: 0,
      net: 0,
      gift: true,
    });
    expect(priced.priced[1].orderShare).toBe(20);
    expect(cart[0]).toMatchObject({ price: 100, discount: 10 });
    expect(priceCart([{ ...cart[0], gift: false }, cart[1]], 20).total).toBe(
      250,
    );
    expect(
      priceCart(
        cart.map((line) => ({ ...line, gift: true })),
        0,
      ).total,
    ).toBe(0);
  });
  it("櫃檯可贈送並扣庫存，銷售保存零元快照且退款為零", () => {
    const store = freshStore();
    const input = checkoutInput(store, 2);
    input.authorized = false;
    input.cart[0].gift = true;
    input.orderDiscount = 0;
    const before = store
      .getState()
      .pos.batches.reduce((sum, batch) => sum + batch.quantity, 0);
    expect(store.dispatch(checkoutPos(input)).error).toBe("");
    const sale = store.getState().pos.sales[0];
    expect(sale).toMatchObject({ total: 0, subtotal: 0 });
    expect(sale.lines[0]).toMatchObject({
      gift: true,
      price: 0,
      discount: 0,
      net: 0,
      quantity: 2,
    });
    expect(
      store
        .getState()
        .pos.batches.reduce((sum, batch) => sum + batch.quantity, 0),
    ).toBe(before - 2);
    expect(returnAmount(sale, sale.lines[0], 2)).toBe(0);
  });
  it("贈品仍受庫存不足與禁止銷售限制", () => {
    const store = freshStore();
    const input = checkoutInput(store, 9999);
    input.cart[0].gift = true;
    input.orderDiscount = 0;
    expect(store.dispatch(checkoutPos(input)).error).toContain("庫存不足");
    const blocked = store
      .getState()
      .items.items.find((item) => item.code === "MED0003")!;
    input.cart = [
      {
        itemId: blocked.id,
        quantity: 1,
        price: Number(blocked.suggestedPrice),
        discount: 0,
        batchId: "",
        gift: true,
      },
    ];
    expect(store.dispatch(checkoutPos(input)).error).not.toBe("");
  });
});

it.each(paymentMethods)("結帳保存付款方式：%s", (method) => {
  const store = freshStore();
  const input = { ...checkoutInput(store), method };
  expect(store.dispatch(checkoutPos(input)).error).toBe("");
  expect(store.getState().pos.sales[0].payment.method).toBe(method);
});

it("藥品非現金結帳不需付款與專業確認旗標，處方品項仍檢查處方流程", () => {
  const store = freshStore();
  const item = store
    .getState()
    .items.items.find((item) => item.code === "MED0001")!;
  const input = checkoutInput(store, 1);
  input.cart = [
    {
      itemId: item.id,
      quantity: 1,
      price: Number(item.suggestedPrice),
      discount: 0,
      batchId: "",
    },
  ];
  input.orderDiscount = 0;
  input.method = "銀行轉帳";
  expect(store.dispatch(checkoutPos(input)).error).toBe("");
  const prescriptionItem = store
    .getState()
    .items.items.find((item) => item.code === "MED0002")!;
  const next = {
    ...input,
    requestId: crypto.randomUUID(),
    cart: [
      {
        ...input.cart[0],
        itemId: prescriptionItem.id,
        price: Number(prescriptionItem.suggestedPrice),
      },
    ],
  };
  expect(store.dispatch(checkoutPos(next)).error).toContain("處方與調劑流程");
  expect(
    store.dispatch(checkoutPos({ ...next, prescription: true })).error,
  ).toBe("");
});

it("退貨單依建立日期跨銷售單編號，退款以各退貨單關聯計算", () => {
  const sales = createPosSeed().sales;
  const sale = structuredClone(sales[1]);
  const record = sale.returns[0];
  expect(record.saleId).toBe(sale.id);
  expect(record.createdAt).toBeTruthy();
  expect(nextSaleReturnNumber([], "2026-10-20")).toBe("SR20261020-0001");
  record.number = "SR20261020-0009";
  expect(nextSaleReturnNumber([sale], "2026-10-20")).toBe("SR20261020-0010");
  expect(nextSaleReturnNumber([sale], "2026-10-21")).toBe("SR20261021-0001");
  const pending = saleReturnPending(sale, record);
  sale.refunds.push({
    ...sale.refunds[0],
    id: "other",
    sourceId: "other-return",
    amount: 999,
  });
  expect(saleReturnPending(sale, record)).toBe(pending);
  expect(saleReturnRefundStatus(sale, record)).toBe("待退款");
  sale.refunds[0].status = "已退款";
  expect(saleReturnRefundStatus(sale, record)).toBe("已退款");
});

it("交易狀態獨立於退款進度，待退款金額以分計算", () => {
  const sales = createPosSeed().sales;
  expect(refundStatus(sales[0])).toBe("無須退款");
  expect(refundStatus(sales[1])).toBe("待退款");
  expect(refundStatus(sales[2])).toBe("已退款");
  expect(saleStatus(sales[3])).toBe("作廢");
  expect(refundStatus(sales[3])).toBe("待退款");
  const mixed = structuredClone(sales[1]);
  mixed.refunds = [
    { ...mixed.refunds[0], id: "pending-a", amount: 0.1 },
    { ...mixed.refunds[0], id: "pending-b", amount: 0.2 },
    { ...mixed.refunds[0], id: "paid", amount: 20, status: "已退款" },
  ];
  expect(pendingRefund(mixed)).toBe(0.3);
  expect(refundStatus(mixed)).toBe("部分已退款");
});
function freshStore() {
  const initial: RootState = rootStore.getState();
  return configureStore({
    reducer: (
      state: RootState = initial,
      action: UnknownAction,
    ): RootState => ({
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
    prescription: false,
    sellerConfirmed: true,
    authorized: true,
  };
}
describe("POS 展示金額、批次、退貨與防重複", () => {
  it("退貨與作廢的可操作狀態一致，禁止無權限及無剩餘可退量", () => {
    const sales = createPosSeed().sales;
    expect(saleActionReason(sales[0], "return", false)).toContain("權限");
    expect(saleActionReason(sales[0], "return", true)).toBe("");
    expect(saleActionReason(sales[1], "return", true)).toBe("");
    expect(saleActionReason(sales[1], "void", true)).toContain("已有退貨");
    expect(saleActionReason(sales[2], "return", true)).toContain("全部退貨");
    expect(saleActionReason(sales[3], "return", true)).toContain("已作廢");
    expect(saleActionReason(sales[3], "refund", true)).toBe("");
  });
  it("歷史銷售作廢可反向回庫，重複作廢與未授權退貨不變更帳務", () => {
    const store = freshStore();
    const sale = store
      .getState()
      .pos.sales.find((row) => row.id === "SALE-SEED0")!;
    const originalStock = store
      .getState()
      .pos.batches.reduce((sum, row) => sum + row.quantity, 0);
    const originalItems = store.getState().items;
    const request = {
      authorized: false,
      saleId: sale.id,
      requestId: "unauthorized-return",
      date: sale.date.slice(0, 10),
      reason: "測試",
      method: "現金" as const,
      quantities: { [sale.lines[0].id]: 1 },
      disposition: "不可售" as const,
      professional: false,
      confirmed: true,
    };
    expect(store.dispatch(returnPos(request)).error).toContain("授權");
    expect(
      store.getState().pos.sales.find((row) => row.id === sale.id)!.returns,
    ).toHaveLength(0);
    const voidRequest = {
      saleId: sale.id,
      reason: "重複交易",
      notDelivered: true,
      authorized: true,
    };
    expect(
      store.dispatch(voidPos({ ...voidRequest, authorized: false })).error,
    ).not.toBe("");
    expect(store.dispatch(voidPos(voidRequest)).error).toBe("");
    expect(
      store.getState().pos.batches.reduce((sum, row) => sum + row.quantity, 0),
    ).toBe(originalStock + 2);
    const updated = store
      .getState()
      .pos.sales.find((row) => row.id === sale.id)!;
    expect(pendingRefund(updated)).toBe(sale.total);
    expect(store.dispatch(voidPos(voidRequest)).error).not.toBe("");
    expect(
      store.getState().pos.batches.reduce((sum, row) => sum + row.quantity, 0),
    ).toBe(originalStock + 2);
    expect(store.getState().items).toEqual(originalItems);
  });
  it("歷史商品可部分及全部退回可售庫存，重試同識別碼不重複退款", () => {
    const store = freshStore();
    const sale = store
      .getState()
      .pos.sales.find((row) => row.id === "SALE-SEED0")!;
    const originalStock = store
      .getState()
      .pos.batches.reduce((sum, row) => sum + row.quantity, 0);
    const input = {
      authorized: true,
      saleId: sale.id,
      requestId: "partial-return",
      date: sale.date.slice(0, 10),
      reason: "退回未使用商品",
      method: "現金" as const,
      quantities: { [sale.lines[0].id]: 1 },
      disposition: "可售回庫" as const,
      professional: false,
      confirmed: true,
    };
    const firstReturn = store.dispatch(returnPos(input));
    expect(firstReturn.error).toBe("");
    expect(firstReturn.returnNumber).toMatch(/^SR\d{8}-\d{4}$/);
    expect(store.dispatch(returnPos(input))).toEqual(firstReturn);
    expect(
      store.getState().pos.batches.reduce((sum, row) => sum + row.quantity, 0),
    ).toBe(originalStock + 1);
    const partial = store
      .getState()
      .pos.sales.find((row) => row.id === sale.id)!;
    expect(partial.refunds).toHaveLength(1);
    expect(saleStatus(partial)).toBe("部分退貨");
    expect(
      store.dispatch(
        voidPos({
          saleId: sale.id,
          reason: "重複交易",
          notDelivered: true,
          authorized: true,
        }),
      ).error,
    ).not.toBe("");
    expect(
      store.dispatch(returnPos({ ...input, requestId: "remaining-return" }))
        .error,
    ).toBe("");
    const full = store.getState().pos.sales.find((row) => row.id === sale.id)!;
    expect(full.returns).toHaveLength(2);
    expect(full.returns[0].number).not.toBe(full.returns[1].number);
    expect(full.returns.every((record) => record.saleId === sale.id)).toBe(
      true,
    );
    expect(saleStatus(full)).toBe("全部退貨");
    expect(pendingRefund(full)).toBe(sale.total);
    expect(
      store.getState().pos.batches.reduce((sum, row) => sum + row.quantity, 0),
    ).toBe(originalStock + 2);
  });
  it("櫃檯可使用單品及整單折扣，改售價仍需主管權限", () => {
    const store = freshStore();
    const input = checkoutInput(store, 2);
    input.authorized = false;
    input.cart[0].discount = 10;
    input.orderDiscount = 5;
    const expected = priceCart(input.cart, input.orderDiscount).total;
    expect(store.dispatch(checkoutPos(input)).error).toBe("");
    expect(store.getState().pos.sales[0].total).toBe(expected);
    const changedPrice = checkoutInput(store);
    changedPrice.authorized = false;
    changedPrice.cart[0].price += 1;
    expect(store.dispatch(checkoutPos(changedPrice)).error).toContain(
      "修改售價需主管",
    );
    const invalidDiscount = checkoutInput(store);
    invalidDiscount.authorized = false;
    invalidDiscount.orderDiscount = 999999;
    expect(store.dispatch(checkoutPos(invalidDiscount)).error).toContain(
      "整單折扣不可超過",
    );
  });
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
    expect(sale.invoiceStatus).toBe("不開立");
    expect(sale.receiptType).toBe(input.receiptType);
    expect(sale.sellerTaxId).toBe("");
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
          authorized: true,
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
          authorized: true,
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
