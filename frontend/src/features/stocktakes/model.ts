import type {
  StocktakeStatus,
  StocktakeScope,
  Stocktake,
} from "@/types/stocktakes";
import {
  createItemsSeed,
  relativeDate,
  taipeiToday,
} from "@/features/items/model";
import type { Item } from "@/types/items";
export const stocktakePeople = ["王小明", "李護理師"];
export const supervisor = "主管（展示）";
export const stocktakeStatuses = [
  "盤點中",
  "待核對",
  "已完成",
  "已作廢",
] as const;

export function stocktakeNow() {
  return new Date().toLocaleString("sv-SE", { timeZone: "Asia/Taipei" });
}
export const roundQty = (value: number) => Math.round(value * 1000) / 1000;
export function scopeFromItem(
  item: Item,
  warehouse: string,
  batches: ReturnType<typeof createItemsSeed>["batches"],
): StocktakeScope {
  const rows = batches.filter(
    (batch) => batch.itemId === item.id && batch.warehouse === warehouse,
  );
  return {
    itemId: item.id,
    code: item.code,
    name: item.name,
    specification: item.specification,
    unit: item.unit,
    barcode: item.barcode,
    trackBatch: item.trackBatch,
    baseline: roundQty(rows.reduce((sum, batch) => sum + batch.quantity, 0)),
    movement: 0,
    batches: rows.map((batch) => ({
      id: batch.id,
      number: batch.batchNumber,
      expiry: batch.expiryDate,
      quantity: batch.quantity,
      unavailable: batch.unavailable,
    })),
  };
}
export function countFor(
  order: Stocktake,
  itemId: string,
  round = order.selectedRounds[itemId] || 1,
  person?: string,
) {
  const records = order.records.filter(
    (record) =>
      record.itemId === itemId &&
      record.round === round &&
      record.valid &&
      (!person || record.person === person),
  );
  return {
    counted: records.length > 0,
    quantity: roundQty(
      records.reduce((sum, record) => sum + record.quantity, 0),
    ),
  };
}
export function expectedFor(scope: StocktakeScope) {
  return roundQty(scope.baseline + scope.movement);
}
export function varianceFor(order: Stocktake, scope: StocktakeScope) {
  const counted = countFor(order, scope.itemId);
  return counted.counted
    ? roundQty(counted.quantity - expectedFor(scope))
    : null;
}
export function canSeeOrder(order: Stocktake, person: string) {
  return (
    person === supervisor ||
    order.people.includes(person) ||
    order.recounts.some((entry) => entry.person === person)
  );
}
export function countableRound(
  order: Stocktake,
  itemId: string,
  person: string,
) {
  if (
    order.status === "盤點中" &&
    (order.people.includes(person) || person === supervisor) &&
    !order.finished.includes(person)
  )
    return 1;
  if (order.status === "待核對")
    return (
      order.recounts.find(
        (row) =>
          row.itemId === itemId &&
          row.person === person &&
          row.status === "待複盤",
      )?.round || null
    );
  return null;
}
export function seedStocktakes(): { orders: Stocktake[]; persona: string } {
  const inventory = createItemsSeed(),
    now = stocktakeNow();
  const make = (
    index: number,
    status: StocktakeStatus,
    warehouse: string,
    itemIds: string[],
  ): Stocktake => ({
    id: `ST${index}`,
    number: `ST${taipeiToday().replaceAll("-", "")}-${String(index).padStart(3, "0")}`,
    name: ["", "藥局分區盲盤", "診間例行盤點", "備用倉盤點", "取消測試盤點"][
      index
    ],
    date: relativeDate(index < 3 ? 0 : -3),
    warehouse,
    type: "部分盤點",
    status,
    people: [...stocktakePeople],
    finished: status === "盤點中" ? [] : [...stocktakePeople],
    createdBy: supervisor,
    createdAt: now,
    snapshotAt: now,
    closedAt: status === "盤點中" ? "" : now,
    completedAt: status === "已完成" ? now : "",
    confirmedBy: status === "已完成" ? supervisor : "",
    remark: "前端展示；分區累加，複盤另計輪次。",
    scope: itemIds.map((id) =>
      scopeFromItem(
        inventory.items.find((item) => item.id === id)!,
        warehouse,
        inventory.batches,
      ),
    ),
    records: [],
    recounts: [],
    selectedRounds: {},
    confirmedItems: [],
    batchPlans: {},
    adjustments: [],
    audit: [`${now} ${supervisor}：建立盤點，範圍快照已鎖定。`],
    cancelReason: status === "已作廢" ? "展示取消，保留紀錄" : "",
    alignmentConfirmed: status !== "盤點中",
  });
  const orders = [
    make(1, "盤點中", "主倉庫", ["item-1", "item-2", "item-3"]),
    make(2, "待核對", "診間倉庫", ["item-1"]),
    make(3, "已完成", "備用倉庫", ["item-3"]),
    make(4, "已作廢", "主倉庫", ["item-8"]),
  ];
  function add(
    order: Stocktake,
    itemId: string,
    quantity: number,
    person = "王小明",
  ) {
    order.records.push({
      id: `COUNT${order.id}-${order.records.length + 1}`,
      itemId,
      quantity,
      zero: quantity === 0,
      person,
      time: now,
      round: 1,
      area: person === "王小明" ? "藥櫃 A" : "藥櫃 B",
      valid: true,
      invalidReason: "",
      invalidatedBy: "",
      invalidatedAt: "",
    });
  }
  add(orders[0], "item-1", 10);
  add(orders[0], "item-1", 8, "李護理師");
  add(orders[0], "item-2", 8);
  add(orders[1], "item-1", 13);
  add(orders[2], "item-3", orders[2].scope[0].baseline);
  orders[2].confirmedItems = ["item-3"];
  return { orders, persona: supervisor };
}
