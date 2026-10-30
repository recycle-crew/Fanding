import { configureStore } from "@reduxjs/toolkit";
import { describe, expect, it } from "vitest";
import { store, type RootState } from "@/store";
import itemsReducer from "./items";
import documentsReducer, {
  saveInventoryDraft,
  confirmInventoryDocument,
  cancelInventoryDocument,
  deleteInventoryDraft,
  setInventoryPersona,
} from "./inventoryDocuments";
import {
  blankDocument,
  blankDocumentLine,
  allocateRequisition,
} from "@/features/inventory/documents";
import { relativeDate } from "@/features/items/model";
import type { InventoryDocument } from "@/types/inventory-documents";

function fixture() {
  const initial: RootState = structuredClone(store.getState());
  initial.stocktakes.orders = [];
  const item = initial.items.items.find(
    (row) => row.group !== "HIS_MEDICINE" && row.active,
  )!;
  item.effectiveFrom = relativeDate(-30);
  item.effectiveUntil = "";
  initial.items.batches = [
    {
      id: "test-a",
      itemId: item.id,
      warehouse: "主倉庫",
      batchNumber: "EARLY",
      expiryDate: relativeDate(10),
      quantity: 10,
      unavailable: 3,
      receivedAt: relativeDate(-10),
    },
    {
      id: "test-b",
      itemId: item.id,
      warehouse: "主倉庫",
      batchNumber: "LATER",
      expiryDate: relativeDate(30),
      quantity: 20,
      unavailable: 0,
      receivedAt: relativeDate(-5),
    },
    {
      id: "test-expired",
      itemId: item.id,
      warehouse: "主倉庫",
      batchNumber: "EXPIRED",
      expiryDate: relativeDate(-1),
      quantity: 5,
      unavailable: 0,
      receivedAt: relativeDate(-30),
    },
  ];
  const testStore = configureStore({
    reducer: (state: RootState = initial, action) => ({
      ...state,
      items: itemsReducer(state.items, action),
      inventoryDocuments: documentsReducer(state.inventoryDocuments, action),
    }),
  });
  const document: InventoryDocument = {
    ...blankDocument("requisition"),
    warehouse: "主倉庫",
    person: "王小明",
    personId: "person-001",
    purpose: "護理作業",
    lines: [
      {
        ...blankDocumentLine(),
        itemId: item.id,
        batchId: "test-a",
        quantity: 2,
      },
    ],
  };
  function save(input = document) {
    const result = testStore.dispatch(saveInventoryDraft(input));
    expect(result.error).toBe("");
    return result.id!;
  }
  return { testStore, document, save, initial, item };
}
describe("領用及報廢庫存一致性", () => {
  it("草稿不扣庫、確認同時建立單據與異動、重送不再扣帳", () => {
    const { testStore, save } = fixture();
    const id = save();
    expect(testStore.getState().items.batches[0].quantity).toBe(10);
    const before = testStore.getState().items.transactions.length;
    expect(testStore.dispatch(confirmInventoryDocument(id)).error).toBe("");
    expect(testStore.getState().items.batches[0]).toMatchObject({
      quantity: 8,
      unavailable: 3,
    });
    expect(testStore.getState().inventoryDocuments.orders[0].status).toBe(
      "已確認",
    );
    expect(testStore.getState().items.transactions).toHaveLength(before + 1);
    expect(testStore.dispatch(confirmInventoryDocument(id)).error).not.toBe("");
    expect(testStore.getState().items.batches[0].quantity).toBe(8);
  });
  it("拆成多行也不能超過可用量，失敗不寫入任何單據或異動", () => {
    const { testStore, document } = fixture();
    document.lines[0].quantity = 4;
    document.lines.push({ ...document.lines[0], id: "another" });
    const before = testStore.getState();
    expect(testStore.dispatch(saveInventoryDraft(document)).error).toContain(
      "庫存不足",
    );
    expect(testStore.getState()).toEqual(before);
  });
  it("確認前重新驗證庫存，任一行不足時整單不扣庫", () => {
    const { testStore, document, save } = fixture();
    document.lines.push({
      ...document.lines[0],
      id: "second",
      batchId: "test-b",
      quantity: 20,
    });
    const id = save();
    const otherId = save({
      ...document,
      lines: [{ ...document.lines[0], batchId: "test-b", quantity: 1 }],
    });
    expect(testStore.dispatch(confirmInventoryDocument(otherId)).error).toBe(
      "",
    );
    const before = testStore.getState().items;
    expect(testStore.dispatch(confirmInventoryDocument(id)).error).toContain(
      "庫存不足",
    );
    expect(testStore.getState().items).toEqual(before);
    expect(
      testStore
        .getState()
        .inventoryDocuments.orders.find((row) => row.id === id)?.status,
    ).toBe("草稿");
  });
  it("領用不可用過期批次，報廢可移除過期量", () => {
    const { testStore, document, save } = fixture();
    document.lines[0].batchId = "test-expired";
    expect(testStore.dispatch(saveInventoryDraft(document)).error).toContain(
      "庫存不足",
    );
    document.kind = "disposal";
    document.lines[0].reason = "過期";
    const id = save();
    expect(testStore.dispatch(confirmInventoryDocument(id)).error).toBe("");
    expect(testStore.getState().items.batches[2].quantity).toBe(3);
  });
  it("不可用部分報廢與沖回精確更新兩欄，需主管且不可重複沖回", () => {
    const { testStore, document, save } = fixture();
    document.kind = "disposal";
    document.lines[0] = {
      ...document.lines[0],
      portion: "unavailable",
      reason: "破損",
      quantity: 3,
    };
    const id = save();
    testStore.dispatch(confirmInventoryDocument(id));
    expect(testStore.getState().items.batches[0]).toMatchObject({
      quantity: 7,
      unavailable: 0,
    });
    expect(
      testStore.dispatch(cancelInventoryDocument(id, "錯誤登錄")).error,
    ).toContain("主管");
    testStore.dispatch(setInventoryPersona("主管"));
    expect(testStore.dispatch(cancelInventoryDocument(id, "")).error).toContain(
      "原因",
    );
    expect(
      testStore.dispatch(cancelInventoryDocument(id, "錯誤登錄")).error,
    ).toBe("");
    expect(testStore.getState().items.batches[0]).toMatchObject({
      quantity: 10,
      unavailable: 3,
    });
    expect(
      testStore.dispatch(cancelInventoryDocument(id, "重送")).error,
    ).not.toBe("");
    expect(testStore.getState().items.batches[0].quantity).toBe(10);
  });
  it("唯讀不可寫入；已確認不能改草稿或刪除", () => {
    const { testStore, document, save } = fixture();
    testStore.dispatch(setInventoryPersona("唯讀"));
    expect(testStore.dispatch(saveInventoryDraft(document)).error).toContain(
      "唯讀",
    );
    testStore.dispatch(setInventoryPersona("作業人員"));
    const id = save();
    testStore.dispatch(setInventoryPersona("唯讀"));
    expect(testStore.dispatch(confirmInventoryDocument(id)).error).toContain(
      "唯讀",
    );
    expect(testStore.dispatch(deleteInventoryDraft(id)).error).toContain(
      "唯讀",
    );
    testStore.dispatch(setInventoryPersona("作業人員"));
    testStore.dispatch(confirmInventoryDocument(id));
    expect(testStore.dispatch(deleteInventoryDraft(id)).error).not.toBe("");
    expect(
      testStore.dispatch(saveInventoryDraft({ ...document, id })).error,
    ).toContain("鎖定");
  });
  it("盤點中及待核對倉別阻擋確認與作廢，但允許存草稿", () => {
    const { initial, document } = fixture();
    const pending = store
      .getState()
      .stocktakes.orders.find((row) =>
        ["盤點中", "待核對"].includes(row.status),
      )!;
    expect(pending).toBeDefined();
    const state: RootState = {
      ...initial,
      stocktakes: {
        ...initial.stocktakes,
        orders: [{ ...pending, warehouse: "主倉庫" }],
      },
    };
    const local = configureStore({
      reducer: (current = state, action) => ({
        ...current,
        items: itemsReducer(current.items, action),
        inventoryDocuments: documentsReducer(
          current.inventoryDocuments,
          action,
        ),
      }),
    });
    const id = local.dispatch(saveInventoryDraft(document)).id!;
    expect(id).toBeTruthy();
    expect(local.dispatch(confirmInventoryDocument(id)).error).toContain(
      "盤點",
    );
    expect(local.getState().items.batches[0].quantity).toBe(10);
  });
  it("FEFO 排除過期、扣除草稿既有分配並可跨批次", () => {
    const { initial, item, document } = fixture();
    const lines = allocateRequisition(
      initial.items,
      "主倉庫",
      item.id,
      8,
      document.lines,
    );
    expect(lines.map((line) => [line.batchId, line.quantity])).toEqual([
      ["test-a", 5],
      ["test-b", 3],
    ]);
    expect(() =>
      allocateRequisition(initial.items, "主倉庫", item.id, 100, []),
    ).toThrow("不足");
  });
  it("其他報廢原因必填、數量小數和日期無效會被阻擋", () => {
    const { testStore, document } = fixture();
    document.kind = "disposal";
    document.lines[0].reason = "其他";
    expect(testStore.dispatch(saveInventoryDraft(document)).error).toContain(
      "原因",
    );
    document.lines[0].explanation = "損壞";
    document.lines[0].quantity = 0.5;
    expect(testStore.dispatch(saveInventoryDraft(document)).error).toContain(
      "正整數",
    );
    document.lines[0].quantity = 1;
    document.date = "2026-02-30";
    expect(testStore.dispatch(saveInventoryDraft(document)).error).toContain(
      "日期",
    );
  });
  it("已確認保留品項快照，草稿刪除不扣庫且單號不重用", () => {
    const { testStore, document, save } = fixture();
    const id = save();
    const number = testStore.getState().inventoryDocuments.orders[0].number;
    expect(testStore.dispatch(deleteInventoryDraft(id)).error).toBe("");
    const next = save();
    expect(testStore.getState().inventoryDocuments.orders[0].number).not.toBe(
      number,
    );
    testStore.dispatch(confirmInventoryDocument(next));
    const snapshot = testStore.getState().inventoryDocuments.orders[0].lines[0];
    testStore.dispatch({
      type: "items/saveItem",
      payload: {
        ...testStore
          .getState()
          .items.items.find((item) => item.id === document.lines[0].itemId)!,
        name: "改名",
      },
    });
    expect(testStore.getState().inventoryDocuments.orders[0].lines[0]).toEqual(
      snapshot,
    );
  });
});
