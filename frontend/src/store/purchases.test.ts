import { describe, expect, it } from "vitest";
import reducer, {
  addPurchase,
  addPurchaseRecord,
  resolvePurchaseRecord,
  settlePurchase,
} from "./purchases";
import {
  createPurchasesSeed,
  type PurchaseRecord,
  type Settlement,
} from "@/features/purchases/model";

describe("進貨入帳與更正防重複", () => {
  it("同一張進貨單重複送出只保存一次，原資料不變", () => {
    const state = createPurchasesSeed();
    const order = { ...state.orders[0], id: "UNIT-NEW", number: "UNIT-NEW" };
    const first = reducer(state, addPurchase(order));
    expect(reducer(first, addPurchase(order)).orders).toHaveLength(
      state.orders.length + 1,
    );
    expect(state.orders.some((row) => row.id === order.id)).toBe(false);
  });
  it("已核對的單據不被第二次送出覆蓋", () => {
    const state = createPurchasesSeed();
    const order = state.orders.find((row) => !row.settlement)!;
    const settlement = {
      number: "SETTLE-1",
      amount: 100,
      operator: "測試人員",
    } as Settlement;
    const first = reducer(state, settlePurchase({ id: order.id, settlement }));
    const second = reducer(
      first,
      settlePurchase({
        id: order.id,
        settlement: { ...settlement, amount: 999 },
      }),
    );
    expect(
      second.orders.find((row) => row.id === order.id)?.settlement?.amount,
    ).toBe(100);
    expect(
      state.orders.find((row) => row.id === order.id)?.settlement,
    ).toBeNull();
  });
  it("更正與結案重複操作不覆蓋已完成帳務", () => {
    const state = createPurchasesSeed();
    const order = state.orders[0];
    const record = {
      id: "UNIT-CORRECTION",
      kind: "correction",
      accountingStatus: "待處理",
      lines: [],
    } as PurchaseRecord;
    const action = addPurchaseRecord({ id: order.id, record });
    const first = reducer(reducer(state, action), action);
    expect(
      first.orders[0].records.filter((row) => row.id === record.id),
    ).toHaveLength(1);
    const payload = {
      orderId: order.id,
      recordId: record.id,
      amount: "100",
      reference: "REF-1",
      resolution: "已退款",
      resolvedAt: "2026-10-20T08:00:00Z",
      operator: "測試人員",
    };
    const resolved = reducer(first, resolvePurchaseRecord(payload));
    const repeated = reducer(
      resolved,
      resolvePurchaseRecord({ ...payload, amount: "999", operator: "其他人" }),
    );
    expect(repeated).toEqual(resolved);
    expect(
      repeated.orders[0].records.find((row) => row.id === record.id),
    ).toMatchObject({
      accountingStatus: "已完成",
      resolutionAmount: "100",
      resolvedBy: "測試人員",
    });
  });
});
