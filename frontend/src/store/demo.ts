import type { Field } from "@/types/store/demo";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { applyPatches, enablePatches, produceWithPatches } from "immer";
import type { Patch } from "immer";
import type { AppThunk } from "@/store";
import { createDemoState } from "@/store/demoSeed";
import {
  appendBatchOperation,
  createMovementVoucher,
  recordInventoryMovement,
  startStocktakeBatch,
  submitMovementVoucher,
} from "@/features/demo/domain";
import type { DemoState, EditorKind, ModuleKey, Workspace } from "@/types/demo";

enablePatches();
export type Command =
  | { type: "navigate"; module: ModuleKey }
  | { type: "lookup"; barcode: string }
  | {
      type: "open-editor";
      kind: EditorKind;
      id?: string | number;
      barcode?: string;
    }
  | { type: "close-editor"; saved?: boolean }
  | { type: "save-editor" }
  | { type: "action"; action: string; id?: string }
  | { type: "confirm" };

function setDemoError(state: DemoState, error: unknown) {
  state.errors[
    state.editor
      ? "editor"
      : state.activeModule === "receipt" || state.activeModule === "issue"
        ? "voucher"
        : "page"
  ] = error instanceof Error ? error.message : String(error);
}

const demoSlice = createSlice({
  name: "demo",
  initialState: createDemoState(),
  reducers: {
    statePatched: {
      reducer(
        state,
        action: PayloadAction<Patch[], string, { command: string }>,
      ) {
        return applyPatches(state, action.payload);
      },
      prepare(patches: Patch[], command = "state-update") {
        return { payload: patches, meta: { command } };
      },
    },
  },
});

export const { statePatched } = demoSlice.actions;
export default demoSlice.reducer;

// 更新 callback 僅在 thunk 中執行，Redux action 與 state 都保留可序列化資料。
// Immer patches 保留同一個操作的原子更新，不關閉 Redux 的序列化與不可變檢查。
export function executeDemoCommand(
  command: Command | { type: "update"; update: (draft: DemoState) => void },
): AppThunk {
  return (dispatch, getState) => {
    const [, patches] = produceWithPatches(getState().demo, (draft) => {
      try {
        if (command.type === "update") command.update(draft);
        else execute(draft, command);
      } catch (error) {
        setDemoError(draft, error);
      }
    });
    if (patches.length) dispatch(statePatched(patches, command.type));
  };
}
export function execute(s: DemoState, command: Command): void {
  if (command.type === "navigate") {
    if (s.editor || s.confirmation) {
      s.notice = "請先儲存、取消或完成目前的確認，再切換功能。";
      return;
    }
    s.activeModule = command.module;
    s.searchTerm = "";
    s.vendorStatusFilter = "";
    s.selectedProductId = null;
    s.scanBarcode = "";
    s.errors = {};
    s.pageRevision++;
    return;
  }
  if (command.type === "lookup") {
    if (s.activeModule === "stocktake-history") {
      s.notice = "歷史查詢路由不接受掃碼或現有週期操作。";
      return;
    }
    const batch =
      s.activeModule === "stocktake"
        ? s.stocktakeBatches.find(
            (batch) =>
              batch.id === s.selectedStocktakeBatchIds[s.stocktakeWorkspace] &&
              !batch.endedAt,
          )
        : null;
    if (s.activeModule === "stocktake" && !batch) {
      s.notice = "請先開始或選擇進行中的盤點批次。";
      return;
    }
    s.scanBarcode = command.barcode.trim();
    s.selectedProductId = null;
    s.errors.scan = "";
    s.errors.movement = "";
    s.movementDraft = { quantity: "", note: "", unitCost: "" };
    const products =
      s.activeModule === "stocktake" && s.stocktakeWorkspace === "HIS"
        ? s.hisMedicines
        : s.otcProducts;
    const product = products.find(
      (product) => product.barcode === s.scanBarcode,
    );
    if (!product) {
      if (batch)
        appendBatchOperation(
          s,
          batch,
          "掃碼查詢",
          "",
          "",
          "",
          `找不到條碼：${s.scanBarcode}`,
          "失敗",
        );
      s.errors.scan = "沒有找到此條碼對應的品項，請確認條碼或先建立品項。";
      return;
    }
    s.selectedProductId = product.id;
    if (batch) {
      const pending = s.stocktakes.find(
        (count) =>
          count.batchId === batch.id &&
          count.productId === product.id &&
          !count.completed,
      );
      if (!pending) {
        s.stocktakes.push({
          id: s.nextStocktakeId++,
          batchId: batch.id,
          workspace: s.stocktakeWorkspace,
          productId: product.id,
          book: product.stock,
          actual: null,
          completed: false,
          confirmed: false,
          filledBy: s.currentAccount,
        });
        appendBatchOperation(
          s,
          batch,
          "新增盤點品項",
          product.id,
          "",
          product.stock,
          "保存盤點帳面基準，實盤數量尚未填寫",
        );
      } else {
        appendBatchOperation(
          s,
          batch,
          "掃描既有盤點品項",
          product.id,
          pending.book,
          pending.actual,
          "品項已在本批次，未新增重複盤點列",
        );
        s.notice = "此品項已在待調整盤點中，請按「編輯」補填實盤數量。";
      }
    }
    return;
  }
  if (command.type === "open-editor") {
    openEditor(s, command.kind, command.id ?? null, command.barcode ?? "");
    return;
  }
  if (command.type === "close-editor") {
    if (s.editor?.kind === "stocktake" && !command.saved) {
      const count = s.stocktakes.find((count) => count.id === s.editor.id);
      const batch = s.stocktakeBatches.find(
        (batch) => batch.id === count?.batchId && !batch.endedAt,
      );
      if (batch)
        appendBatchOperation(
          s,
          batch,
          "取消編輯",
          count.productId,
          count.actual,
          count.actual,
          "放棄未儲存的實盤輸入",
          "取消",
        );
    }
    s.editor = null;
    s.errors.editor = "";
    return;
  }
  if (command.type === "save-editor") {
    saveEditor(s);
    return;
  }
  if (command.type === "confirm") {
    const confirmation = s.confirmation;
    s.confirmation = null;
    if (!confirmation) return;
    const voucher = s.movementVouchers.find(
      (voucher) => voucher.id === confirmation.id,
    );
    if (confirmation.action === "submit-voucher") {
      submitMovementVoucher(s, voucher);
      s.selectedProductId = null;
      s.scanBarcode = "";
      s.notice = "傳票已送出，庫存已更新並鎖定明細。";
    }
    if (
      confirmation.action === "cancel-voucher" &&
      voucher &&
      !voucher.submittedAt &&
      !voucher.cancelledAt
    ) {
      voucher.cancelledAt = new Date().toISOString();
      voucher.cancelledBy = s.currentAccount;
      s.selectedProductId = null;
      s.scanBarcode = "";
    }
    if (confirmation.action === "delete") deleteConfirmed(s, confirmation.id);
    if (
      confirmation.action === "end-batch" ||
      confirmation.action === "submit-batch"
    ) {
      const batch = s.stocktakeBatches.find(
        (batch) => batch.id === confirmation.id && !batch.endedAt,
      );
      if (!batch) throw new Error("批次已送出或結束，不能再次送出。");
      const counts = s.stocktakes.filter((count) => count.batchId === batch.id);
      if (confirmation.action === "end-batch") {
        if (counts.some((count) => !count.completed))
          throw new Error("尚有未完成盤點，請先確認調整或移除，再結束批次。");
        appendBatchOperation(
          s,
          batch,
          "結束盤點",
          "",
          "進行中",
          "已結束",
          "批次期間結束，後續操作不再加入此批次",
        );
      } else {
        const products =
          batch.workspace === "HIS" ? s.hisMedicines : s.otcProducts;
        if (
          !counts.length ||
          counts.some(
            (count) =>
              !count.confirmed ||
              count.completed ||
              !Number.isSafeInteger(count.actual) ||
              count.actual < 0 ||
              count.actual > 1000000,
          )
        )
          throw new Error("請手動填妥所有實盤數量並勾選確認盤點。");
        if (
          counts.some(
            (count) =>
              products.find((product) => product.id === count.productId)
                ?.stock !== count.book,
          )
        ) {
          appendBatchOperation(
            s,
            batch,
            "批次送出遭拒",
            "",
            "草稿",
            "草稿",
            "帳面庫存已變更，需重新盤點",
            "拒絕",
          );
          throw new Error(
            "有品項帳面庫存已變更，本批次未送出；請移除該筆並重新盤點。",
          );
        }
        for (const count of counts) {
          const product = products.find(
            (product) => product.id === count.productId,
          );
          const quantity = count.actual - count.book;
          product.stock = count.actual;
          product.filledBy = s.currentAccount;
          count.completed = true;
          count.filledBy = s.currentAccount;
          count.submittedAt = new Date().toISOString();
          count.submittedBy = s.currentAccount;
          recordInventoryMovement(s, {
            id: s.nextMovementId++,
            workspace: batch.workspace,
            productId: product.id,
            type: "盤點送出調整",
            quantity,
            note: "批次確認送出，鎖定明細並更新假庫存",
            time: new Date().toLocaleString("zh-TW"),
            filledBy: s.currentAccount,
          });
        }
        appendBatchOperation(
          s,
          batch,
          "確認送出批次",
          "",
          "草稿",
          "已送出・鎖定",
          `已確認 ${counts.length} 筆，批次期間結束`,
        );
        batch.submittedAt = new Date().toISOString();
        batch.submittedBy = s.currentAccount;
      }
      batch.endedAt = s.stocktakeOperations.at(-1).time;
      batch.endedBy = s.currentAccount;
      s.selectedHistoricalBatchIds[batch.workspace] = batch.id;
      s.selectedProductId = null;
      s.scanBarcode = "";
      s.notice = "盤點批次已結束，歷程已保留。";
    }
    return;
  }
  const { action, id } = command;
  if (action === "cancel-scan") {
    s.selectedProductId = null;
    s.scanBarcode = "";
    s.errors.scan = "";
    return;
  }
  if (action === "create-voucher") {
    const current = s.movementVouchers.find(
      (v) => v.id === s.selectedMovementVoucherIds[s.activeModule],
    );
    if (!current || current.submittedAt || current.cancelledAt)
      createMovementVoucher(s, s.activeModule);
    s.selectedProductId = null;
    s.scanBarcode = "";
    return;
  }
  if (action === "submit-voucher" || action === "cancel-voucher") {
    const voucher = s.movementVouchers.find(
      (v) => v.id === s.selectedMovementVoucherIds[s.activeModule],
    );
    if (!voucher || voucher.submittedAt || voucher.cancelledAt) return;
    s.errors.voucher = "";
    s.confirmation = {
      action,
      id: voucher.id,
      message:
        action === "submit-voucher"
          ? `確認送出傳票 ${voucher.id}，共 ${voucher.lines.length} 筆明細？送出後更新庫存並鎖定。`
          : `取消傳票 ${voucher.id}？保留編號與明細，不異動庫存。`,
    };
    return;
  }
  if (action === "delete") {
    const collection =
      s.activeModule === "vendors"
        ? s.vendors
        : s.activeModule === "products"
          ? s.otcProducts
          : s.requisitions;
    const entry = collection.find((entry) => String(entry.id) === id);
    if (!entry) return;
    if (
      s.activeModule === "vendors" &&
      s.otcProducts.some((product) => product.vendorId === entry.id)
    ) {
      s.notice = "此廠商已被品項引用，不能刪除；可改為停用。";
      return;
    }
    if (
      s.activeModule === "products" &&
      (s.movements.some((m) => m.workspace === "OTC" && m.productId === id) ||
        s.requisitions.some((r) => r.productId === id) ||
        s.stocktakes.some((c) => c.workspace === "OTC" && c.productId === id))
    ) {
      s.notice = "此品項已有庫存異動、領用或盤點紀錄，不能刪除。";
      return;
    }
    s.confirmation = {
      action: "delete",
      id,
      message: `確定刪除 ${"name" in entry ? entry.name : `領用紀錄 #${entry.id}`}？${s.activeModule === "requisitions" ? "刪除將回復原領用庫存。" : ""}`,
    };
    return;
  }
  if (action === "sample") {
    execute(s, {
      type: "lookup",
      barcode: (s.stocktakeWorkspace === "HIS"
        ? s.hisMedicines
        : s.otcProducts
      ).find((product) => product.status === "啟用").barcode,
    });
    return;
  }
  if (action === "start-batch") {
    if (s.activeModule !== "stocktake") return;
    startStocktakeBatch(s, s.stocktakeWorkspace);
    s.selectedProductId = null;
    s.scanBarcode = "";
    return;
  }
  if (action === "remove-count") {
    const count = s.stocktakes.find(
      (count) => String(count.id) === id && !count.completed,
    );
    const batch = s.stocktakeBatches.find(
      (batch) => batch.id === count?.batchId && !batch.endedAt,
    );
    if (batch && s.activeModule === "stocktake") {
      appendBatchOperation(
        s,
        batch,
        "移除盤點品項",
        count.productId,
        count.actual,
        "",
        "移除明細列；本批次歷程保留",
      );
      s.stocktakes = s.stocktakes.filter((entry) => entry !== count);
    }
    return;
  }
  if (action === "end-batch" || action === "submit-batch") {
    if (s.activeModule !== "stocktake") return;
    const batch = s.stocktakeBatches.find(
      (batch) =>
        batch.id === s.selectedStocktakeBatchIds[s.stocktakeWorkspace] &&
        !batch.endedAt,
    );
    if (!batch) return;
    const counts = s.stocktakes.filter((count) => count.batchId === batch.id);
    if (action === "end-batch" && counts.some((count) => !count.completed)) {
      appendBatchOperation(
        s,
        batch,
        "結束批次遭拒",
        "",
        "進行中",
        "進行中",
        "尚有未完成盤點，請先確認調整或移除",
        "拒絕",
      );
      s.notice = "尚有未完成盤點，請先確認調整或移除，再結束批次。";
      return;
    }
    if (
      action === "submit-batch" &&
      (!counts.length ||
        counts.some(
          (count) =>
            !count.confirmed ||
            count.completed ||
            !Number.isSafeInteger(count.actual),
        ))
    ) {
      s.notice = "請手動填妥所有實盤數量並勾選確認盤點。";
      return;
    }
    s.confirmation = {
      action,
      id: batch.id,
      message:
        action === "end-batch"
          ? `結束 ${batch.id}？結束時間將固定記錄，操作歷程仍可查閱。`
          : `確認送出 ${batch.id} 共 ${counts.length} 筆盤點？送出後所有明細鎖定，不能修改或移除。本 Demo 同時更新假庫存。`,
    };
    return;
  }
}
function deleteConfirmed(s: DemoState, id: string) {
  if (s.activeModule === "requisitions") {
    const entry = s.requisitions.find((entry) => String(entry.id) === id);
    if (!entry) return;
    const product = s.otcProducts.find(
      (product) => product.id === entry.productId,
    );
    if (!product) throw new Error("找不到品項，無法回復庫存。");
    product.stock += entry.quantity;
    recordInventoryMovement(s, {
      id: s.nextMovementId++,
      workspace: "OTC",
      productId: product.id,
      type: "領用刪除回復",
      quantity: entry.quantity,
      note: `刪除領用 #${entry.id}`,
      time: new Date().toLocaleString("zh-TW"),
      filledBy: s.currentAccount,
    });
    s.requisitions = s.requisitions.filter((entry) => String(entry.id) !== id);
  } else if (s.activeModule === "vendors")
    s.vendors = s.vendors.filter((entry) => entry.id !== id);
  else if (s.activeModule === "products")
    s.otcProducts = s.otcProducts.filter((entry) => entry.id !== id);
  s.notice = "資料已刪除";
}

// 表單欄位與儲存邏輯由各業務模組明確擁有。
export function editorFields(
  s: DemoState,
  kind: EditorKind,
  id: string | number | null,
): Field[] {
  const existing =
    kind === "requisitions"
      ? s.requisitions.find((entry) => entry.id === id)
      : null;
  if (kind === "stocktake" || kind === "stocktake-correction")
    return [
      {
        name: "actual",
        label: kind === "stocktake" ? "實盤數量" : "更正實盤數量",
        type: "number",
        required: true,
      },
      ...(kind === "stocktake-correction"
        ? [{ name: "correctionReason", label: "更正原因", required: true }]
        : []),
    ];
  if (kind === "requisitions")
    return [
      {
        name: "productId",
        label: "品項",
        required: true,
        options: s.otcProducts
          .filter((p) => p.status === "啟用" || p.id === existing?.productId)
          .map((p) => [p.id, `${p.name}（庫存 ${p.stock} ${p.unit}）`]),
      },
      { name: "person", label: "領用人", required: true },
      { name: "quantity", label: "數量", type: "number", required: true },
      { name: "note", label: "備註" },
    ];
  if (kind === "vendors")
    return [
      { name: "code", label: "廠商代碼" },
      { name: "name", label: "公司名稱", required: true },
      { name: "shortName", label: "簡稱" },
      { name: "contact", label: "聯絡人" },
      { name: "phone", label: "電話", required: true },
      { name: "email", label: "Email", type: "email" },
    ];
  return [
    ...(kind !== "his"
      ? [
          { name: "id", label: "料號", required: true },
          { name: "barcode", label: "國際條碼", required: true },
        ]
      : []),
    { name: "name", label: "名稱", required: true },
    { name: "spec", label: "規格", required: true },
    { name: "unit", label: "單位", required: true },
    ...(kind !== "his"
      ? [
          {
            name: "vendorId",
            label: "廠商",
            required: true,
            options: s.vendors
              .filter(
                (v) =>
                  v.status === "啟用" ||
                  v.id === s.otcProducts.find((p) => p.id === id)?.vendorId,
              )
              .map((v) => [v.id, v.name] as [string, string]),
          },
          { name: "costPrice", label: "成本價", type: "number" },
          { name: "salePrice", label: "售價", type: "number" },
          {
            name: "minStock",
            label: "最低庫存",
            type: "number",
            required: true,
          },
          { name: "activationDate", label: "啟用日期", type: "date" },
          { name: "deactivationDate", label: "停用日期", type: "date" },
        ]
      : []),
    ...(kind === "new-receipt"
      ? [
          {
            name: "quantity",
            label: "入庫數量",
            type: "number",
            required: true,
          },
          { name: "note", label: "入庫備註" },
        ]
      : []),
  ];
}
function openEditor(
  s: DemoState,
  kind: EditorKind,
  id: string | number | null,
  barcode: string,
) {
  const collection =
    kind === "stocktake" || kind === "stocktake-correction"
      ? s.stocktakes
      : kind === "vendors"
        ? s.vendors
        : kind === "his"
          ? s.hisMedicines
          : kind === "requisitions"
            ? s.requisitions
            : s.otcProducts;
  const existing = collection.find((entry) => String(entry.id) === String(id));
  if (id !== null && !existing) {
    s.notice = "找不到這筆資料，請返回列表重新選擇。";
    return;
  }
  if (
    kind === "stocktake" &&
    (s.activeModule !== "stocktake" ||
      !s.stocktakeBatches.some(
        (batch) =>
          batch.id === s.stocktakes.find((c) => c.id === id)?.batchId &&
          !batch.endedAt,
      ) ||
      s.stocktakes.find((c) => c.id === id)?.completed)
  ) {
    s.notice = "此盤點批次已結束，無法編輯。";
    return;
  }
  if (
    kind === "stocktake-correction" &&
    (s.activeModule !== "stocktake-history" ||
      !s.canEditExistingData ||
      !s.stocktakes.find((c) => c.id === id)?.completed)
  ) {
    s.notice = "只有高權限人員可以更正已送出的盤點資料。";
    return;
  }
  const values: Record<string, string> = {};
  const lockedFields: Record<string, string> = {};
  for (const field of editorFields(s, kind, id)) {
    let initial: unknown = existing ? Reflect.get(existing, field.name) : "";
    if (kind === "stocktake-correction" && field.name === "actual") {
      const count = s.stocktakes.find((c) => c.id === id);
      initial = count.correctedActual ?? count.actual;
    }
    if (field.name === "barcode" && !existing) initial = barcode;
    values[field.name] = String(initial ?? "");
    if (
      (field.name === "id" && existing) ||
      (!["stocktake", "stocktake-correction"].includes(kind) &&
        !s.canEditExistingData &&
        values[field.name].trim())
    )
      lockedFields[field.name] = values[field.name];
  }
  s.editor = {
    kind,
    id: existing?.id ?? null,
    unknownBarcode: barcode,
    values,
    lockedFields,
  };
  s.errors.editor = "";
}
function saveEditor(s: DemoState) {
  const editor = s.editor;
  if (!editor) return;
  const { kind, id } = editor;
  const fields = editorFields(s, kind, id);
  const values = Object.fromEntries(
    Object.entries(editor.values).map(([key, value]) => [key, value.trim()]),
  );
  Object.assign(values, editor.lockedFields);
  if (fields.some((field) => field.required && !values[field.name]))
    throw new Error("請填寫所有必填欄位。");
  if (kind === "stocktake" || kind === "stocktake-correction") {
    const count = s.stocktakes.find((count) => count.id === id);
    const actual = Number(values.actual);
    if (!Number.isSafeInteger(actual) || actual < 0 || actual > 1000000)
      throw new Error("實盤數量必須為 0 至 1,000,000 的整數。");
    if (kind === "stocktake-correction") {
      if (!s.canEditExistingData || !count?.completed)
        throw new Error("沒有歷史更正權限，或此筆資料不允許更正。");
      s.stocktakeCorrections.push({
        id: s.stocktakeCorrections.length + 1,
        batchId: count.batchId,
        countId: count.id,
        productId: count.productId,
        time: new Date().toISOString(),
        original: count.actual,
        before: count.correctedActual ?? count.actual,
        after: actual,
        reason: values.correctionReason,
        filledBy: s.currentAccount,
      });
      count.correctedActual = actual;
      count.correctedBy = s.currentAccount;
      s.notice = "歷史更正已保存，原送出紀錄及目前庫存保留。";
    } else {
      const batch = s.stocktakeBatches.find(
        (batch) => batch.id === count?.batchId && !batch.endedAt,
      );
      if (!batch || count.completed)
        throw new Error("此盤點批次已結束，不能儲存。");
      appendBatchOperation(
        s,
        batch,
        "儲存盤點草稿",
        count.productId,
        count.actual,
        actual,
        "保存人工填寫數量，送出前可修改",
      );
      count.actual = actual;
      count.confirmed = false;
      count.filledBy = s.currentAccount;
      s.notice = "盤點草稿已儲存；確認送出前仍可修改。";
    }
    s.editor = null;
    return;
  }
  const collection =
    kind === "vendors"
      ? s.vendors
      : kind === "his"
        ? s.hisMedicines
        : kind === "requisitions"
          ? s.requisitions
          : s.otcProducts;
  const existing = collection.find((entry) => entry.id === id);
  if (
    existing &&
    !s.canEditExistingData &&
    Object.entries(values).some(
      ([key, value]) =>
        String(Reflect.get(existing, key) ?? "").trim() !== "" &&
        String(Reflect.get(existing, key)) !== value,
    )
  )
    throw new Error("修改既有資料需要高權限。");
  if (
    existing &&
    Object.entries(values).every(
      ([key, value]) => String(Reflect.get(existing, key) ?? "") === value,
    )
  ) {
    Object.assign(existing, { filledBy: s.currentAccount });
    s.editor = null;
    s.notice = "填寫人員已記錄，已返回列表。";
    return;
  }
  const price = (name: string) => {
    if (!values[name]) return null;
    const price = Number(values[name]);
    if (
      !/^\d+(\.\d{1,2})?$/.test(values[name]) ||
      !Number.isFinite(price) ||
      price < 0 ||
      price > 1000000
    )
      throw new Error("成本價與售價須為 0 至 1,000,000，最多兩位小數。");
    return price;
  };
  const integer = (name: string, min: number) => {
    const quantity = Number(values[name]);
    if (!Number.isSafeInteger(quantity) || quantity < min || quantity > 1000000)
      throw new Error(`數量必須為 ${min} 至 1,000,000 的整數。`);
    return quantity;
  };
  if (kind === "vendors") {
    if (
      values.code &&
      s.vendors.some((v) => v.id !== id && v.code === values.code)
    )
      throw new Error("廠商代碼已存在，請使用其他代碼或留空。");
    if (existing) {
      recordChanges(s, existing, values, kind);
      Object.assign(existing, values, { filledBy: s.currentAccount });
    } else
      s.vendors.push({
        id: `V${String(s.nextVendorId++).padStart(3, "0")}`,
        code: values.code,
        name: values.name,
        shortName: values.shortName,
        contact: values.contact,
        phone: values.phone,
        email: values.email,
        status: "啟用",
        filledBy: s.currentAccount,
      });
  } else if (kind === "requisitions") {
    const quantity = integer("quantity", 1);
    const product = s.otcProducts.find((p) => p.id === values.productId);
    const old = s.requisitions.find((r) => r.id === id);
    const oldProduct = s.otcProducts.find((p) => p.id === old?.productId);
    if (!product || product.status !== "啟用")
      throw new Error("請選擇啟用品項，停用品項不可新增領用。");
    const available =
      product.stock + (oldProduct === product ? (old?.quantity ?? 0) : 0);
    if (quantity > available)
      throw new Error(`庫存不足，可用數量為 ${available}。`);
    if (old) {
      oldProduct.stock += old.quantity;
      recordInventoryMovement(s, {
        id: s.nextMovementId++,
        workspace: "OTC",
        productId: oldProduct.id,
        type: "領用修改回復",
        quantity: old.quantity,
        note: "回復原領用數量",
        time: new Date().toLocaleString("zh-TW"),
        filledBy: s.currentAccount,
      });
    }
    product.stock -= quantity;
    product.filledBy = s.currentAccount;
    recordInventoryMovement(s, {
      id: s.nextMovementId++,
      workspace: "OTC",
      productId: product.id,
      type: old ? "領用修改" : "領用",
      quantity: -quantity,
      note: values.note || "",
      time: new Date().toLocaleString("zh-TW"),
      filledBy: s.currentAccount,
    });
    const changes = {
      productId: values.productId,
      person: values.person,
      quantity,
      note: values.note,
      filledBy: s.currentAccount,
    };
    if (old) {
      recordChanges(s, old, changes, kind);
      Object.assign(old, changes);
    } else
      s.requisitions.push({
        ...changes,
        id: s.nextRequisitionId++,
        requisitionedAt: new Date().toISOString(),
      });
  } else if (kind === "his") {
    if (existing) {
      recordChanges(s, existing, values, kind);
      Object.assign(existing, values, { filledBy: s.currentAccount });
    }
  } else {
    if (s.otcProducts.some((p) => p.id !== id && p.id === values.id))
      throw new Error("代碼已存在，請使用其他代碼。");
    if (s.otcProducts.some((p) => p.id !== id && p.barcode === values.barcode))
      throw new Error("國際條碼已存在。");
    if (!s.vendors.some((v) => v.id === values.vendorId))
      throw new Error("請先建立廠商。");
    const costPrice = price("costPrice"),
      salePrice = price("salePrice"),
      minStock = integer("minStock", 0);
    for (const name of ["activationDate", "deactivationDate"])
      if (values[name]) {
        const date = new Date(`${values[name]}T00:00:00Z`);
        if (
          Number.isNaN(date.getTime()) ||
          date.toISOString().slice(0, 10) !== values[name]
        )
          throw new Error("請填寫有效的啟用／停用日期。");
      }
    if (
      values.activationDate &&
      values.deactivationDate &&
      values.deactivationDate < values.activationDate
    )
      throw new Error("停用日期不能早於啟用日期。");
    const product = {
      id: values.id,
      barcode: values.barcode,
      name: values.name,
      spec: values.spec,
      unit: values.unit,
      vendorId: values.vendorId,
      costPrice,
      salePrice,
      minStock,
      activationDate: values.activationDate,
      deactivationDate: values.deactivationDate,
      filledBy: s.currentAccount,
    };
    if (kind === "new-receipt") {
      const quantity = integer("quantity", 1);
      let voucher = s.movementVouchers.find(
        (v) => v.id === s.selectedMovementVoucherIds.receipt,
      );
      if (voucher?.submittedAt || voucher?.cancelledAt)
        throw new Error("此傳票已鎖定，請先建立新傳票。");
      voucher ??= createMovementVoucher(s, "receipt");
      s.otcProducts.push({ ...product, stock: 0, status: "啟用" });
      voucher.lines.push({
        productId: product.id,
        quantity,
        note: values.note,
        unitCost: costPrice,
        filledBy: s.currentAccount,
      });
      s.selectedProductId = null;
      s.scanBarcode = "";
    } else if (existing) {
      recordChanges(s, existing, product, kind);
      Object.assign(existing, product);
    } else s.otcProducts.push({ ...product, stock: 0, status: "啟用" });
  }
  s.editor = null;
  s.notice =
    kind === "his"
      ? "模擬回寫成功（未連線 HIS）"
      : kind === "new-receipt"
        ? "品項已新增並加入傳票，整批送出才更新庫存。"
        : "資料已儲存";
}
function recordChanges(
  s: DemoState,
  existing: { id: string | number },
  values: object,
  kind: string,
) {
  for (const [field, after] of Object.entries(values)) {
    const before = Reflect.get(existing, field);
    if (field === "filledBy" || String(before ?? "") === String(after ?? ""))
      continue;
    s.dataChangeRecords.push({
      id: s.dataChangeRecords.length + 1,
      kind,
      recordId: existing.id,
      field,
      before: String(before ?? ""),
      after: String(after ?? ""),
      time: new Date().toISOString(),
      filledBy: s.currentAccount,
      permission: s.canEditExistingData ? "高權限修改" : "補填空白",
    });
  }
}
