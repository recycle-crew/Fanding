import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { createPurchasesSeed } from "@/features/purchases/model";
import type { Purchase, PurchaseRecord, Settlement } from "@/types/purchases";
const slice = createSlice({
  name: "purchases",
  initialState: createPurchasesSeed(),
  reducers: {
    addPurchase(state, { payload }: PayloadAction<Purchase>) {
      if (!state.orders.some((o) => o.id === payload.id))
        state.orders.unshift(payload);
    },
    settlePurchase(
      state,
      { payload }: PayloadAction<{ id: string; settlement: Settlement }>,
    ) {
      const order = state.orders.find((o) => o.id === payload.id);
      if (order && !order.settlement) order.settlement = payload.settlement;
    },
    addPurchaseRecord(
      state,
      { payload }: PayloadAction<{ id: string; record: PurchaseRecord }>,
    ) {
      const order = state.orders.find((o) => o.id === payload.id);
      if (order && !order.records.some((r) => r.id === payload.record.id))
        order.records.push(payload.record);
    },
    resolvePurchaseRecord(
      state,
      {
        payload,
      }: PayloadAction<{
        orderId: string;
        recordId: string;
        amount: string;
        reference: string;
        resolution: string;
        resolvedAt: string;
        operator: string;
      }>,
    ) {
      const record = state.orders
        .find((o) => o.id === payload.orderId)
        ?.records.find((r) => r.id === payload.recordId);
      if (record && record.accountingStatus === "待處理") {
        record.accountingStatus = "已完成";
        record.resolutionAmount = payload.amount;
        record.reference = payload.reference;
        record.resolution = payload.resolution;
        record.resolvedAt = payload.resolvedAt;
        record.resolvedBy = payload.operator;
      }
    },
  },
});
export const {
  addPurchase,
  settlePurchase,
  addPurchaseRecord,
  resolvePurchaseRecord,
} = slice.actions;
export default slice.reducer;
