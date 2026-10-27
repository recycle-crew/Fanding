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
export const stocktakeRoundLabel = (round: number) =>
  round === 1 ? "初盤" : `第 ${round - 1} 次複盤`;
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

export function stocktakeReviewBlockers(order: Stocktake) {
  const blockers: string[] = [];
  const uncounted = order.scope.filter(
    (scope) => !countFor(order, scope.itemId).counted,
  ).length;
  const unconfirmed = order.scope.filter(
    (scope) => !order.confirmedItems.includes(scope.itemId),
  ).length;
  const pending = order.recounts.filter(
    (row) => row.status === "待複盤",
  ).length;
  const submitted = order.recounts.filter(
    (row) => row.status === "已提交",
  ).length;
  if (uncounted) blockers.push(`${uncounted} 項尚未完成盤點`);
  if (pending) blockers.push(`${pending} 筆複盤尚未提交`);
  if (submitted) blockers.push(`${submitted} 筆複盤尚未選擇採用輪次`);
  if (unconfirmed) blockers.push(`${unconfirmed} 項尚未確認品項結果`);
  if (!order.alignmentConfirmed)
    blockers.push("尚未確認盤點截止時間與帳面資料");
  return blockers;
}

export function sortStocktakeReviewScope(order: Stocktake) {
  function priority(scope: StocktakeScope) {
    if (order.confirmedItems.includes(scope.itemId)) return 5;
    const recounts = order.recounts.filter(
      (row) => row.itemId === scope.itemId,
    );
    if (recounts.some((row) => row.status === "已提交")) return 0;
    if (recounts.some((row) => row.status === "待複盤")) return 1;
    const difference = varianceFor(order, scope);
    if (difference === null) return 2;
    return difference !== 0 ? 3 : 4;
  }
  return [...order.scope].sort(
    (a, b) => priority(a) - priority(b) || a.code.localeCompare(b.code),
  );
}
export function countableRound(
  order: Stocktake,
  itemId: string,
  person: string,
) {
  if (order.status === "盤點中") return 1;
  if (order.status === "待核對")
    return (
      order.recounts.find(
        (row) =>
          row.itemId === itemId &&
          (!row.person || row.person === person) &&
          row.status === "待複盤",
      )?.round || null
    );
  return null;
}

export function stocktakeListContent(order: Stocktake, person: string) {
  const manager = person === supervisor;
  const pending = order.recounts.filter(
    (row) =>
      row.status === "待複盤" &&
      (manager || !row.person || row.person === person),
  ).length;
  const submitted = order.recounts.filter(
    (row) => row.status === "已提交" && (manager || row.person === person),
  ).length;
  const counted = order.scope.filter(
    (scope) =>
      countFor(order, scope.itemId, 1, manager ? undefined : person).counted,
  ).length;
  if (order.status === "已作廢")
    return {
      progress: "盤點已停止",
      detail: "原始紀錄保留",
      next: `作廢原因：${order.cancelReason || "未填寫"}`,
      action: "查看作廢紀錄",
    };
  if (order.status === "已完成")
    return {
      progress: "盤點已完成",
      detail: `完成於 ${order.completedAt || "—"}`,
      next: manager ? "查閱結果與匯出明細" : "查閱本人紀錄",
      action: manager ? "查看結果" : "我的紀錄",
    };
  if (order.status === "待核對")
    return {
      progress: manager
        ? `已核對 ${order.confirmedItems.length}／${order.scope.length} 項`
        : pending
          ? `待複盤 ${pending} 項`
          : "初盤已結束",
      detail: manager
        ? `待提交複盤 ${pending} 項；待採用 ${submitted} 項`
        : submitted
          ? `本人已提交複盤 ${submitted} 項`
          : "原始登錄紀錄保留",
      next: manager
        ? pending
          ? "等待人員提交複盤"
          : submitted
            ? "選擇採用輪次"
            : order.confirmedItems.length < order.scope.length
              ? "主管核對品項差異"
              : "主管確認盤點結果"
        : pending
          ? "完成並提交複盤"
          : "等待主管確認結果",
      action: manager ? "核對差異" : pending ? "進入複盤" : "我的紀錄",
    };
  return {
    progress: manager
      ? `已登錄 ${counted}／${order.scope.length} 項`
      : `本人已登錄 ${counted} 項`,
    detail: manager ? "待全部品項登錄後結束初盤" : "每筆紀錄保留輸入人員",
    next: manager
      ? counted < order.scope.length
        ? `尚有 ${order.scope.length - counted} 項未登錄`
        : "可結束初盤，送交核對"
      : "繼續清點盤點範圍內的品項",
    action: manager ? "查看盤點進度" : "進入盤點",
  };
}

export function sortStocktakeOrders(orders: Stocktake[]) {
  const priority = { 待核對: 0, 盤點中: 1, 已完成: 2, 已作廢: 3 };
  return [...orders].sort(
    (a, b) =>
      priority[a.status] - priority[b.status] ||
      b.date.localeCompare(a.date) ||
      b.number.localeCompare(a.number),
  );
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
    createdBy: supervisor,
    createdAt: now,
    snapshotAt: now,
    closedAt: status === "盤點中" ? "" : now,
    completedAt: status === "已完成" ? now : "",
    confirmedBy: status === "已完成" ? supervisor : "",
    remark: "前端展示；每筆登錄保留輸入人員，複盤另計輪次。",
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
  const example = make(5, "待核對", "主倉庫", [
    "item-1",
    "item-2",
    "item-3",
    "item-4",
  ]);
  example.name = "差異核對流程範例";
  example.date = taipeiToday();
  example.remark = "包含相符、盤盈、盤虧，以及待複盤與待確認的複盤結果。";
  example.scope.forEach((scope, index) =>
    add(example, scope.itemId, scope.baseline + [0, 2, -1, -2][index]),
  );
  example.recounts = [
    {
      id: "DEMO-RE1",
      itemId: "item-3",
      round: 2,
      person: "",
      reason: "重新確認存放位置及實際數量",
      status: "待複盤",
    },
    {
      id: "DEMO-RE2",
      itemId: "item-4",
      round: 2,
      person: "王小明",
      reason: "初盤與系統數量不同，再次確認",
      status: "已提交",
    },
  ];
  const submitted = example.scope.find((scope) => scope.itemId === "item-4")!;
  add(example, "item-4", submitted.baseline - 1);
  example.records[example.records.length - 1].round = 2;
  orders.push(example);
  return { orders, persona: supervisor };
}
