import { describe, expect, it } from "vitest";
import type { PurchaseRecord } from "@/types/purchases";
import { createPurchasesSeed, lineBalance } from "./model";
import { lineMovements } from "./lineMovements";

function fixture() {
  const order = createPurchasesSeed().orders[0];
  order.records = [];
  const line = { ...order.lines[0], quantity: 20 };
  order.lines = [line];
  const record = (
    id: string,
    kind: PurchaseRecord["kind"],
    change: number,
    time: string,
  ): PurchaseRecord => ({
    id,
    number: id,
    kind,
    date: "2026-10-20",
    createdAt: time,
    reason: "測試",
    resolution: "折讓",
    accountingStatus: "待處理",
    amount: Math.abs(change) * line.unitCost,
    resolutionAmount: "",
    reference: "",
    remark: "",
    operator: "測試人員",
    lines: [
      {
        lineId: line.id,
        quantityChange: change,
        amount: change * line.unitCost,
      },
    ],
  });
  return { order, line, record };
}

describe("進貨明細逐筆數量異動", () => {
  it("依建立時間與時區排序，退貨與沖銷各自扣減並維持原始資料", () => {
    const { order, line, record } = fixture();
    order.records = [
      record("REV", "reversal", -3, "2026-10-20T03:00:00Z"),
      record("RET", "return", -5, "2026-10-20T10:00:00+08:00"),
    ];
    const result = lineMovements(order, line);
    expect(
      result.entries.map(({ record, remaining }) => [record.id, remaining]),
    ).toEqual([
      ["RET", 15],
      ["REV", 12],
    ]);
    expect(result).toMatchObject({
      returned: 5,
      reversed: 3,
      corrected: 0,
      remaining: 12,
    });
    expect(result.remaining).toBe(lineBalance(order, line).remaining);
    expect(line.quantity).toBe(20);
    expect(order.records[0].id).toBe("REV");
  });

  it("同商品不同批次分開計算，正負更正與零數量成本更正均保留", () => {
    const { order, line, record } = fixture();
    const correction = record("COR", "correction", 2, "2026-10-20T01:00:00Z");
    const otherBatch = { ...line, id: "other-batch", batch: "OTHER" };
    correction.lines.push({
      lineId: otherBatch.id,
      quantityChange: -4,
      amount: -400,
    });
    const cost = record("COST", "correction", 0, "2026-10-20T02:00:00Z");
    cost.lines[0].newUnitCost = 150;
    order.records = [
      correction,
      cost,
      record("MINUS", "correction", -1, "2026-10-20T03:00:00Z"),
    ];
    const result = lineMovements(order, line);
    expect(result.entries.map(({ remaining }) => remaining)).toEqual([
      22, 22, 21,
    ]);
    expect(result.corrected).toBe(1);
    expect(result.entries[1].entry.newUnitCost).toBe(150);
    expect(lineMovements(order, otherBatch).remaining).toBe(16);
  });

  it("無異動時保留原始數量，全部退貨後歸零，小數數量無浮點尾數", () => {
    const { order, line, record } = fixture();
    line.quantity = 0.3;
    expect(lineMovements(order, line)).toMatchObject({
      entries: [],
      remaining: 0.3,
    });
    order.records = [
      record("RET1", "return", -0.1, "2026-10-20T01:00:00Z"),
      record("RET2", "return", -0.2, "2026-10-20T02:00:00Z"),
    ];
    expect(lineMovements(order, line)).toMatchObject({
      returned: 0.3,
      remaining: 0,
    });
    expect(
      lineMovements(order, line).entries.map(({ remaining }) => remaining),
    ).toEqual([0.2, 0]);
  });
});
