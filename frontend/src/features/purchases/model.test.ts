import { describe, expect, it } from "vitest";
import {
  createPurchasesSeed,
  lineBalance,
  originalAmount,
  rounded,
  snapshot,
  returnStatus,
  correctionStatus,
  recentMonthRange,
  reversalStatus,
  reconciliationAmounts,
  pendingAccounting,
} from "./model";
import type { PurchaseRecord } from "@/types/purchases";
import { createItemsSeed } from "@/features/items/model";

describe("最近一個月日期範圍", () => {
  it.each([
    ["2026-10-24", "2026-09-24"],
    ["2026-03-31", "2026-02-28"],
    ["2024-03-31", "2024-02-29"],
    ["2026-01-31", "2025-12-31"],
  ])("%s 往前推一個曆月為 %s", (today, start) => {
    expect(recentMonthRange(today)).toEqual({ start, end: today });
  });
});

describe("進貨金額、快照與可退數量", () => {
  it("沖銷與退貨分開計算，全部沖銷只依沖銷數量判斷", () => {
    const order = createPurchasesSeed().orders[0];
    const line = { ...order.lines[0], quantity: 10, unitCost: 100 };
    order.lines = [line];
    order.records = [];
    const record = {
      id: "R",
      kind: "reversal",
      amount: 300,
      accountingStatus: "已完成",
      lines: [{ lineId: line.id, quantityChange: -3, amount: -300 }],
    } as PurchaseRecord;
    expect(reversalStatus(order)).toBe("無");
    order.records.push(record);
    expect(reversalStatus(order)).toBe("部分沖銷");
    order.records.push({
      ...record,
      id: "T",
      kind: "return",
      amount: 700,
      accountingStatus: "待處理",
      lines: [{ lineId: line.id, quantityChange: -7, amount: -700 }],
    });
    expect(reversalStatus(order)).toBe("部分沖銷");
    expect(reconciliationAmounts(order)).toEqual({
      original: 1000,
      reversal: 300,
      returns: 700,
      reference: 0,
    });
    expect(pendingAccounting(order)).toHaveLength(1);
    order.records[1].kind = "reversal";
    expect(reversalStatus(order)).toBe("全部沖銷");
  });
  it("明細先四捨五入至分，再加總", () => {
    const order = createPurchasesSeed().orders[0];
    order.lines = [
      { ...order.lines[0], quantity: 3, unitCost: 1.235 },
      { ...order.lines[0], id: "L2", quantity: 1, unitCost: 0 },
    ];
    expect(originalAmount(order)).toBe(3.71);
    expect(rounded(1.005)).toBe(1.01);
  });
  it("建立明細保存品項快照，主檔後續修改不影響原明細", () => {
    const item = createItemsSeed().items[0];
    const line = snapshot(item, "L");
    const oldName = item.name;
    item.name = "修改主檔";
    expect(line.name).toBe(oldName);
    expect(line.quantity).toBe(1);
  });
  it("部分與全數退貨依剩餘數量判斷，可追溯數量不得超出剩餘", () => {
    const order = createPurchasesSeed().orders[0];
    const line = { ...order.lines[0], quantity: 10, traceableQuantity: 8 };
    order.lines = [line];
    order.records = [];
    const record = {
      id: "R",
      kind: "return",
      lines: [{ lineId: line.id, quantityChange: -3, amount: 30 }],
    } as PurchaseRecord;
    expect(returnStatus(order)).toBe("無");
    order.records.push(record);
    expect(lineBalance(order, line)).toEqual({
      processed: 3,
      remaining: 7,
      traceable: 5,
    });
    expect(returnStatus(order)).toBe("部分退貨");
    order.records.push({
      ...record,
      id: "R2",
      lines: [{ lineId: line.id, quantityChange: -7, amount: 70 }],
    });
    expect(returnStatus(order)).toBe("全部退貨");
    expect(lineBalance(order, line).traceable).toBe(0);
  });
  it("更正有待處理帳務時保持處理中，結案後顯示已更正", () => {
    const order = createPurchasesSeed().orders[0];
    order.records = [];
    expect(correctionStatus(order)).toBe("無");
    order.records.push({
      id: "C",
      kind: "correction",
      accountingStatus: "待處理",
      lines: [],
    } as PurchaseRecord);
    expect(correctionStatus(order)).toBe("更正處理中");
    order.records[0].accountingStatus = "已完成";
    expect(correctionStatus(order)).toBe("已更正");
  });
});
