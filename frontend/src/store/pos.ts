import type { CheckoutInput, ReturnInput } from "@/types/store/pos";
import {
  createSlice,
  type PayloadAction,
  type ThunkAction,
  type UnknownAction,
} from "@reduxjs/toolkit";
import type { RootState } from "./index";
import {
  allocate,
  cents,
  createPosSeed,
  eligible,
  nowTaipei,
  policyFor,
  priceCart,
  qty,
  returnAmount,
  returnedQuantity,
} from "@/features/pos/model";
import type {
  CartLine,
  Customer,
  PaymentMethod,
  PosPolicy,
  Sale,
  SaleReturn,
} from "@/types/pos";
import { available, taipeiToday } from "@/features/items/model";
type Result = { error: string; saleId?: string };
type PosThunk = ThunkAction<Result, RootState, unknown, UnknownAction>;
const slice = createSlice({
  name: "pos",
  initialState: createPosSeed(),
  reducers: {
    savePosPolicy(
      state,
      { payload }: PayloadAction<{ itemId: string; policy: PosPolicy }>,
    ) {
      state.policies[payload.itemId] = payload.policy;
    },
    addSale(state, { payload }: PayloadAction<Sale>) {
      if (state.sales.some((sale) => sale.requestId === payload.requestId))
        return;
      for (const line of payload.lines)
        for (const allocation of line.allocations) {
          const batch = state.batches.find(
            (row) => row.id === allocation.batchId,
          );
          if (!batch || available(batch) < allocation.quantity) return;
        }
      state.sales.unshift(payload);
      for (const line of payload.lines)
        for (const allocation of line.allocations) {
          const batch = state.batches.find(
            (row) => row.id === allocation.batchId,
          )!;
          batch.quantity = qty(batch.quantity - allocation.quantity);
          state.movements.push({
            id: `${payload.id}-${allocation.batchId}`,
            saleId: payload.id,
            reference: payload.number,
            batchId: batch.id,
            itemId: line.itemId,
            quantity: -allocation.quantity,
            type: "POS_OUT",
            time: payload.date,
            actor: payload.cashier,
          });
        }
    },
    addSaleReturn(
      state,
      { payload }: PayloadAction<{ saleId: string; record: SaleReturn }>,
    ) {
      const sale = state.sales.find((row) => row.id === payload.saleId);
      if (
        !sale ||
        sale.void ||
        sale.returns.some((row) => row.id === payload.record.id)
      )
        return;
      sale.returns.push(payload.record);
      const amount =
        payload.record.lines.reduce(
          (sum, line) => sum + cents(line.refund),
          0,
        ) / 100;
      if (amount > 0)
        sale.refunds.push({
          id: `REF-${payload.record.id}`,
          sourceId: payload.record.id,
          amount,
          method: payload.record.method,
          status: "待退款",
          actor: "",
          confirmedAt: "",
          reference: "",
        });
      for (const line of payload.record.lines)
        for (const allocation of line.allocations) {
          const batch = state.batches.find(
            (row) => row.id === allocation.batchId,
          )!;
          batch.quantity = qty(batch.quantity + allocation.quantity);
          state.movements.push({
            id: `${payload.record.id}-${batch.id}`,
            saleId: sale.id,
            reference: payload.record.id,
            itemId: batch.itemId,
            batchId: batch.id,
            quantity: allocation.quantity,
            type: "POS_RETURN_IN",
            time: payload.record.date,
            actor: payload.record.actor,
          });
        }
    },
    voidSale(
      state,
      { payload }: PayloadAction<{ saleId: string; reason: string }>,
    ) {
      const sale = state.sales.find((row) => row.id === payload.saleId);
      if (!sale || sale.void || sale.returns.length) return;
      sale.void = {
        reason: payload.reason,
        actor: "主管（展示）",
        date: nowTaipei(),
      };
      if (sale.total > 0)
        sale.refunds.push({
          id: `REF-VOID-${sale.id}`,
          sourceId: `VOID-${sale.id}`,
          amount: sale.total,
          method: sale.payment.method,
          status: "待退款",
          reference: "",
          actor: "",
          confirmedAt: "",
        });
      for (const line of sale.lines)
        for (const allocation of line.allocations) {
          const batch = state.batches.find(
            (row) => row.id === allocation.batchId,
          )!;
          batch.quantity = qty(batch.quantity + allocation.quantity);
          state.movements.push({
            id: `VOID-${sale.id}-${batch.id}`,
            saleId: sale.id,
            reference: `VOID-${sale.number}`,
            batchId: batch.id,
            itemId: line.itemId,
            quantity: allocation.quantity,
            type: "POS_VOID_REVERSAL_IN",
            time: sale.void.date,
            actor: sale.void.actor,
          });
        }
    },
    confirmSaleRefund(
      state,
      {
        payload,
      }: PayloadAction<{ saleId: string; refundId: string; reference: string }>,
    ) {
      const sale = state.sales.find((row) => row.id === payload.saleId);
      const refund = sale?.refunds.find((row) => row.id === payload.refundId);
      if (!refund || refund.status === "已退款") return;
      refund.status = "已退款";
      refund.actor = "財務（展示）";
      refund.confirmedAt = nowTaipei();
      refund.reference = payload.reference;
    },
  },
});
export const { savePosPolicy } = slice.actions;
export default slice.reducer;

export const checkoutPos =
  (input: CheckoutInput): PosThunk =>
  (dispatch, getState) => {
    const state = getState(),
      existing = state.pos.sales.find(
        (sale) => sale.requestId === input.requestId,
      );
    if (existing) return { error: "", saleId: existing.id };
    const priced = priceCart(input.cart, input.orderDiscount);
    if (input.sellerTaxId?.trim() && !/^\d{8}$/.test(input.sellerTaxId.trim()))
      return { error: "銷售主體統一編號須為 8 位數字。" };
    if (priced.error) return { error: priced.error };
    if (!input.warehouse || !input.seller || !input.sellerConfirmed)
      return { error: "請選擇倉別與銷售主體，並確認銷售資格（展示）。" };
    if (
      input.method === "現金" &&
      (!Number.isFinite(input.received) ||
        cents(input.received) < cents(priced.total))
    )
      return { error: "現金實收不可小於應收金額。" };
    if (input.method !== "現金" && !input.paymentConfirmed)
      return { error: "請先確認外部付款成功；此系統不會自動收款。" };
    const lines: Sale["lines"] = [];
    for (const entry of priced.priced) {
      const item = state.items.items.find((row) => row.id === entry.itemId);
      if (!item) return { error: "商品已不存在，請重新選擇。" };
      const policy = state.pos.policies[item.id] || policyFor(item);
      const invalid = eligible(item, policy);
      if (invalid) return { error: `${item.name}：${invalid}。` };
      if (
        !input.authorized &&
        (cents(entry.price) !== cents(policy.price) ||
          entry.discount > 0 ||
          input.orderDiscount > 0 ||
          entry.batchId)
      )
        return { error: "售價、折扣與指定批次需主管展示授權。" };
      if (
        (policy.prescription && !input.prescription) ||
        (policy.professional && !input.professional)
      )
        return { error: "請完成處方／專業人員確認（展示）。" };
      const allocations = allocate(
        state.pos.batches,
        item,
        input.warehouse,
        entry.quantity,
        entry.batchId,
      );
      if (!allocations)
        return {
          error: `${item.name}：可用庫存不足或指定批次不足，過期與不可用批次已排除。`,
        };
      lines.push({
        id: crypto.randomUUID(),
        itemId: item.id,
        code: item.code,
        name: item.name,
        specification: item.specification,
        category: item.category,
        unit: item.unit,
        medicine: item.group === "HIS_MEDICINE",
        quantity: entry.quantity,
        originalPrice: policy.price,
        price: entry.price,
        discount: entry.discount,
        orderShare: entry.orderShare,
        net: entry.net,
        allocations,
      });
    }
    const id = crypto.randomUUID();
    const number = `SO${taipeiToday().replaceAll("-", "")}-${String(state.pos.sales.length + 1).padStart(4, "0")}`;
    dispatch(
      slice.actions.addSale({
        id,
        requestId: input.requestId,
        number,
        date: nowTaipei(),
        warehouse: input.warehouse,
        seller: input.seller,
        sellerTaxId: input.sellerTaxId?.trim() || "",
        customer: { ...input.customer },
        cashier: "王小明",
        lines,
        subtotal: priced.subtotal,
        orderDiscount: input.orderDiscount,
        total: priced.total,
        payment: {
          method: input.method,
          received: input.method === "現金" ? input.received : priced.total,
          change:
            input.method === "現金"
              ? (cents(input.received) - cents(priced.total)) / 100
              : 0,
          reference: input.reference.trim(),
          confirmed: true,
        },
        receiptType: input.receiptType,
        invoiceStatus: "未開立（未串接）",
        remark: input.remark.trim(),
        authorization: input.authorized
          ? "主管展示授權：售價／折扣／實際批次"
          : "櫃檯原價銷售",
        returns: [],
        refunds: [],
        void: null,
      }),
    );
    return getState().pos.sales.some((sale) => sale.id === id)
      ? { error: "", saleId: id }
      : {
          error:
            "庫存重新驗證失敗；尚未建立本地交易。外部已收款者請保留交易識別碼對帳，勿重收。",
        };
  };

export const returnPos =
  (input: ReturnInput): PosThunk =>
  (dispatch, getState) => {
    const state = getState(),
      sale = state.pos.sales.find((row) => row.id === input.saleId);
    if (!sale || sale.void) return { error: "作廢或不存在的銷售單無法退貨。" };
    if (sale.returns.some((record) => record.id === input.requestId))
      return { error: "", saleId: sale.id };
    if (
      !input.reason.trim() ||
      !input.date ||
      input.date < sale.date.slice(0, 10) ||
      input.date > taipeiToday()
    )
      return { error: "請填寫退貨原因與介於銷售日和今日之間的退貨日期。" };
    if (!input.confirmed)
      return { error: "請確認已收到實體退貨，並核對處置方式。" };
    const lines: SaleReturn["lines"] = [];
    for (const line of sale.lines) {
      const quantity = Number(input.quantities[line.id] || 0);
      if (
        !Number.isFinite(quantity) ||
        quantity < 0 ||
        qty(quantity) !== quantity ||
        quantity > qty(line.quantity - returnedQuantity(sale, line.id))
      )
        return {
          error: `${line.name}退貨數量不可超過剩餘可退量，最多三位小數。`,
        };
      if (!quantity) continue;
      const allocations: SaleReturn["lines"][number]["allocations"] = [];
      if (input.disposition === "可售回庫") {
        if (line.medicine && !input.professional)
          return { error: "藥品回可售庫存須完成專業人員確認（展示）。" };
        let skip = returnedQuantity(sale, line.id),
          remaining = quantity;
        for (const original of line.allocations) {
          const previously = Math.min(skip, original.quantity);
          skip = qty(skip - previously);
          const taken = qty(
            Math.min(remaining, original.quantity - previously),
          );
          if (!taken) continue;
          const batch = state.pos.batches.find(
            (row) => row.id === original.batchId,
          );
          if (!batch || (batch.expiryDate && batch.expiryDate < taipeiToday()))
            return {
              error:
                "原交易批次無法核對或已過期，請選不可售並交由後續流程處理。",
            };
          allocations.push({ ...original, quantity: taken });
          remaining = qty(remaining - taken);
        }
        if (remaining > 0)
          return { error: "原出庫批次不足以追溯退回量，需人工核對。" };
      }
      lines.push({
        lineId: line.id,
        quantity,
        refund: returnAmount(sale, line, quantity),
        disposition: input.disposition,
        allocations,
      });
    }
    if (!lines.length) return { error: "請至少輸入一筆本次退貨數量。" };
    dispatch(
      slice.actions.addSaleReturn({
        saleId: sale.id,
        record: {
          id: input.requestId,
          date: input.date,
          actor: "王小明（展示）",
          reason: input.reason.trim(),
          method: input.method,
          lines,
        },
      }),
    );
    return { error: "", saleId: sale.id };
  };
export const voidPos =
  (input: {
    saleId: string;
    reason: string;
    notDelivered: boolean;
    authorized: boolean;
  }): PosThunk =>
  (dispatch, getState) => {
    const state = getState(),
      sale = state.pos.sales.find((row) => row.id === input.saleId);
    if (!sale || sale.void || sale.returns.length)
      return { error: "已作廢或已有退貨的交易不可再次作廢。" };
    if (!input.authorized || !input.reason.trim() || !input.notDelivered)
      return {
        error:
          "作廢需主管展示授權、原因及未交付確認。已交付商品請使用退貨流程。",
      };
    if (
      sale.lines.some((line) =>
        line.allocations.some(
          (allocation) =>
            !state.pos.batches.some((batch) => batch.id === allocation.batchId),
        ),
      )
    )
      return {
        error:
          "歷史展示批次無法核對，暫停反向庫存異動；請以本輪新建銷售展示作廢。",
      };
    dispatch(
      slice.actions.voidSale({
        saleId: input.saleId,
        reason: input.reason.trim(),
      }),
    );
    return { error: "", saleId: sale.id };
  };
export const refundPos =
  (input: {
    saleId: string;
    refundId: string;
    reference: string;
    confirmed: boolean;
    authorized: boolean;
  }): PosThunk =>
  (dispatch, getState) => {
    const sale = getState().pos.sales.find((row) => row.id === input.saleId),
      refund = sale?.refunds.find((row) => row.id === input.refundId);
    if (!refund || refund.status === "已退款")
      return { error: "退款不存在或已完成，不可重複確認。" };
    if (
      !input.authorized ||
      !input.confirmed ||
      (refund.method !== "現金" && !input.reference.trim())
    )
      return {
        error: "請取得財務展示授權、確認實際退款；非現金退款需填參考號碼。",
      };
    dispatch(slice.actions.confirmSaleRefund(input));
    return { error: "", saleId: sale!.id };
  };
