import { produce, type Draft } from "immer";
type PayloadAction<T> = { payload: T };
type State = ReturnType<typeof seedConsumptions>;
import {
  seedConsumptions,
  timestamp,
  type ConsumptionMapping,
  type ConsumptionRecord,
} from "@/features/consumptions/model";
const handlers = {
  saveConsumptionMapping(
    state: Draft<State>,
    { payload }: PayloadAction<ConsumptionMapping>,
  ) {
    const index = state.mappings.findIndex((row) => row.id === payload.id);
    if (index < 0) state.mappings.push(payload);
    else state.mappings[index] = payload;
  },
  reviewConsumptionException(
    state: Draft<State>,
    { payload }: PayloadAction<string>,
  ) {
    const row = state.exceptions.find((entry) => entry.id === payload);
    if (!row || row.status === "已解決") return;
    row.status = "待人工核對";
    row.history.push(
      `${timestamp()} 王小明（展示）：標記待人工核對；未回補庫存。`,
    );
  },
  retryConsumptionException(
    state: Draft<State>,
    { payload }: PayloadAction<{ id: string; record?: ConsumptionRecord }>,
  ) {
    const row = state.exceptions.find((entry) => entry.id === payload.id);
    if (!row || row.status === "已解決") return;
    if (
      row.type === "ITEM_NOT_MAPPED" &&
      payload.record &&
      !state.records.some(
        (record) =>
          record.sourceId === row.sourceId && record.lineId === row.lineId,
      )
    ) {
      state.records.push(payload.record);
      row.status = "已解決";
      row.history.push(
        `${timestamp()} 王小明（展示）：對應與展示可用量驗證通過，重新處理成功。`,
      );
    } else {
      row.history.push(
        `${timestamp()} 王小明（展示）：重試後仍需處理原始原因，未新增耗用。`,
      );
    }
  },
  simulateConsumptionSync(
    state: Draft<State>,
    { payload }: PayloadAction<"success" | "partial" | "failure">,
  ) {
    const now = timestamp();
    let applied = 0;
    if (payload !== "failure" && !state.syncImported) {
      const source = state.records[0];
      state.records.push({
        ...source,
        id: "CON-SYNC",
        sourceId: "RX-DEMO-STABLE",
        lineId: "DEMO-STABLE-LINE",
        version: 1,
        date: now,
        synced: now,
        status: "正常",
        original: 1,
        factor: 1,
        converted: 1,
        applied: 1,
        allocations: [
          { batch: "DEMO-NEW-BATCH", quantity: 1, source: "FEFO 帳面推定" },
        ],
        history: [
          {
            time: now,
            action: "首次同步 v1",
            delta: 1,
            description: "穩定來源 ID，重複同步不再建立。",
          },
        ],
      });
      state.syncImported = true;
      applied = 1;
    }
    state.runs.unshift({
      id: `RUN${state.runs.length + 1}`,
      started: now,
      finished: now,
      status:
        payload === "success"
          ? "SUCCESS"
          : payload === "partial"
            ? "PARTIAL_SUCCESS"
            : "FAILED",
      received: payload === "failure" ? 0 : 2,
      applied,
      skipped:
        payload === "failure" ? 0 : (payload === "partial" ? 1 : 2) - applied,
      failed: payload === "success" ? 0 : 1,
      actor: "王小明（手動展示）",
    });
    if (payload === "success") state.latestSuccess = now;
    if (payload !== "success") {
      const id =
        payload === "failure" ? "EX-CONNECTION-DEMO" : "EX-PARTIAL-DEMO";
      const existing = state.exceptions.find((row) => row.id === id);
      if (existing)
        existing.history.push(`${now} 系統（展示）：再次同步仍失敗。`);
      else
        state.exceptions.unshift({
          id,
          sourceId: "RX-DEMO-FAILED",
          lineId: id,
          code: "HIS001",
          name: "展示同步異常",
          quantity: 1,
          sourceUnit: "瓶",
          type:
            payload === "failure"
              ? "HIS_CONNECTION_FAILED"
              : "INVALID_SOURCE_STATUS",
          date: now,
          status: "待處理",
          history: [`${now} 系統（展示）：未建立耗用。`],
        });
    }
  },
};
export const saveConsumptionMapping = (
  payload: Parameters<typeof handlers.saveConsumptionMapping>[1]["payload"],
) => ({ type: "saveConsumptionMapping" as const, payload });
export const reviewConsumptionException = (
  payload: Parameters<typeof handlers.reviewConsumptionException>[1]["payload"],
) => ({ type: "reviewConsumptionException" as const, payload });
export const retryConsumptionException = (
  payload: Parameters<typeof handlers.retryConsumptionException>[1]["payload"],
) => ({ type: "retryConsumptionException" as const, payload });
export const simulateConsumptionSync = (
  payload: Parameters<typeof handlers.simulateConsumptionSync>[1]["payload"],
) => ({ type: "simulateConsumptionSync" as const, payload });
type Action =
  | ReturnType<typeof saveConsumptionMapping>
  | ReturnType<typeof reviewConsumptionException>
  | ReturnType<typeof retryConsumptionException>
  | ReturnType<typeof simulateConsumptionSync>;
export default function consumptionReducer(
  state: State = seedConsumptions(),
  action: Action,
): State {
  return produce(state, (draft) => {
    switch (action.type) {
      case "saveConsumptionMapping":
        handlers.saveConsumptionMapping(draft, action);
        break;
      case "reviewConsumptionException":
        handlers.reviewConsumptionException(draft, action);
        break;
      case "retryConsumptionException":
        handlers.retryConsumptionException(draft, action);
        break;
      case "simulateConsumptionSync":
        handlers.simulateConsumptionSync(draft, action);
        break;
    }
  });
}
