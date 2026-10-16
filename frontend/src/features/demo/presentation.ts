import { useEffect, useRef } from "react";
import { execute, useDemo } from "./store";
import { planningPages } from "../planning/scenes";
import { recordInventoryMovement, startStocktakeBatch } from "./domain";
import type { DemoState, ModuleKey } from "./types";
import type { SceneRequest, SceneResponse } from "../planning/scenes";
const scenes = new Set(
  planningPages.flatMap((page) => page.frames.map((frame) => frame.scene)),
);
// 規劃板縮圖各自使用初始假資料；互動播放器以同一 iframe 延續操作結果。
export function presentScene(s: DemoState, scene: string, preview: boolean) {
  if (!scenes.has(scene)) return;
  s.editor = null;
  s.confirmation = null;
  s.readonlyReason = "";
  s.notice = "";
  s.recovery = scene === "forgot-password";
  s.recoverySent = false;
  s.loggedIn = scene !== "login" && scene !== "forgot-password";
  s.currentAccount = "demo.pharmacy";
  s.searchTerm = "";
  s.vendorStatusFilter = "";
  s.selectedProductId = null;
  s.scanBarcode = "";
  if (!s.loggedIn) return;
  s.activeModule =
    scene === "overview"
      ? "overview"
      : scene.startsWith("vendor-")
        ? "vendors"
        : scene.startsWith("his-")
          ? "his"
          : scene.startsWith("receipt-")
            ? "receipt"
            : scene.startsWith("issue-")
              ? "issue"
              : scene.startsWith("requisition-")
                ? "requisitions"
                : scene === "stocktake-result"
                  ? "stocktake-history"
                  : "stocktake";
  if (scene === "stocktake-his") s.stocktakeWorkspace = "HIS";
  if (["stocktake-otc", "stocktake-edit", "stocktake-confirm"].includes(scene))
    s.stocktakeWorkspace = "OTC";
  // 只在隔離的縮圖中補出結果示例；互動播放器不因切換步驟自動送出。
  if (preview && scene === "his-result")
    s.hisMedicines[0].name = "示例藥品 A（已修改）";
  if (preview && ["receipt-result", "issue-result"].includes(scene)) {
    const quantity = scene === "receipt-result" ? 10 : -3;
    s.otcProducts[0].stock += quantity;
    recordInventoryMovement(s, {
      id: s.nextMovementId++,
      workspace: "OTC",
      productId: "O001",
      type: quantity > 0 ? "入庫" : "耗用",
      quantity,
      note: "結果示例（獨立縮圖）",
      time: "示範操作後",
      filledBy: s.currentAccount,
    });
  }
  if (scene === "vendor-new")
    execute(s, { type: "open-editor", kind: "vendors" });
  if (scene === "vendor-edit")
    execute(s, {
      type: "open-editor",
      kind: "vendors",
      id: s.vendors.length > 5 ? s.vendors.at(-1).id : "V001",
    });
  if (scene === "his-edit")
    execute(s, { type: "open-editor", kind: "his", id: "H001" });
  if (scene === "requisition-new")
    execute(s, { type: "open-editor", kind: "requisitions" });
  if (scene === "requisition-edit")
    execute(s, {
      type: "open-editor",
      kind: "requisitions",
      id: s.requisitions.at(-1)?.id,
    });
  if (scene === "receipt-new") {
    let barcode = "9902999990001";
    while (s.otcProducts.some((p) => p.barcode === barcode))
      barcode = String(Number(barcode) + 1);
    execute(s, { type: "lookup", barcode });
  }
  if (scene === "receipt-known" || scene === "issue-form") {
    execute(s, { type: "lookup", barcode: s.otcProducts[0].barcode });
    s.movementDraft = {
      quantity: scene === "receipt-known" ? "10" : "3",
      note: scene === "receipt-known" ? "示範補貨" : "門診耗用",
      unitCost: "",
    };
  }
  if (
    [
      "stocktake-otc",
      "stocktake-edit",
      "stocktake-his",
      "stocktake-confirm",
    ].includes(scene)
  ) {
    const product = (
      s.stocktakeWorkspace === "HIS" ? s.hisMedicines : s.otcProducts
    )[0];
    const batch = startStocktakeBatch(s, s.stocktakeWorkspace);
    execute(s, { type: "lookup", barcode: product.barcode });
    const count = s.stocktakes.find(
      (c) =>
        c.batchId === batch.id && c.productId === product.id && !c.completed,
    );
    if (scene === "stocktake-edit")
      execute(s, { type: "open-editor", kind: "stocktake", id: count.id });
    if (scene === "stocktake-confirm") {
      count.actual = Math.max(0, count.book - 2);
      count.confirmed = true;
      execute(s, { type: "action", action: "submit-batch" });
    }
  }
  if (s.editor) {
    const defaults: Record<string, string> =
      scene === "vendor-new"
        ? {
            code: `V${String(s.vendors.length + 1).padStart(3, "0")}`,
            name: "新晴醫材（展示）",
            contact: "展示聯絡人",
            phone: "02-0000-0200",
            email: "demo@example.test",
          }
        : scene === "requisition-new"
          ? {
              productId: "O001",
              person: "展示護理師",
              quantity: "4",
              note: "流程示範",
            }
          : {};
    if (defaults.code) {
      let suffix = s.vendors.length + 1;
      // 已刪除資料可能留下被使用的代碼，選擇下一個可用代碼。
      while (s.vendors.some((v) => v.code === defaults.code))
        defaults.code = `V${String(++suffix).padStart(3, "0")}`;
    }
    Object.assign(s.editor.values, defaults);
    Object.assign(s.editor.lockedFields, defaults);
  }
  if (scene.endsWith("result") && !preview)
    s.notice = "目前顯示當次操作資料；切換畫面不會自動儲存或調整庫存。";
}
export function usePresentation() {
  const { state, dispatch } = useDemo();
  const current = useRef(state);
  current.current = state;
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("embed") !== "1") return;
    const preview = params.get("preview") === "1",
      initial = params.get("scene");
    if (initial)
      dispatch({
        type: "update",
        update: (s) => presentScene(s, initial, preview),
      });
    if (preview) return;
    const respond = (message: SceneResponse) =>
      window.parent.postMessage(message, "*");
    const listener = (event: MessageEvent<SceneRequest>) => {
      if (event.source !== window.parent || window.parent === window) return;
      const request = event.data;
      if (!request || typeof request !== "object") return;
      if (request.type === "fangding-dismiss-form") {
        dispatch({
          type: "update",
          update: (s) => {
            s.readonlyReason = "";
            s.editor = null;
            s.confirmation = null;
            if (s.activeModule === "receipt" || s.activeModule === "issue") {
              s.selectedProductId = null;
              s.scanBarcode = "";
            }
          },
        });
        return;
      }
      if (
        request.type !== "fangding-request-scene" ||
        !scenes.has(request.scene) ||
        typeof request.requestId !== "number"
      )
        return;
      const s = current.current;
      const quantity = s.selectedProductId ? s.movementDraft.quantity : "";
      if (s.editor || s.confirmation || s.readonlyReason || quantity) {
        respond({
          type: "fangding-scene-result",
          requestId: request.requestId,
          accepted: false,
          reason: "請先儲存、確認或取消目前的表單，再切換畫面。",
        });
        return;
      }
      dispatch({
        type: "update",
        update: (s) => presentScene(s, request.scene, false),
      });
      respond({
        type: "fangding-scene-result",
        requestId: request.requestId,
        accepted: true,
      });
    };
    window.addEventListener("message", listener);
    respond({ type: "fangding-demo-ready" });
    return () => window.removeEventListener("message", listener);
  }, []);
}
