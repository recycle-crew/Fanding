import { createAction } from "@reduxjs/toolkit";
import { available, taipeiToday, usageStatus } from "@/features/items/model";
import type { InventoryBatch, ItemsState } from "@/types/items";
import type { BaseDataRecord } from "@/types/base-data";
import type {
  InventoryDocument,
  InventoryDocumentCommit,
  InventoryDocumentLine,
} from "@/types/inventory-documents";

export const inventoryDocumentCommitted = createAction<InventoryDocumentCommit>(
  "inventory/documentCommitted",
);
export const disposalReasons = ["過期", "破損", "變質", "污染", "其他"];
export const documentNoun = (kind: InventoryDocument["kind"]) =>
  kind === "requisition" ? "領用" : "報廢";

export function blankDocument(
  kind: InventoryDocument["kind"],
): InventoryDocument {
  return {
    id: "",
    number: "",
    kind,
    date: taipeiToday(),
    warehouse: "",
    person: "",
    personId: "",
    purpose: "",
    status: "草稿",
    createdBy: "",
    createdAt: "",
    confirmedBy: "",
    confirmedAt: "",
    cancelledBy: "",
    cancelledAt: "",
    cancelReason: "",
    lines: [],
    audit: [],
  };
}
export function blankDocumentLine(): InventoryDocumentLine {
  return {
    id: crypto.randomUUID(),
    itemId: "",
    batchId: "",
    portion: "normal",
    quantity: 1,
    reason: "",
    explanation: "",
    code: "",
    name: "",
    specification: "",
    unit: "",
    batchNumber: "",
    expiryDate: "",
  };
}
export function snapshotDocument(
  document: InventoryDocument,
  inventory: ItemsState,
): InventoryDocument {
  return {
    ...document,
    person: document.person.trim(),
    purpose: document.purpose.trim(),
    lines: document.lines.map((line) => {
      const item = inventory.items.find((row) => row.id === line.itemId);
      const batch = inventory.batches.find((row) => row.id === line.batchId);
      return {
        ...line,
        explanation: line.explanation.trim(),
        code: item?.code || "",
        name: item?.name || "",
        specification: item?.specification || "",
        unit: item?.unit || "",
        batchNumber: batch?.batchNumber || "",
        expiryDate: batch?.expiryDate || "",
      };
    }),
  };
}

export function validateDocument(
  document: InventoryDocument,
  inventory: ItemsState,
  warehouses: BaseDataRecord[],
  today = taipeiToday(),
): string {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(document.date) ||
    !Number.isFinite(Date.parse(document.date)) ||
    new Date(document.date).toISOString().slice(0, 10) !== document.date ||
    document.date > today
  )
    return "請填寫有效作業日期，且不可晚於今天。";
  const warehouse = warehouses.find((row) => row.name === document.warehouse);
  if (!warehouse || (document.kind === "requisition" && !warehouse.active))
    return "請選擇有效倉別。";
  if (
    !document.personId ||
    !document.person.trim() ||
    (document.kind === "requisition" && !document.purpose.trim())
  )
    return "請填寫領用人／經辦人及領用部門／用途。";
  if (!document.lines.length) return "請至少加入一筆明細。";
  if (
    new Set(document.lines.map((line) => line.id)).size !==
    document.lines.length
  )
    return "明細識別重複，請重新加入。";
  const totals = new Map<string, number>();
  for (const [index, line] of document.lines.entries()) {
    const label = `第 ${index + 1} 筆`;
    if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0)
      return `${label}數量須為正整數。`;
    const item = inventory.items.find((row) => row.id === line.itemId);
    const batch = inventory.batches.find(
      (row) =>
        row.id === line.batchId &&
        row.itemId === line.itemId &&
        row.warehouse === document.warehouse,
    );
    if (!item || !batch) return `${label}請選擇此倉別的品項與批次。`;
    if (line.portion !== "normal" && line.portion !== "unavailable")
      return `${label}庫存部分無效。`;
    if (
      !Number.isSafeInteger(batch.quantity) ||
      !Number.isSafeInteger(batch.unavailable) ||
      batch.quantity < 0 ||
      batch.unavailable < 0 ||
      batch.unavailable > batch.quantity
    )
      return `${label}庫存資料不一致，請先核對。`;
    if (
      document.kind === "requisition" &&
      (item.group === "HIS_MEDICINE" ||
        usageStatus(item, today) !== "使用中" ||
        line.portion !== "normal")
    )
      return `${label}僅可領用使用中的非 HIS 品項與可用庫存。`;
    if (
      document.kind === "disposal" &&
      (!disposalReasons.includes(line.reason) ||
        (line.reason === "其他" && !line.explanation.trim()))
    )
      return `${label}請選擇報廢原因；其他原因須填寫說明。`;
    const key = `${batch.id}:${line.portion}`;
    const sum = (totals.get(key) || 0) + line.quantity;
    if (!Number.isSafeInteger(sum)) return `${label}數量超出範圍。`;
    totals.set(key, sum);
    const limit =
      document.kind === "requisition"
        ? available(batch, today)
        : line.portion === "unavailable"
          ? batch.unavailable
          : batch.quantity - batch.unavailable;
    if (sum > limit)
      return `${item.name}（${batch.batchNumber || "無批號"}）庫存不足，目前可處理 ${limit} ${item.unit}。`;
  }
  return "";
}

export function allocateRequisition(
  inventory: ItemsState,
  warehouse: string,
  itemId: string,
  quantity: number,
  existing: InventoryDocumentLine[],
  today = taipeiToday(),
): InventoryDocumentLine[] {
  if (!Number.isSafeInteger(quantity) || quantity <= 0)
    throw new Error("領用數量須為正整數。");
  const item = inventory.items.find((row) => row.id === itemId);
  if (
    !item ||
    item.group === "HIS_MEDICINE" ||
    usageStatus(item, today) !== "使用中"
  )
    throw new Error("請選擇使用中的非 HIS 品項。");
  let remaining = quantity;
  const lines: InventoryDocumentLine[] = [];
  const batches = inventory.batches
    .filter((batch) => batch.itemId === itemId && batch.warehouse === warehouse)
    .sort(
      (a, b) =>
        (a.expiryDate || "9999").localeCompare(b.expiryDate || "9999") ||
        a.receivedAt.localeCompare(b.receivedAt) ||
        a.id.localeCompare(b.id),
    );
  for (const batch of batches) {
    const allocated = existing
      .filter((line) => line.batchId === batch.id)
      .reduce((sum, line) => sum + line.quantity, 0);
    const take = Math.min(
      remaining,
      Math.max(0, available(batch, today) - allocated),
    );
    if (take)
      lines.push({
        ...blankDocumentLine(),
        itemId,
        batchId: batch.id,
        quantity: take,
      });
    remaining -= take;
    if (!remaining) break;
  }
  if (remaining)
    throw new Error(
      `${item.name}可用庫存不足，尚缺 ${remaining} ${item.unit}。`,
    );
  return lines;
}

/** Builds all mutations before dispatch; a failed plan cannot partially change stock. */
export function planDocumentMovement(
  document: InventoryDocument,
  inventory: ItemsState,
  reverse: boolean,
  operator: string,
  now: string,
): Pick<InventoryDocumentCommit, "batches" | "transactions"> {
  const changed = new Map<string, InventoryBatch>();
  const transactions: InventoryDocumentCommit["transactions"] = [];
  for (const line of document.lines) {
    const source =
      changed.get(line.batchId) ||
      inventory.batches.find(
        (batch) =>
          batch.id === line.batchId &&
          batch.itemId === line.itemId &&
          batch.warehouse === document.warehouse,
      );
    if (!source) throw new Error("原庫存批次不存在，無法扣帳或沖回。");
    const change = (reverse ? 1 : -1) * line.quantity;
    const next = {
      ...source,
      quantity: source.quantity + change,
      unavailable:
        source.unavailable + (line.portion === "unavailable" ? change : 0),
    };
    if (
      !Number.isSafeInteger(next.quantity) ||
      next.quantity < 0 ||
      next.unavailable < 0 ||
      next.unavailable > next.quantity
    )
      throw new Error("庫存已變動或超出範圍，請重新核對。");
    changed.set(next.id, next);
    transactions.push({
      id: `${document.id}:${reverse ? "reverse" : "confirm"}:${line.id}`,
      itemId: line.itemId,
      batchId: line.batchId,
      date: now,
      type: `${documentNoun(document.kind)}${reverse ? "作廢" : ""}`,
      reference: document.number,
      warehouse: document.warehouse,
      batchNumber: line.batchNumber,
      change,
      after: next.quantity,
      operator,
      remark: reverse
        ? document.cancelReason
        : document.kind === "disposal"
          ? `${line.reason}${line.explanation ? `：${line.explanation}` : ""}（${line.portion === "unavailable" ? "不可用部分" : "一般帳面部分"}）`
          : document.purpose,
    });
  }
  return { batches: [...changed.values()], transactions };
}
