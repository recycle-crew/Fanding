import { describe, expect, it } from "vitest";
import { seedConsumptions } from "./model";
import reducer, {
  retryConsumptionException,
  reviewConsumptionException,
  saveConsumptionMapping,
  simulateConsumptionSync,
} from "./reducer";

const initial = seedConsumptions;
describe("耗用同步與異常處理", () => {
  it("同一批來源重複同步只新增一筆耗用，每次保留同步紀錄", () => {
    const before = initial();
    const first = reducer(before, simulateConsumptionSync("success"));
    const second = reducer(first, simulateConsumptionSync("success"));
    expect(second.records).toHaveLength(before.records.length + 1);
    expect(
      second.records.filter((row) => row.sourceId === "RX-DEMO-STABLE"),
    ).toHaveLength(1);
    expect(second.runs).toHaveLength(before.runs.length + 2);
    expect(second.runs[0]).toMatchObject({
      applied: 0,
      skipped: 2,
      status: "SUCCESS",
    });
    expect(first.runs[0].applied).toBe(1);
    expect(before.syncImported).toBe(false);
  });
  it("連線失敗不建立耗用、不更新最後成功時間；重試不複製異常", () => {
    const before = initial();
    const failed = reducer(before, simulateConsumptionSync("failure"));
    const retried = reducer(failed, simulateConsumptionSync("failure"));
    expect(retried.records).toEqual(before.records);
    expect(retried.latestSuccess).toBe(before.latestSuccess);
    expect(retried.runs[0]).toMatchObject({
      applied: 0,
      received: 0,
      failed: 1,
      status: "FAILED",
    });
    expect(
      retried.exceptions.filter((row) => row.id === "EX-CONNECTION-DEMO"),
    ).toHaveLength(1);
    expect(retried.exceptions[0].history).toHaveLength(2);
  });
  it("部分成功保留成功耗用與失敗原因", () => {
    const after = reducer(initial(), simulateConsumptionSync("partial"));
    expect(after.runs[0]).toMatchObject({
      status: "PARTIAL_SUCCESS",
      applied: 1,
      failed: 1,
    });
    expect(after.exceptions[0]).toMatchObject({
      type: "INVALID_SOURCE_STATUS",
      status: "待處理",
    });
  });
  it("補對照後重試只入帳一次，已解決異常保持不變", () => {
    const before = initial();
    const exception = before.exceptions.find(
      (row) => row.type === "ITEM_NOT_MAPPED",
    )!;
    const record = {
      ...before.records[0],
      id: "RETRY",
      sourceId: exception.sourceId,
      lineId: exception.lineId,
    };
    const action = retryConsumptionException({ id: exception.id, record });
    const resolved = reducer(before, action);
    expect(resolved.records).toHaveLength(before.records.length + 1);
    expect(
      resolved.exceptions.find((row) => row.id === exception.id)?.status,
    ).toBe("已解決");
    expect(reducer(resolved, action)).toEqual(resolved);
    expect(reducer(resolved, reviewConsumptionException(exception.id))).toEqual(
      resolved,
    );
  });
  it("人工核對與缺少有效重試資料皆不建立耗用", () => {
    const before = initial();
    const id = before.exceptions[0].id;
    const review = reducer(before, reviewConsumptionException(id));
    const after = reducer(review, retryConsumptionException({ id }));
    expect(after.records).toEqual(before.records);
    expect(after.exceptions[0].status).toBe("待人工核對");
    expect(after.exceptions[0].history.at(-1)).toContain("未新增耗用");
  });
  it("修改對照不回寫既有耗用的換算比例快照", () => {
    const before = initial();
    const mapping = before.mappings[0];
    const after = reducer(
      before,
      saveConsumptionMapping({ ...mapping, factor: 99 }),
    );
    expect(after.mappings[0].factor).toBe(99);
    expect(after.records).toEqual(before.records);
    expect(after.mappings).toHaveLength(before.mappings.length);
  });
});
