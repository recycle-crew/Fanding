import type { NewStocktakeInput } from "@/types/store/stocktakes";
import {
  createSlice,
  type PayloadAction,
  type ThunkAction,
  type UnknownAction,
} from "@reduxjs/toolkit";
import type { RootState } from "./index";
import {
  countFor,
  countableRound,
  expectedFor,
  roundQty,
  scopeFromItem,
  seedStocktakes,
  stocktakeNow,
  supervisor,
  varianceFor,
} from "@/features/stocktakes/model";
import type { CountRecord, Stocktake } from "@/types/stocktakes";
import { taipeiToday } from "@/features/items/model";
type Result = { error: string; id?: string };
type StocktakeThunk = ThunkAction<Result, RootState, unknown, UnknownAction>;
const slice = createSlice({
  name: "stocktakes",
  initialState: seedStocktakes(),
  reducers: {
    setStocktakePersona(state, { payload }: PayloadAction<string>) {
      state.persona = payload;
    },
    addStocktake(state, { payload }: PayloadAction<Stocktake>) {
      if (!state.orders.some((row) => row.id === payload.id))
        state.orders.unshift(payload);
    },
    addStocktakeCount(
      state,
      { payload }: PayloadAction<{ id: string; record: CountRecord }>,
    ) {
      const order = state.orders.find((row) => row.id === payload.id)!;
      if (order.records.some((row) => row.id === payload.record.id)) return;
      order.records.push(payload.record);
      if (payload.record.round > 1) {
        const recount = order.recounts.find(
          (row) =>
            row.itemId === payload.record.itemId &&
            row.round === payload.record.round,
        );
        if (recount && !recount.person) recount.person = payload.record.person;
      }
      order.audit.push(
        `${payload.record.time} ${payload.record.person}：登錄 ${payload.record.id}（輪次 ${payload.record.round}）。`,
      );
      order.confirmedItems = order.confirmedItems.filter(
        (id) => id !== payload.record.itemId,
      );
      delete order.batchPlans[payload.record.itemId];
    },
    invalidateStocktakeCount(
      state,
      {
        payload,
      }: PayloadAction<{ id: string; recordId: string; reason: string }>,
    ) {
      const order = state.orders.find((row) => row.id === payload.id)!;
      const record = order.records.find((row) => row.id === payload.recordId)!;
      record.valid = false;
      record.invalidReason = payload.reason;
      record.invalidatedAt = stocktakeNow();
      record.invalidatedBy = supervisor;
      order.confirmedItems = order.confirmedItems.filter(
        (id) => id !== record.itemId,
      );
      delete order.batchPlans[record.itemId];
      order.audit.push(
        `${record.invalidatedAt} ${supervisor}：${record.id} 標記無效，原因 ${payload.reason}。`,
      );
    },
    closeStocktake(state, { payload }: PayloadAction<string>) {
      const order = state.orders.find((row) => row.id === payload)!;
      order.status = "待核對";
      order.closedAt = stocktakeNow();
      order.alignmentConfirmed = true;
      order.audit.push(
        `${order.closedAt} ${supervisor}：結束初盤，已確認全品項登錄、基準時間與帳面資料。`,
      );
    },
    cancelStocktake(
      state,
      { payload }: PayloadAction<{ id: string; reason: string }>,
    ) {
      const order = state.orders.find((row) => row.id === payload.id)!;
      order.status = "已作廢";
      order.cancelReason = payload.reason;
      order.audit.push(
        `${stocktakeNow()} ${supervisor}：作廢，${payload.reason}；保留快照及紀錄，未調整庫存。`,
      );
    },
    addStocktakeRecount(
      state,
      {
        payload,
      }: PayloadAction<{
        id: string;
        itemId: string;
        reason: string;
        round: number;
      }>,
    ) {
      const order = state.orders.find((row) => row.id === payload.id)!;
      order.recounts.push({
        id: crypto.randomUUID(),
        itemId: payload.itemId,
        round: payload.round,
        person: "",
        reason: payload.reason,
        status: "待複盤",
      });
      order.confirmedItems = order.confirmedItems.filter(
        (id) => id !== payload.itemId,
      );
      delete order.batchPlans[payload.itemId];
      order.audit.push(
        `${stocktakeNow()} ${supervisor}：發起 ${payload.itemId} 第 ${payload.round} 輪複盤，原因 ${payload.reason}。`,
      );
    },
    submitStocktakeRecount(
      state,
      { payload }: PayloadAction<{ id: string; recountId: string }>,
    ) {
      const order = state.orders.find((row) => row.id === payload.id)!;
      const recount = order.recounts.find(
        (row) => row.id === payload.recountId,
      )!;
      recount.status = "已提交";
      order.audit.push(
        `${stocktakeNow()} ${state.persona}：提交第 ${recount.round} 輪複盤。`,
      );
    },
    selectStocktakeRound(
      state,
      {
        payload,
      }: PayloadAction<{
        id: string;
        itemId: string;
        round: number;
        reason: string;
      }>,
    ) {
      const order = state.orders.find((row) => row.id === payload.id)!;
      order.selectedRounds[payload.itemId] = payload.round;
      order.recounts
        .filter((row) => row.itemId === payload.itemId)
        .forEach((row) => {
          row.status = row.round === payload.round ? "已採用" : "不採用";
        });
      order.confirmedItems = order.confirmedItems.filter(
        (id) => id !== payload.itemId,
      );
      delete order.batchPlans[payload.itemId];
      order.audit.push(
        `${stocktakeNow()} ${supervisor}：採用 ${payload.itemId} 第 ${payload.round} 輪，原因 ${payload.reason}；各輪不相加。`,
      );
    },
    confirmStocktakeItem(
      state,
      {
        payload,
      }: PayloadAction<{
        id: string;
        itemId: string;
        plans: { batchId: string; quantity: number }[];
      }>,
    ) {
      const order = state.orders.find((row) => row.id === payload.id)!;
      order.batchPlans[payload.itemId] = payload.plans;
      if (!order.confirmedItems.includes(payload.itemId))
        order.confirmedItems.push(payload.itemId);
      order.audit.push(
        `${stocktakeNow()} ${supervisor}：確認 ${payload.itemId} 差異與實際批次處置。`,
      );
    },
    completeStocktake(state, { payload }: PayloadAction<string>) {
      const order = state.orders.find((row) => row.id === payload)!;
      order.status = "已完成";
      order.completedAt = stocktakeNow();
      order.confirmedBy = supervisor;
      order.scope.forEach((scope) => {
        const delta = varianceFor(order, scope);
        if (!delta) return;
        order.adjustments.push({
          id: crypto.randomUUID(),
          reference: order.number,
          itemId: scope.itemId,
          expected: expectedFor(scope),
          counted: countFor(order, scope.itemId).quantity,
          type: delta > 0 ? "STOCKTAKE_SURPLUS_IN" : "STOCKTAKE_SHORTAGE_OUT",
          quantity: delta,
          batches: (order.batchPlans[scope.itemId] || [])
            .filter((plan) => plan.quantity !== 0)
            .map((plan) => ({
              batchId: plan.batchId,
              batchNumber: scope.batches.find(
                (batch) => batch.id === plan.batchId,
              )!.number,
              quantity: plan.quantity,
            })),
          actor: supervisor,
          time: order.completedAt,
        });
      });
      order.audit.push(
        `${order.completedAt} ${supervisor}：確認完成，已建立本模組展示調整紀錄；未更新模組一。`,
      );
    },
  },
});
export const { setStocktakePersona } = slice.actions;
export default slice.reducer;
function editable(state: RootState, id: string, manager = true) {
  const order = state.stocktakes.orders.find((row) => row.id === id);
  if (!order) return { error: "無法查看此盤點單。" };
  if (manager && state.stocktakes.persona !== supervisor)
    return { error: "此操作需主管展示身分。" };
  if (order.status === "已完成" || order.status === "已作廢")
    return { error: "已完成或已作廢盤點單唯讀。" };
  return { error: "", order };
}

export const createStocktake =
  (input: NewStocktakeInput): StocktakeThunk =>
  (dispatch, getState) => {
    const state = getState();
    if (state.stocktakes.persona !== supervisor)
      return { error: "只有主管可建立盤點單。" };
    if (!input.name.trim() || !input.date || !input.warehouse)
      return { error: "請填寫名稱、盤點日期與倉別。" };
    const ids =
      input.type === "全盤"
        ? [
            ...new Set(
              state.items.batches
                .filter((batch) => batch.warehouse === input.warehouse)
                .map((batch) => batch.itemId),
            ),
          ]
        : [...new Set(input.itemIds)];
    if (
      input.type === "部分盤點" &&
      ids.some(
        (id) =>
          !state.items.batches.some(
            (batch) =>
              batch.warehouse === input.warehouse && batch.itemId === id,
          ),
      )
    )
      return {
        error: "所選品項在此倉別沒有庫存紀錄，請選擇此倉有紀錄的商品。",
      };
    const scope = state.items.items
      .filter((item) => ids.includes(item.id))
      .map((item) => scopeFromItem(item, input.warehouse, state.items.batches));
    if (!scope.length)
      return { error: "盤點範圍不可為空；此倉別沒有可盤點品項。" };
    if (
      state.stocktakes.orders.some(
        (order) =>
          ["盤點中", "待核對"].includes(order.status) &&
          order.warehouse === input.warehouse &&
          order.scope.some((entry) => ids.includes(entry.itemId)),
      )
    )
      return {
        error: "同倉別、同品項已有盤點中或待核對單據，請先完成或作廢原單。",
      };
    const id = crypto.randomUUID(),
      now = stocktakeNow();
    dispatch(
      slice.actions.addStocktake({
        id,
        number: `ST${taipeiToday().replaceAll("-", "")}-${String(state.stocktakes.orders.length + 1).padStart(3, "0")}`,
        name: input.name.trim(),
        date: input.date,
        warehouse: input.warehouse,
        type: input.type,
        status: "盤點中",
        createdBy: supervisor,
        createdAt: now,
        snapshotAt: now,
        closedAt: "",
        completedAt: "",
        confirmedBy: "",
        remark: input.remark.trim(),
        scope,
        records: [],
        recounts: [],
        selectedRounds: {},
        confirmedItems: [],
        batchPlans: {},
        adjustments: [],
        audit: [`${now} ${supervisor}：建立盤點，範圍與基準已鎖定。`],
        cancelReason: "",
        alignmentConfirmed: false,
      }),
    );
    return { error: "", id };
  };
export const addCount =
  (input: {
    id: string;
    recordId: string;
    itemId: string;
    quantity: number;
    zero: boolean;
    area: string;
  }): StocktakeThunk =>
  (dispatch, getState) => {
    const state = getState(),
      check = editable(state, input.id, false);
    if (check.error) return check;
    const order = check.order!,
      person = state.stocktakes.persona,
      round = countableRound(order, input.itemId, person);
    if (!order.scope.some((scope) => scope.itemId === input.itemId) || !round)
      return { error: "此商品不在可輸入範圍，或盤點輸入已結束。" };
    if (
      !Number.isFinite(input.quantity) ||
      roundQty(input.quantity) !== input.quantity ||
      (input.zero ? input.quantity !== 0 : input.quantity <= 0)
    )
      return {
        error: "數量須大於零且最多三位小數；實盤為零請使用明確零值確認。",
      };
    if (input.zero && countFor(order, input.itemId, round).quantity > 0)
      return {
        error: "同輪已有正數紀錄，零值不會覆蓋先前輸入；請主管核對錯誤紀錄。",
      };
    dispatch(
      slice.actions.addStocktakeCount({
        id: order.id,
        record: {
          id: input.recordId,
          itemId: input.itemId,
          quantity: input.quantity,
          zero: input.zero,
          person,
          time: stocktakeNow(),
          round,
          area: input.area.trim(),
          valid: true,
          invalidReason: "",
          invalidatedBy: "",
          invalidatedAt: "",
        },
      }),
    );
    return { error: "", id: order.id };
  };
export const invalidateCount =
  (input: { id: string; recordId: string; reason: string }): StocktakeThunk =>
  (dispatch, getState) => {
    const check = editable(getState(), input.id);
    if (check.error) return check;
    if (
      !input.reason.trim() ||
      !check.order!.records.some(
        (row) => row.id === input.recordId && row.valid,
      )
    )
      return { error: "請選有效輸入紀錄並填寫無效原因。" };
    dispatch(
      slice.actions.invalidateStocktakeCount({
        ...input,
        reason: input.reason.trim(),
      }),
    );
    return { error: "", id: input.id };
  };
export const closeCounting =
  (input: {
    id: string;
    partition: boolean;
    time: boolean;
    his: boolean;
  }): StocktakeThunk =>
  (dispatch, getState) => {
    const check = editable(getState(), input.id);
    if (check.error) return check;
    const order = check.order!;
    if (order.status !== "盤點中") return { error: "只有盤點中單據可以關閉。" };
    if (order.scope.some((scope) => !countFor(order, scope.itemId, 1).counted))
      return {
        error: "仍有未盤點品項，不能視為零；請補登或明確確認實盤為零。",
      };
    if (!input.partition || !input.time || !input.his)
      return {
        error:
          "需確認沒有重複計算、基準時間與異動對齊及帳面資料；不符合時請暫停或重新盤點。",
      };
    dispatch(slice.actions.closeStocktake(order.id));
    return { error: "", id: order.id };
  };
export const cancelCounting =
  (input: { id: string; reason: string }): StocktakeThunk =>
  (dispatch, getState) => {
    const check = editable(getState(), input.id);
    if (check.error) return check;
    if (!input.reason.trim()) return { error: "請填寫作廢原因。" };
    dispatch(slice.actions.cancelStocktake(input));
    return { error: "", id: input.id };
  };
export const requestRecount =
  (input: { id: string; itemId: string; reason: string }): StocktakeThunk =>
  (dispatch, getState) => {
    const check = editable(getState(), input.id);
    if (check.error) return check;
    const order = check.order!;
    if (
      order.status !== "待核對" ||
      !order.scope.some((scope) => scope.itemId === input.itemId) ||
      !input.reason.trim()
    )
      return { error: "請在待核對單據選擇商品並填寫複盤原因。" };
    if (
      order.recounts.some(
        (row) =>
          row.itemId === input.itemId &&
          ["待複盤", "已提交"].includes(row.status),
      )
    )
      return { error: "此品項已有尚未選定有效輪次的複盤。" };
    const round =
      Math.max(
        1,
        ...order.recounts
          .filter((row) => row.itemId === input.itemId)
          .map((row) => row.round),
      ) + 1;
    dispatch(slice.actions.addStocktakeRecount({ ...input, round }));
    return { error: "", id: order.id };
  };
export const submitRecount =
  (input: { id: string; recountId: string }): StocktakeThunk =>
  (dispatch, getState) => {
    const state = getState(),
      check = editable(state, input.id, false);
    if (check.error) return check;
    const recount = check.order!.recounts.find(
      (row) => row.id === input.recountId,
    );
    if (
      !recount ||
      recount.person !== state.stocktakes.persona ||
      recount.status !== "待複盤" ||
      !countFor(check.order!, recount.itemId, recount.round).counted
    )
      return { error: "請由複盤輸入者提交紀錄；未盤點不代表零。" };
    dispatch(slice.actions.submitStocktakeRecount(input));
    return { error: "", id: input.id };
  };
export const chooseCountRound =
  (input: {
    id: string;
    itemId: string;
    round: number;
    reason: string;
  }): StocktakeThunk =>
  (dispatch, getState) => {
    const check = editable(getState(), input.id);
    if (check.error) return check;
    const order = check.order!;
    if (
      order.status !== "待核對" ||
      !input.reason.trim() ||
      order.recounts.some(
        (row) => row.itemId === input.itemId && row.status === "待複盤",
      ) ||
      !countFor(order, input.itemId, input.round).counted
    )
      return { error: "請等待必要複盤提交，選擇有紀錄的輪次並填寫採用原因。" };
    dispatch(slice.actions.selectStocktakeRound(input));
    return { error: "", id: input.id };
  };
export const confirmCountItem =
  (input: {
    id: string;
    itemId: string;
    plans: { batchId: string; quantity: number }[];
    checked: boolean;
  }): StocktakeThunk =>
  (dispatch, getState) => {
    const check = editable(getState(), input.id);
    if (check.error) return check;
    const order = check.order!,
      scope = order.scope.find((row) => row.itemId === input.itemId);
    if (order.status !== "待核對" || !scope || !input.checked)
      return { error: "請核對品項、批次及結果後勾選確認。" };
    const difference = varianceFor(order, scope);
    if (
      difference === null ||
      order.recounts.some(
        (row) =>
          row.itemId === scope.itemId &&
          ["待複盤", "已提交"].includes(row.status),
      )
    )
      return { error: "尚未盤點或必要複盤未完成／未採用，無法確認。" };
    if (difference && scope.trackBatch) {
      if (
        roundQty(input.plans.reduce((sum, plan) => sum + plan.quantity, 0)) !==
          difference ||
        new Set(input.plans.map((plan) => plan.batchId)).size !==
          input.plans.length ||
        input.plans.some((plan) => {
          const batch = scope.batches.find((row) => row.id === plan.batchId);
          return (
            !batch ||
            !Number.isFinite(plan.quantity) ||
            roundQty(plan.quantity) !== plan.quantity ||
            (difference > 0 && plan.quantity < 0) ||
            (difference < 0 && plan.quantity > 0) ||
            batch.quantity + plan.quantity < batch.unavailable
          );
        })
      )
        return {
          error:
            "請明確分配實際批次差異，合計須等於差異且不得使批次庫存低於不可用量；無法確認時請暫停入帳。",
        };
    }
    dispatch(
      slice.actions.confirmStocktakeItem({
        id: input.id,
        itemId: input.itemId,
        plans: scope.trackBatch ? input.plans : [],
      }),
    );
    return { error: "", id: input.id };
  };
export const approveCounting =
  (input: { id: string; confirmed: boolean }): StocktakeThunk =>
  (dispatch, getState) => {
    const check = editable(getState(), input.id);
    if (check.error) return check;
    const order = check.order!;
    if (
      order.status !== "待核對" ||
      !order.alignmentConfirmed ||
      !input.confirmed ||
      order.scope.some(
        (scope) =>
          !countFor(order, scope.itemId).counted ||
          !order.confirmedItems.includes(scope.itemId),
      ) ||
      order.recounts.some((row) => ["待複盤", "已提交"].includes(row.status))
    )
      return {
        error:
          "請先完成所有品項核對、必要複盤與批次分配，確認時間基準安全後才完成。",
      };
    dispatch(slice.actions.completeStocktake(order.id));
    return { error: "", id: order.id };
  };
