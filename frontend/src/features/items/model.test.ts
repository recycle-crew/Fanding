import { describe, expect, it } from "vitest";
import {
  available,
  batchAverage,
  createItemsSeed,
  expiryStatus,
  relativeDate,
  stockStatus,
  taipeiToday,
  usageStatus,
  validateItem,
  type InventoryBatch,
} from "./model";

const batch = (
  expiryDate: string,
  quantity = 10,
  unavailable = 2,
): InventoryBatch => ({
  id: "B",
  itemId: "I",
  warehouse: "主倉",
  batchNumber: "B001",
  expiryDate,
  quantity,
  unavailable,
  receivedAt: "2026-10-20",
});
describe("品項庫存與效期規則", () => {
  it("跨月與跨年日期以台北日曆計算", () => {
    expect(taipeiToday()).toBe("2026-10-20");
    expect(relativeDate(1, "2026-12-31")).toBe("2027-01-01");
    expect(relativeDate(-1, "2024-03-01")).toBe("2024-02-29");
  });
  it("過期批次不可用；當日到期仍屬即將到期", () => {
    expect(available(batch("2026-10-19"))).toBe(0);
    expect(expiryStatus(batch("2026-10-20"))).toBe("即將到期");
    expect(available(batch("2026-10-20"))).toBe(8);
    expect(available(batch("", 1, 3))).toBe(0);
  });
  it("90 天是即將到期上界，超過則正常", () => {
    expect(expiryStatus(batch(relativeDate(90)))).toBe("即將到期");
    expect(expiryStatus(batch(relativeDate(91)))).toBe("正常");
  });
  it("庫存狀態只計入自身可用批次，安全庫存等值仍算低庫存", () => {
    const item = { ...createItemsSeed().items[0], id: "I", safetyStock: 8 };
    expect(
      stockStatus(item, [
        batch(""),
        { ...batch(""), itemId: "OTHER", quantity: 100 },
      ]),
    ).toBe("低庫存");
    expect(stockStatus(item, [batch("2026-10-19")])).toBe("無庫存");
  });
  it("成本依數量加權，零元成本合法，缺少資料回傳 null", () => {
    const base = {
      id: "C",
      itemId: "I",
      batchId: "B",
      order: "P",
      date: "2026-10-20",
      supplier: "S",
      batchNumber: "B001",
    };
    expect(
      batchAverage("B", [
        { ...base, quantity: 1, unitCost: 0 },
        { ...base, id: "C2", quantity: 3, unitCost: 20 },
      ]),
    ).toBe(15);
    expect(batchAverage("missing", [])).toBeNull();
  });
  it("停用、啟用期間與交易設定限制", () => {
    const state = createItemsSeed();
    const item = state.items[0];
    expect(usageStatus({ ...item, active: false })).toBe("手動停用");
    expect(
      usageStatus({ ...item, active: true, effectiveFrom: "2026-10-21" }),
    ).toBe("尚未開始");
    expect(validateItem({ ...item, unit: "新單位" }, state)).toContain(
      "不可修改單位",
    );
    expect(
      validateItem({ ...item, effectiveUntil: "2000-01-01" }, state),
    ).toContain("不可早於");
  });
});
