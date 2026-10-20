import type {
  ItemGroup,
  Item,
  InventoryBatch,
  PurchaseCost,
  ItemsState,
} from "@/types/items";

export const warehouses = ["主倉庫", "診間倉庫", "備用倉庫"];
export const categories = [
  "眼科用藥",
  "口服藥品",
  "保健食品",
  "清潔保養",
  "醫療耗材",
];
export const units = ["瓶", "盒", "包", "片", "個"];
export const suppliers = [
  "明康醫藥有限公司",
  "安晴醫療用品",
  "康健生技股份有限公司",
];
export function taipeiToday() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function relativeDate(days: number, today = taipeiToday()) {
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function expiryStatus(batch: InventoryBatch, today = taipeiToday()) {
  if (!batch.expiryDate) return "不適用";
  if (batch.expiryDate < today) return "已過期";
  return batch.expiryDate <= relativeDate(90, today) ? "即將到期" : "正常";
}
export function available(batch: InventoryBatch, today = taipeiToday()) {
  return expiryStatus(batch, today) === "已過期"
    ? 0
    : Math.max(0, batch.quantity - batch.unavailable);
}
export function usageStatus(item: Item, today = taipeiToday()) {
  if (!item.active) return "手動停用";
  if (item.effectiveFrom > today) return "尚未開始";
  if (item.effectiveUntil && item.effectiveUntil < today) return "已停止使用";
  return "使用中";
}
export function stockStatus(
  item: Item,
  batches: InventoryBatch[],
  today = taipeiToday(),
) {
  const total = batches
    .filter((b) => b.itemId === item.id)
    .reduce((sum, b) => sum + available(b, today), 0);
  return total === 0
    ? "無庫存"
    : item.safetyStock > 0 && total <= item.safetyStock
      ? "低庫存"
      : "正常";
}
export function batchAverage(batchId: string, costs: PurchaseCost[]) {
  const entries = costs.filter((c) => c.batchId === batchId);
  const quantity = entries.reduce((sum, c) => sum + c.quantity, 0);
  return quantity
    ? entries.reduce((sum, c) => sum + c.quantity * c.unitCost, 0) / quantity
    : null;
}
export function blankItem(group: ItemGroup, items: Item[]): Item {
  const prefix = group === "HIS_MEDICINE" ? "MED" : "OTC";
  let next = 1;
  while (
    items.some((i) => i.code === `${prefix}${String(next).padStart(4, "0")}`)
  )
    next++;
  return {
    id: "",
    code: `${prefix}${String(next).padStart(4, "0")}`,
    group,
    name: "",
    englishName: "",
    barcode: "",
    nhiCode: "",
    category: "",
    specification: "",
    unit: "",
    supplier: "",
    safetyStock: 0,
    trackBatch: true,
    trackExpiry: true,
    referenceCost: "",
    suggestedPrice: "",
    effectiveFrom: taipeiToday(),
    effectiveUntil: "",
    active: true,
    remark: "",
  };
}
export function validateItem(item: Item, state: ItemsState): string {
  if (
    !item.code.trim() ||
    !item.name.trim() ||
    !item.category ||
    !item.unit ||
    !item.effectiveFrom
  )
    return "請填妥料號、品名、分類、基本單位及開始使用日期。";
  if (
    state.items.some(
      (i) =>
        i.id !== item.id &&
        i.code.toLowerCase() === item.code.trim().toLowerCase(),
    )
  )
    return "品項料號已存在，請使用其他料號。";
  if (
    item.barcode.trim() &&
    state.items.some(
      (i) => i.id !== item.id && i.barcode === item.barcode.trim(),
    )
  )
    return "國際條碼已存在，請確認品項。";
  if (!Number.isFinite(item.safetyStock) || item.safetyStock < 0)
    return "安全庫存不可為負數。";
  for (const price of [item.referenceCost, item.suggestedPrice])
    if (price !== "" && (!Number.isFinite(Number(price)) || Number(price) < 0))
      return "價格必須是非負數。";
  if (item.effectiveUntil && item.effectiveUntil < item.effectiveFrom)
    return "停止使用日期不可早於開始使用日期。";
  if (item.trackExpiry && !item.trackBatch)
    return "追蹤效期時必須啟用批號管理。";
  const previous = state.items.find((i) => i.id === item.id);
  if (previous && previous.code !== item.code)
    return "既有品項的料號不可修改。";
  const locked =
    state.batches.some((b) => b.itemId === item.id) ||
    state.transactions.some((t) => t.itemId === item.id) ||
    state.costs.some((c) => c.itemId === item.id);
  if (
    previous &&
    locked &&
    (previous.unit !== item.unit ||
      previous.trackBatch !== item.trackBatch ||
      previous.trackExpiry !== item.trackExpiry)
  )
    return "已有庫存或交易，不可修改單位及追蹤設定。";
  return "";
}
export function createItemsSeed(): ItemsState {
  const state: ItemsState = {
    items: [],
    batches: [],
    costs: [],
    transactions: [],
  };
  const names = [
    "人工淚液",
    "散瞳劑",
    "抗生素眼藥水",
    "消炎眼藥水",
    "眼用凝膠",
    "口服消炎藥",
    "舒緩眼藥水",
    "葉黃素膠囊",
    "隱形眼鏡保養液",
    "維生素補充錠",
    "拋棄式清潔棉",
    "眼部熱敷袋",
    "護眼營養膠囊",
    "清潔護理液",
  ];
  names.forEach((name, index) => {
    const group: ItemGroup = index < 7 ? "HIS_MEDICINE" : "GENERAL";
    const item = blankItem(group, state.items);
    item.id = `item-${index + 1}`;
    item.name = name;
    Object.assign(item, {
      englishName:
        index === 0 ? "Artificial Tears" : `Demo product ${index + 1}`,
      barcode: `471123456${String(index).padStart(4, "0")}`,
      nhiCode: group === "HIS_MEDICINE" ? `AC12345${index}78` : "",
      category:
        index < 5
          ? categories[0]
          : index < 7
            ? categories[1]
            : categories[2 + (index % 3)],
      unit: index < 5 || index === 8 || index === 13 ? "瓶" : "盒",
      specification: index < 5 ? "0.5% 10ml" : "60 入",
      supplier: suppliers[index % 3],
      safetyStock: 20,
      referenceCost: String(100 + index * 12),
      suggestedPrice: String(180 + index * 25),
      effectiveFrom: relativeDate(-180),
      active: index !== 6 && index !== 13,
      remark: "客戶展示用虛構品項",
    });
    state.items.push(item);
    if (index === 4 || index === 11) return;
    const amounts =
      index === 0
        ? [20, 15, 10]
        : [index % 3 === 1 ? 8 : 32, 0, index % 3 === 1 ? 0 : 6];
    amounts.forEach((quantity, w) => {
      if (!quantity) return;
      const batch: InventoryBatch = {
        id: `batch-${index}-${w}`,
        itemId: item.id,
        warehouse: warehouses[w],
        batchNumber: `A${String(index + 1).padStart(2, "0")}${w + 1}`,
        expiryDate: relativeDate(
          w === 2 ? -15 : index % 3 === 2 || w === 1 ? 45 : 240,
        ),
        quantity,
        unavailable: 0,
        receivedAt: relativeDate(index === 0 && w === 0 ? -20 : -30),
      };
      state.batches.push(batch);
      const entries = index === 0 && w === 0 ? [11, 11] : [quantity + 2];
      let runningQuantity = 0;
      entries.forEach((q, c) => {
        runningQuantity += q;
        state.costs.push({
          id: `cost-${index}-${w}-${c}`,
          itemId: item.id,
          batchId: batch.id,
          order: `PO-${String(index + 1).padStart(3, "0")}-${w + 1}${c + 1}`,
          date: relativeDate(-30 + c * 10),
          supplier: item.supplier,
          batchNumber: batch.batchNumber,
          quantity: q,
          unitCost: 100 + index * 12 + c * 20,
        });
        state.transactions.push({
          id: `txn-${index}-${w}-${c}`,
          itemId: item.id,
          batchId: batch.id,
          date: relativeDate(-30 + c * 10),
          type: "PURCHASE_IN",
          reference: `PO-${String(index + 1).padStart(3, "0")}-${w + 1}${c + 1}`,
          warehouse: batch.warehouse,
          batchNumber: batch.batchNumber,
          change: q,
          after: runningQuantity,
          operator: "王小明",
          remark: "示範進貨入庫",
        });
      });
      state.transactions.push({
        id: `txn-${index}-${w}-out`,
        itemId: item.id,
        batchId: batch.id,
        date: relativeDate(-2),
        type: group === "HIS_MEDICINE" ? "HIS_CONSUMPTION_OUT" : "POS_OUT",
        reference: `DEMO-OUT-${index}-${w}`,
        warehouse: batch.warehouse,
        batchNumber: batch.batchNumber,
        change: -2,
        after: quantity,
        operator: "展示系統",
        remark: "示範庫存異動",
      });
    });
  });
  return state;
}
