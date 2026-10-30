import type { PurchaseLine, Purchase, PurchasesState } from "@/types/purchases";
import {
  createItemsSeed,
  relativeDate,
  suppliers,
  taipeiToday,
  warehouses,
} from "@/features/items/model";
import type { Item } from "@/types/items";

export function recentMonthRange(today = taipeiToday()) {
  const [year, month, day] = today.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();
  return {
    start: new Date(Date.UTC(year, month - 2, Math.min(day, lastDay)))
      .toISOString()
      .slice(0, 10),
    end: today,
  };
}

export const operationLabels = {
  reversal: "進貨沖銷",
  return: "進貨退貨",
  correction: "核對後更正",
};
export function reversalStatus(order: Purchase) {
  const reversals = order.records.filter((r) => r.kind === "reversal");
  if (!reversals.length) return "無";
  return order.lines.length > 0 &&
    order.lines.every(
      (line) =>
        -reversals
          .flatMap((r) => r.lines)
          .filter((l) => l.lineId === line.id)
          .reduce((sum, l) => sum + l.quantityChange, 0) >= line.quantity,
    )
    ? "全部沖銷"
    : "部分沖銷";
}
export const pendingAccounting = (order: Purchase) =>
  order.records.filter((r) => r.accountingStatus === "待處理");

export function reconciliationAmounts(order: Purchase) {
  const original = originalAmount(order);
  const reversal = rounded(
    order.records
      .filter((r) => r.kind === "reversal")
      .reduce((sum, r) => sum + r.amount, 0),
  );
  const returns = rounded(
    order.records
      .filter((r) => r.kind === "return")
      .reduce((sum, r) => sum + r.amount, 0),
  );
  return {
    original,
    reversal,
    returns,
    reference: rounded(original - reversal - returns),
  };
}
export const currency = (value: number) =>
  `NT$ ${value.toLocaleString("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const rounded = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;
export const originalAmount = (order: Purchase) =>
  rounded(
    order.lines.reduce((s, l) => s + rounded(l.quantity * l.unitCost), 0),
  );
export function lineBalance(order: Purchase, line: PurchaseLine) {
  const records = order.records
    .flatMap((r) => r.lines)
    .filter((l) => l.lineId === line.id);
  const change = records.reduce((s, l) => s + l.quantityChange, 0);
  const processed = records.reduce(
    (s, l) => s + Math.max(0, -l.quantityChange),
    0,
  );
  const remaining = Math.max(0, line.quantity + change);
  return {
    processed,
    remaining,
    traceable: Math.max(
      0,
      Math.min(remaining, line.traceableQuantity + change),
    ),
  };
}
export function returnStatus(order: Purchase) {
  const returned = order.records
    .filter((r) => r.kind === "return")
    .flatMap((r) => r.lines)
    .reduce((s, l) => s - l.quantityChange, 0);
  if (!returned) return "無";
  return order.lines.every((l) => lineBalance(order, l).remaining === 0)
    ? "全部退貨"
    : "部分退貨";
}
export function correctionStatus(order: Purchase) {
  const records = order.records.filter((r) => r.kind === "correction");
  return !records.length
    ? "無"
    : records.some((r) => r.accountingStatus === "待處理")
      ? "更正處理中"
      : "已更正";
}
export function snapshot(item: Item, id: string): PurchaseLine {
  return {
    id,
    itemId: item.id,
    code: item.code,
    name: item.name,
    specification: item.specification,
    unit: item.unit,
    batch: "",
    expiry: "",
    quantity: 1,
    unitCost: item.referenceCost === "" ? 0 : Number(item.referenceCost),
    remark: "",
    trackBatch: item.trackBatch,
    trackExpiry: item.trackExpiry,
    traceableQuantity: 1,
  };
}
export function createPurchasesSeed(): PurchasesState {
  const items = createItemsSeed().items;
  const orders: Purchase[] = Array.from({ length: 9 }, (_, index) => {
    const date = relativeDate(-index);
    const lines = [0, 1, 2].slice(0, (index % 3) + 1).map((n) => {
      const item = items[(index + n) % 6];
      return {
        ...snapshot(item, `pol-${index}-${n}`),
        batch: `B${String(index + 1).padStart(3, "0")}${n}`,
        expiry: relativeDate(240 + n * 30),
        quantity: 20 + n * 5,
        traceableQuantity: index === 7 ? 2 : 20 + n * 5,
        unitCost: 100 + n * 20,
      };
    });
    const order: Purchase = {
      id: `po-${index + 1}`,
      number: `PO${date.replaceAll("-", "")}${String(9 - index).padStart(3, "0")}`,
      date,
      supplierShippingDate: relativeDate(-index - 1),
      invoice: index % 3 !== 0 ? `AB${String(12345670 + index)}` : "",
      invoiceDate: date,
      tax: index % 3 !== 0 ? "應稅" : "免稅",
      supplier: suppliers[index % suppliers.length],
      warehouse: warehouses[index % warehouses.length],
      remark: ["例行補貨", "診間備品補充", "藥品及耗材到貨"][index % 3],
      createdBy: "王小明",
      createdAt: `${date}T09:30:00+08:00`,
      lines,
      settlement: null,
      records: [],
      relatedReturn: "",
    };
    if (index % 3 !== 0)
      order.settlement = {
        number: `PS-${index + 1}`,
        amount: originalAmount(order),
        accountingDate: date,
        differenceReason: "",
        remark: "發票已核對，尚未確認付款",
        operator: "陳會計",
        createdAt: `${date}T15:00:00+08:00`,
      };
    if ([1, 4, 5].includes(index))
      order.records.push({
        id: `return-${index}`,
        number: `PR-${index + 1}`,
        kind: "return",
        date,
        reason: "商品包裝破損",
        resolution: "折讓",
        accountingStatus: index === 4 ? "已完成" : "待處理",
        amount:
          index === 5
            ? lines.reduce((s, l) => s + l.quantity * l.unitCost, 0)
            : 5 * lines[0].unitCost,
        resolutionAmount: index === 4 ? "450" : "",
        reference: index === 4 ? "CN-DEMO-001" : "",
        remark: "展示退貨紀錄",
        operator: "王小明",
        createdAt: `${date}T16:00:00+08:00`,
        lines: (index === 5 ? lines : [lines[0]]).map((l) => ({
          lineId: l.id,
          quantityChange: -(index === 5 ? l.quantity : 5),
          amount: -(index === 5 ? l.quantity : 5) * l.unitCost,
        })),
      });
    if ([2, 4].includes(index))
      order.records.push({
        id: `correction-${index}`,
        number: `PC-${index + 1}`,
        kind: "correction",
        correctionType: "發票金額更正",
        date,
        reason: "發票核對金額差異",
        resolution: "折讓",
        accountingStatus: index === 2 ? "待處理" : "已完成",
        amount: -100,
        resolutionAmount: index === 4 ? "100" : "",
        reference: index === 4 ? "ADJ-DEMO-001" : "",
        remark: "僅更正帳務，不變更數量",
        operator: "陳會計",
        createdAt: `${date}T16:30:00+08:00`,
        lines: [],
      });
    return order;
  });
  return { orders, exchanges: [] };
}
export function nextNumber(prefix: string, count: number) {
  return `${prefix}${taipeiToday().replaceAll("-", "")}${String(count + 1).padStart(3, "0")}`;
}
