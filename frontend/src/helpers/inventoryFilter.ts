import type { InventoryFilter } from "@/types/demo";
// 共用篩選契約：料號、人員為不分大小寫的包含搜尋，日期採本地日曆。
// 出入庫以傳票批次為主要查詢單位；批次可輸入完整編號或日期前綴，盤點不套用此條件。
export function compileInventoryFilter(filters: InventoryFilter) {
  const dayStart = filters.date ? new Date(`${filters.date}T00:00:00`) : null;
  const dayEnd = dayStart ? new Date(dayStart) : null;
  if (dayEnd) dayEnd.setDate(dayEnd.getDate() + 1);
  const start = dayStart
    ? dayStart.getTime()
    : filters.start
      ? new Date(filters.start).getTime()
      : -Infinity;
  // datetime-local 以分鐘輸入，結束分鐘的秒數也包含在搜尋範圍。
  const end = dayEnd
    ? dayEnd.getTime() - 1
    : filters.end
      ? new Date(filters.end).getTime() + 59999
      : Infinity;
  if (Number.isNaN(start) || Number.isNaN(end) || start > end)
    throw new Error("結束時間不可早於開始時間，請確認搜尋期間。");
  return {
    voucherId: String(filters.voucherId ?? "").trim(),
    materialNumber: String(filters.materialNumber ?? "")
      .trim()
      .toLowerCase(),
    person: String(filters.person ?? "")
      .trim()
      .toLowerCase(),
    start,
    end,
  };
}
export function matchesInventoryFilter(
  record: {
    voucherId?: string;
    materialNumber: string;
    person: string;
    timestamp?: string;
  },
  filter: ReturnType<typeof compileInventoryFilter>,
) {
  if (
    filter.voucherId &&
    !String(record.voucherId ?? "").startsWith(filter.voucherId)
  )
    return false;
  if (
    filter.materialNumber &&
    !String(record.materialNumber ?? "")
      .toLowerCase()
      .includes(filter.materialNumber)
  )
    return false;
  if (
    filter.person &&
    !String(record.person ?? "")
      .toLowerCase()
      .includes(filter.person)
  )
    return false;
  if (filter.start === -Infinity && filter.end === Infinity) return true;
  const timestamp = record.timestamp
    ? new Date(record.timestamp).getTime()
    : NaN;
  return timestamp >= filter.start && timestamp <= filter.end;
}
