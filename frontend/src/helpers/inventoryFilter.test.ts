import { describe, expect, it } from "vitest";
import {
  compileInventoryFilter,
  matchesInventoryFilter,
} from "./inventoryFilter";
const empty = { materialNumber: "", person: "" };
describe("庫存查詢條件", () => {
  it("批號前綴、料號與人員條件取交集，文字忽略大小寫及頭尾空白", () => {
    const filter = compileInventoryFilter({
      ...empty,
      voucherId: " 202610 ",
      materialNumber: " med ",
      person: " Alice ",
    });
    const row = {
      voucherId: "20261020001",
      materialNumber: "MED001",
      person: "ALICE CHEN",
    };
    expect(matchesInventoryFilter(row, filter)).toBe(true);
    expect(
      matchesInventoryFilter({ ...row, voucherId: "20260920001" }, filter),
    ).toBe(false);
    expect(matchesInventoryFilter({ ...row, person: "Bob" }, filter)).toBe(
      false,
    );
  });
  it("結束分鐘包含秒數；超出一毫秒即排除", () => {
    const filter = compileInventoryFilter({
      ...empty,
      start: "2026-10-20T09:00",
      end: "2026-10-20T09:01",
    });
    const row = { materialNumber: "M", person: "A" };
    expect(
      matchesInventoryFilter(
        { ...row, timestamp: "2026-10-20T09:01:59.999" },
        filter,
      ),
    ).toBe(true);
    expect(
      matchesInventoryFilter(
        { ...row, timestamp: "2026-10-20T09:02:00" },
        filter,
      ),
    ).toBe(false);
  });
  it("沒有時間條件時接受沒有時間戳的資料，有條件則排除", () => {
    const row = { materialNumber: "M", person: "A" };
    expect(matchesInventoryFilter(row, compileInventoryFilter(empty))).toBe(
      true,
    );
    expect(
      matchesInventoryFilter(
        row,
        compileInventoryFilter({ ...empty, date: "2026-10-20" }),
      ),
    ).toBe(false);
  });
  it.each([
    { start: "invalid", end: "" },
    { start: "2026-10-20T10:00", end: "2026-10-20T09:00" },
  ])("無效或反向期間會拒絕執行查詢：%j", (range) => {
    expect(() => compileInventoryFilter({ ...empty, ...range })).toThrow(
      "結束時間不可早於",
    );
  });
});
