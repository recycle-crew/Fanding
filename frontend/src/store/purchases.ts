import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { createPurchasesSeed } from "@/features/purchases/model";
import type {
  ExchangeReceipt,
  ExchangeOrder,
  Purchase,
  PurchaseInvoice,
  PurchaseRecord,
  Settlement,
} from "@/types/purchases";
const slice = createSlice({
  name: "purchases",
  initialState: createPurchasesSeed(),
  reducers: {
    addPurchase(state, { payload }: PayloadAction<Purchase>) {
      if (!state.orders.some((o) => o.id === payload.id))
        state.orders.unshift(payload);
    },
    updatePurchaseInvoice(
      state,
      { payload }: PayloadAction<{ id: string; value: PurchaseInvoice }>,
    ) {
      const order = state.orders.find((order) => order.id === payload.id);
      if (
        order &&
        !order.settlement &&
        !order.records.some((record) => record.kind === "reversal")
      )
        Object.assign(order, payload.value);
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
    addExchangeOrder(state, { payload }: PayloadAction<ExchangeOrder>) {
      if (!state.exchanges.some((exchange) => exchange.id === payload.id))
        state.exchanges.unshift(payload);
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
        exchangeReceipt?: ExchangeReceipt;
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
        if (payload.exchangeReceipt)
          record.exchangeReceipt = payload.exchangeReceipt;
        const exchange = state.exchanges.find(
          (candidate) => candidate.returnRecordId === payload.recordId,
        );
        if (exchange && payload.exchangeReceipt) {
          exchange.receipt = payload.exchangeReceipt;
          exchange.status = "已收貨";
        }
      }
    },
  },
});
export const {
  updatePurchaseInvoice,
  addPurchase,
  settlePurchase,
  addPurchaseRecord,
  addExchangeOrder,
  resolvePurchaseRecord,
} = slice.actions;
export default slice.reducer;
