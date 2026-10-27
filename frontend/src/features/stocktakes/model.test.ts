import { configureStore, type UnknownAction } from "@reduxjs/toolkit";
import { describe, expect, it } from "vitest";
import { store as rootStore, type RootState } from "@/store";
import reducer, {
  addCount,
  approveCounting,
  chooseCountRound,
  closeCounting,
  confirmCountItem,
  createStocktake,
  invalidateCount,
  requestRecount,
  setStocktakePersona,
  submitRecount,
} from "@/store/stocktakes";
import {
  countFor,
  supervisor,
  seedStocktakes,
  stocktakeListContent,
  sortStocktakeOrders,
  stocktakeReviewBlockers,
  sortStocktakeReviewScope,
} from "./model";
function freshStore() {
  const initial: RootState = rootStore.getState();
  return configureStore({
    reducer: (
      state: RootState = initial,
      action: UnknownAction,
    ): RootState => ({
      ...state,
      stocktakes: reducer(state.stocktakes, action),
    }),
  });
}
describe("盤點展示：盲盤、快照、關閉與複盤", () => {
  it("主管才可建立，範圍必填，同倉同商品有效單衝突被阻擋", () => {
    const store = freshStore(),
      base = {
        name: "新盤點",
        date: "2026-10-20",
        warehouse: "主倉庫",
        type: "部分盤點" as const,
        itemIds: ["item-1"],
        remark: "A 區",
      };
    expect(store.dispatch(createStocktake(base)).error).toContain("已有盤點");
    expect(
      store.dispatch(createStocktake({ ...base, itemIds: [] })).error,
    ).not.toBe("");
    expect(
      store.dispatch(createStocktake({ ...base, itemIds: ["item-5"] })).error,
    ).toContain("沒有庫存紀錄");
    store.dispatch(setStocktakePersona("王小明"));
    expect(
      store.dispatch(createStocktake({ ...base, itemIds: ["item-8"] })).error,
    ).toContain("主管");
    store.dispatch(setStocktakePersona(supervisor));
    const result = store.dispatch(
      createStocktake({ ...base, itemIds: ["item-8"] }),
    );
    expect(result.error).toBe("");
    const order = store.getState().stocktakes.orders[0];
    expect(order.scope[0].baseline).toBe(8);
    store.dispatch(setStocktakePersona("李護理師"));
    expect(
      store.dispatch(
        addCount({
          id: order.id,
          recordId: "OTHER",
          itemId: "item-8",
          quantity: 1,
          zero: false,
          area: "",
        }),
      ).error,
    ).toBe("");
    expect(store.getState().stocktakes.orders[0].records[0].person).toBe(
      "李護理師",
    );
  });
  it("每筆輸入累加，無效紀錄保留；零值需明確且不覆蓋正數，範圍外不能輸入", () => {
    const store = freshStore();
    store.dispatch(setStocktakePersona("王小明"));
    const input = {
      id: "ST1",
      recordId: "N1",
      itemId: "item-3",
      quantity: 3,
      zero: false,
      area: "A",
    };
    expect(store.dispatch(addCount({ ...input, quantity: 0 })).error).not.toBe(
      "",
    );
    expect(store.dispatch(addCount(input)).error).toBe("");
    expect(
      store.dispatch(addCount({ ...input, recordId: "N2", quantity: 2 })).error,
    ).toBe("");
    expect(
      countFor(store.getState().stocktakes.orders[0], "item-3").quantity,
    ).toBe(5);
    expect(
      store.dispatch(
        addCount({ ...input, recordId: "Z", quantity: 0, zero: true }),
      ).error,
    ).toContain("正數");
    expect(
      store.dispatch(addCount({ ...input, itemId: "item-8" })).error,
    ).not.toBe("");
    store.dispatch(setStocktakePersona(supervisor));
    expect(
      store.dispatch(
        invalidateCount({ id: "ST1", recordId: "N1", reason: "輸入錯誤" }),
      ).error,
    ).toBe("");
    const order = store.getState().stocktakes.orders[0];
    expect(order.records.find((row) => row.id === "N1")?.quantity).toBe(3);
    expect(order.records.find((row) => row.id === "N1")?.invalidReason).toBe(
      "輸入錯誤",
    );
    expect(countFor(order, "item-3").quantity).toBe(2);
  });
  it("未盤點不能當零，確認基準時間後才關閉", () => {
    const store = freshStore(),
      close = {
        id: "ST1",
        partition: true,
        time: true,
        his: true,
      };
    expect(store.dispatch(closeCounting(close)).error).toContain("未盤點");
    expect(
      store.dispatch(
        addCount({
          id: "ST1",
          recordId: "ZERO",
          itemId: "item-3",
          quantity: 0,
          zero: true,
          area: "現場零值確認",
        }),
      ).error,
    ).toBe("");
    expect(
      store.dispatch(closeCounting({ ...close, time: false })).error,
    ).toContain("基準時間");
    expect(store.dispatch(closeCounting(close)).error).toBe("");
    expect(store.getState().stocktakes.orders[0].status).toBe("待核對");
    expect(
      store.dispatch(
        addCount({
          id: "ST1",
          recordId: "AFTER",
          itemId: "item-3",
          quantity: 1,
          zero: false,
          area: "",
        }),
      ).error,
    ).not.toBe("");
  });
  it("複盤另計輪次、提交與採用前不得入帳，批次差異需明確核對", () => {
    const store = freshStore();
    expect(
      store.dispatch(
        requestRecount({
          id: "ST2",
          itemId: "item-1",
          reason: "差異複查",
        }),
      ).error,
    ).toBe("");
    store.dispatch(setStocktakePersona("王小明"));
    expect(
      store.dispatch(
        addCount({
          id: "ST2",
          recordId: "ROUND2",
          itemId: "item-1",
          quantity: 14,
          zero: false,
          area: "獨立複盤",
        }),
      ).error,
    ).toBe("");
    const recount = store.getState().stocktakes.orders[1].recounts[0];
    expect(recount.person).toBe("王小明");
    expect(
      store.dispatch(submitRecount({ id: "ST2", recountId: recount.id })).error,
    ).toBe("");
    store.dispatch(setStocktakePersona(supervisor));
    expect(
      store.dispatch(approveCounting({ id: "ST2", confirmed: true })).error,
    ).not.toBe("");
    expect(
      store.dispatch(
        chooseCountRound({
          id: "ST2",
          itemId: "item-1",
          round: 2,
          reason: "複盤較可靠",
        }),
      ).error,
    ).toBe("");
    let order = store.getState().stocktakes.orders[1];
    expect(countFor(order, "item-1").quantity).toBe(14);
    expect(countFor(order, "item-1", 1).quantity).toBe(13);
    const batch = order.scope[0].batches[0];
    expect(
      store.dispatch(
        confirmCountItem({
          id: "ST2",
          itemId: "item-1",
          checked: true,
          plans: [],
        }),
      ).error,
    ).not.toBe("");
    expect(
      store.dispatch(
        confirmCountItem({
          id: "ST2",
          itemId: "item-1",
          checked: true,
          plans: [{ batchId: batch.id, quantity: -1 }],
        }),
      ).error,
    ).toBe("");
    expect(
      store.dispatch(approveCounting({ id: "ST2", confirmed: true })).error,
    ).toBe("");
    order = store.getState().stocktakes.orders[1];
    expect(order.status).toBe("已完成");
    expect(order.adjustments[0].quantity).toBe(-1);
    expect(order.adjustments[0].batches[0].batchId).toBe(batch.id);
    expect(
      store.dispatch(
        invalidateCount({
          id: "ST2",
          recordId: "ROUND2",
          reason: "修改完成單",
        }),
      ).error,
    ).toContain("唯讀");
    expect(store.getState().items.batches).toEqual(
      rootStore.getState().items.batches,
    );
  });
});

describe("盤點主列表待辦內容", () => {
  it("核對優先處理未盤與差異，確認完成前列出缺漏且不改動原範圍", () => {
    const order = seedStocktakes().orders[0];
    const original = order.scope.map((scope) => scope.itemId);
    order.confirmedItems = ["item-1"];
    expect(
      sortStocktakeReviewScope(order).map((scope) => scope.itemId),
    ).toEqual(["item-3", "item-2", "item-1"]);
    expect(order.scope.map((scope) => scope.itemId)).toEqual(original);
    expect(stocktakeReviewBlockers(order)).toContain("1 項尚未完成盤點");
    const ready = seedStocktakes().orders[2];
    expect(stocktakeReviewBlockers(ready)).toEqual([]);
  });
  it("主管按階段看到初盤與核對進度，完成與作廢單僅提供查閱", () => {
    const { orders } = seedStocktakes();
    expect(stocktakeListContent(orders[0], supervisor).progress).toBe(
      "已登錄 2／3 項",
    );
    expect(stocktakeListContent(orders[0], supervisor).next).toBe(
      "尚有 1 項未登錄",
    );
    expect(stocktakeListContent(orders[1], supervisor).progress).toBe(
      "已核對 0／1 項",
    );
    expect(stocktakeListContent(orders[2], supervisor).action).toBe("查看結果");
    expect(stocktakeListContent(orders[3], supervisor).action).toBe(
      "查看作廢紀錄",
    );
    expect(sortStocktakeOrders(orders).map((order) => order.id)).toEqual([
      "ST5",
      "ST2",
      "ST1",
      "ST3",
      "ST4",
    ]);
    expect(orders[0].id).toBe("ST1");
  });
  it("員工僅看本人待辦，複盤提交後改為等待主管", () => {
    const order = seedStocktakes().orders[1];
    order.recounts.push({
      id: "RE1",
      itemId: "item-1",
      round: 2,
      person: "",
      reason: "確認數量",
      status: "待複盤",
    });
    expect(stocktakeListContent(order, "王小明").action).toBe("進入複盤");
    expect(stocktakeListContent(order, "李護理師").next).toBe("完成並提交複盤");
    order.recounts[0].person = "王小明";
    order.recounts[0].status = "已提交";
    expect(stocktakeListContent(order, "王小明").detail).toBe(
      "本人已提交複盤 1 項",
    );
    expect(stocktakeListContent(order, supervisor).next).toBe("選擇採用輪次");
    order.recounts[0].status = "已採用";
    order.confirmedItems = ["item-1"];
    expect(stocktakeListContent(order, supervisor).next).toBe(
      "主管確認盤點結果",
    );
  });
});
