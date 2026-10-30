import {
  createSlice,
  type PayloadAction,
  type ThunkAction,
  type UnknownAction,
} from "@reduxjs/toolkit";
import type { RootState } from "@/store";
import type {
  InventoryDocument,
  InventoryPersona,
} from "@/types/inventory-documents";
import {
  inventoryDocumentCommitted,
  planDocumentMovement,
  snapshotDocument,
  validateDocument,
} from "@/features/inventory/documents";
import { taipeiToday } from "@/features/items/model";

type Result = { error: string; id?: string };
type DocumentThunk = ThunkAction<Result, RootState, unknown, UnknownAction>;
const slice = createSlice({
  name: "inventoryDocuments",
  initialState: {
    orders: [] as InventoryDocument[],
    persona: "作業人員" as InventoryPersona,
    sequence: 0,
  },
  reducers: {
    setInventoryPersona(state, { payload }: PayloadAction<InventoryPersona>) {
      state.persona = payload;
    },
    draftSaved(state, { payload }: PayloadAction<InventoryDocument>) {
      const index = state.orders.findIndex((order) => order.id === payload.id);
      if (index < 0) {
        state.orders.push(payload);
        state.sequence++;
      } else state.orders[index] = payload;
    },
    draftDeleted(state, { payload }: PayloadAction<string>) {
      state.orders = state.orders.filter((order) => order.id !== payload);
    },
  },
  extraReducers: (builder) =>
    builder.addCase(inventoryDocumentCommitted, (state, { payload }) => {
      const index = state.orders.findIndex(
        (order) => order.id === payload.document.id,
      );
      if (index >= 0) state.orders[index] = payload.document;
    }),
});
export const { setInventoryPersona } = slice.actions;
export default slice.reducer;
function actor(state: RootState) {
  return state.workspace.currentAccount || "展示使用者";
}
function checkWriter(state: RootState, order?: InventoryDocument) {
  if (state.inventoryDocuments.persona === "唯讀")
    return "唯讀身分不可修改單據。";
  if (
    order &&
    order.createdBy !== actor(state) &&
    state.inventoryDocuments.persona !== "主管"
  )
    return "只能修改自己建立的草稿。";
  return "";
}
function stocktakeConflict(state: RootState, order: InventoryDocument) {
  return state.stocktakes.orders.some(
    (row) =>
      ["盤點中", "待核對"].includes(row.status) &&
      row.warehouse === order.warehouse,
  );
}
export const saveInventoryDraft =
  (input: InventoryDocument): DocumentThunk =>
  (dispatch, getState) => {
    const state = getState();
    const previous = state.inventoryDocuments.orders.find(
      (order) => order.id === input.id,
    );
    const error = checkWriter(state, previous);
    if (error) return { error };
    if (input.id && !previous) return { error: "草稿不存在。" };
    if (
      previous &&
      (previous.status !== "草稿" || previous.kind !== input.kind)
    )
      return { error: "此單據已鎖定，無法編輯。" };
    const validation = validateDocument(
      input,
      state.items,
      state.baseData.warehouses,
    );
    if (validation) return { error: validation };
    const now = new Date().toISOString();
    const document = snapshotDocument(input, state.items);
    const sequence = state.inventoryDocuments.sequence + 1;
    const saved: InventoryDocument = {
      ...document,
      id: previous?.id || crypto.randomUUID(),
      number:
        previous?.number ||
        `${input.kind === "requisition" ? "REQ" : "DSP"}-${taipeiToday().replaceAll("-", "")}-${String(sequence).padStart(4, "0")}`,
      status: "草稿",
      createdBy: previous?.createdBy || actor(state),
      createdAt: previous?.createdAt || now,
      confirmedBy: "",
      confirmedAt: "",
      cancelledBy: "",
      cancelledAt: "",
      cancelReason: "",
      audit: [
        ...(previous?.audit || []),
        `${now} ${actor(state)}：${previous ? "儲存" : "建立"}草稿，尚未扣庫。`,
      ],
    };
    dispatch(slice.actions.draftSaved(saved));
    return { error: "", id: saved.id };
  };
export const deleteInventoryDraft =
  (id: string): DocumentThunk =>
  (dispatch, getState) => {
    const state = getState(),
      order = state.inventoryDocuments.orders.find((row) => row.id === id);
    if (!order || order.status !== "草稿") return { error: "僅可刪除草稿。" };
    const error = checkWriter(state, order);
    if (error) return { error };
    dispatch(slice.actions.draftDeleted(id));
    return { error: "" };
  };
export const confirmInventoryDocument =
  (id: string): DocumentThunk =>
  (dispatch, getState) => {
    const state = getState(),
      order = state.inventoryDocuments.orders.find((row) => row.id === id);
    if (!order || order.status !== "草稿")
      return { error: "單據已確認或已鎖定，請勿重複扣帳。" };
    const error = checkWriter(state, order);
    if (error) return { error };
    if (stocktakeConflict(state, order))
      return {
        error: "此倉別有盤點中或待核對單據，請先完成或作廢盤點，再確認出庫。",
      };
    const validation = validateDocument(
      order,
      state.items,
      state.baseData.warehouses,
    );
    if (validation) return { error: validation };
    const now = new Date().toISOString();
    // Refresh the draft snapshot once at confirmation, then keep it immutable.
    const confirmed: InventoryDocument = {
      ...snapshotDocument(order, state.items),
      status: "已確認",
      confirmedAt: now,
      confirmedBy: actor(state),
      audit: [
        ...order.audit,
        `${now} ${actor(state)}：確認出庫，已更新品項庫存。`,
      ],
    };
    try {
      dispatch(
        inventoryDocumentCommitted({
          document: confirmed,
          ...planDocumentMovement(
            confirmed,
            state.items,
            false,
            actor(state),
            now,
          ),
        }),
      );
    } catch (error) {
      return { error: error instanceof Error ? error.message : "扣帳失敗。" };
    }
    return { error: "", id };
  };
export const cancelInventoryDocument =
  (id: string, reason: string): DocumentThunk =>
  (dispatch, getState) => {
    const state = getState(),
      order = state.inventoryDocuments.orders.find((row) => row.id === id);
    if (state.inventoryDocuments.persona !== "主管")
      return { error: "作廢需主管身分。" };
    if (!order || order.status !== "已確認")
      return { error: "僅可作廢已確認單據，請勿重複沖回。" };
    if (!reason.trim()) return { error: "請填寫作廢原因。" };
    if (stocktakeConflict(state, order))
      return { error: "此倉別有進行中的盤點，請先完成或作廢盤點再沖回。" };
    const now = new Date().toISOString();
    const cancelled: InventoryDocument = {
      ...order,
      status: "已作廢",
      cancelledBy: actor(state),
      cancelledAt: now,
      cancelReason: reason.trim(),
      audit: [
        ...order.audit,
        `${now} ${actor(state)}：作廢並沖回原批次；${reason.trim()}`,
      ],
    };
    try {
      dispatch(
        inventoryDocumentCommitted({
          document: cancelled,
          ...planDocumentMovement(
            cancelled,
            state.items,
            true,
            actor(state),
            now,
          ),
        }),
      );
    } catch (error) {
      return { error: error instanceof Error ? error.message : "沖回失敗。" };
    }
    return { error: "", id };
  };
