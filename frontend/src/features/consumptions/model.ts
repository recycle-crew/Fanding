import type {
  ConsumptionMapping,
  ConsumptionRecord,
  ConsumptionException,
  SyncRun,
} from "@/types/consumptions";
import {
  createItemsSeed,
  relativeDate,
  taipeiToday,
} from "@/features/items/model";
export const exceptionTypes = {
  ITEM_NOT_MAPPED: "藥品未對應",
  INVALID_UNIT: "單位換算錯誤",
  WAREHOUSE_NOT_FOUND: "倉別未對應",
  INSUFFICIENT_STOCK: "庫存不足",
  BATCH_NOT_FOUND: "批次不存在",
  INVALID_SOURCE_STATUS: "HIS 狀態不明",
  SOURCE_CONFLICT: "來源資料衝突",
  HIS_CONNECTION_FAILED: "HIS 連線失敗",
  SYNC_FAILED: "同步失敗",
  RECONCILIATION_REQUIRED: "需人工核對",
} as const;

export function timestamp() {
  return new Date().toLocaleString("sv-SE", { timeZone: "Asia/Taipei" });
}
export function seedConsumptions() {
  const items = createItemsSeed().items.filter(
    (item) => item.group === "HIS_MEDICINE",
  );
  const mappings: ConsumptionMapping[] = items
    .filter((_, i) => i < 6)
    .map((item, i) => ({
      id: `MAP${i}`,
      system: "FANDING_HIS",
      code: `HIS00${i + 1}`,
      name: item.name,
      itemId: item.id,
      sourceUnit: i === 1 ? "盒" : item.unit,
      factor: i === 1 ? 10 : 1,
      active: true,
    }));
  const records: ConsumptionRecord[] = Array.from(
    { length: 12 },
    (_, index) => {
      const mapping = mappings[index % mappings.length],
        item = items.find((row) => row.id === mapping.itemId)!;
      const converted = ((index % 3) + 1) * mapping.factor,
        status = index === 3 ? "已取消" : index === 4 ? "已更正" : "正常";
      const applied =
        status === "已取消" ? 0 : converted + (status === "已更正" ? 2 : 0);
      const date = `${relativeDate(-(index % 7))} 09:${String(index + 10).padStart(2, "0")}:00`;
      return {
        id: `CON${index}`,
        sourceId: `RX-${taipeiToday().replaceAll("-", "")}-${String(index + 1).padStart(3, "0")}`,
        lineId: `LINE${index + 1}`,
        version: status === "正常" ? 1 : 2,
        code: mapping.code,
        itemId: item.id,
        itemCode: item.code,
        name: item.name,
        nhiCode: item.nhiCode,
        category: item.category,
        specification: item.specification,
        unit: item.unit,
        original: (index % 3) + 1,
        sourceUnit: mapping.sourceUnit,
        factor: mapping.factor,
        converted,
        applied,
        date,
        synced: date,
        warehouse: index % 2 ? "診間倉庫" : "主倉庫",
        status,
        allocations: [
          {
            batch: `HIS-B${index}`,
            quantity: converted,
            source: index % 2 ? "實際批號" : "FEFO 帳面推定",
          },
          ...(status === "已更正"
            ? [
                {
                  batch: `HIS-B${index}-2`,
                  quantity: 2,
                  source: "FEFO 帳面推定" as const,
                },
              ]
            : []),
        ],
        history: [
          {
            time: date,
            action: "首次同步 v1",
            delta: converted,
            description: "已交付來源；保存換算比例與品項快照。",
          },
          ...(status === "正常"
            ? []
            : [
                {
                  time: date,
                  action: status === "已取消" ? "取消 v2" : "數量增加 v2",
                  delta: status === "已取消" ? -converted : 2,
                  description:
                    status === "已取消"
                      ? "已確認未交付，建立反向紀錄；原始耗用保留。"
                      : "保留原耗用，僅新增差額扣庫紀錄。",
                },
              ]),
        ],
      };
    },
  );
  const exceptions: ConsumptionException[] = (
    Object.keys(exceptionTypes) as (keyof typeof exceptionTypes)[]
  ).map((type, i) => ({
    id: `EX${i}`,
    sourceId: `RX-ERROR-${i + 1}`,
    lineId: `ERRLINE${i}`,
    code: i === 0 ? "HIS-NEW" : `HIS00${(i % 5) + 1}`,
    name: i === 0 ? "待對應藥品" : mappings[i % 5].name,
    quantity: 2,
    sourceUnit: "瓶",
    type,
    status: "待處理",
    date: `${relativeDate(-1)} 10:00:00`,
    history: ["系統（展示）：首次同步失敗，未建立耗用。"],
  }));
  const runs: SyncRun[] = [
    {
      id: "RUN-SEED",
      started: `${relativeDate(-1)} 10:00:00`,
      finished: `${relativeDate(-1)} 10:00:03`,
      status: "PARTIAL_SUCCESS",
      received: 22,
      applied: 12,
      skipped: 0,
      failed: 10,
      actor: "排程（展示）",
    },
  ];
  return {
    mappings,
    records,
    exceptions,
    runs,
    latestSuccess: `${relativeDate(-1)} 10:00:03`,
    syncImported: false,
  };
}
