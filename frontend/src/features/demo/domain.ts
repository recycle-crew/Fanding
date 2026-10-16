import type { DemoState, Batch, Workspace, Voucher, Movement } from "./types";
// 批次操作紀錄保存當次快照，移除盤點列也不刪除歷程。
export function appendBatchOperation(
  s: DemoState,
  batch: Batch,
  operation: string,
  productId: string,
  before: unknown,
  after: unknown,
  detail: string,
  outcome = "成功",
) {
  s.stocktakeOperations.push({
    id: s.nextStocktakeOperationId++,
    batchId: batch.id,
    time: new Date().toISOString(),
    operation,
    productId,
    before: String(before ?? ""),
    after: String(after ?? ""),
    detail,
    outcome,
    filledBy: s.currentAccount,
  });
}
export function startStocktakeBatch(s: DemoState, workspace: Workspace) {
  const active = s.stocktakeBatches.find(
    (batch) => batch.workspace === workspace && !batch.endedAt,
  );
  if (active) {
    s.selectedStocktakeBatchIds[workspace] = active.id;
    return active;
  }
  const month = new Date();
  const batch: Batch = {
    id: `ST${String(s.nextStocktakeBatchId++).padStart(4, "0")}`,
    name: `${month.getFullYear()} 年 ${month.getMonth() + 1} 月盤點紀錄`,
    workspace,
    startedAt: new Date().toISOString(),
    endedAt: null,
    startedBy: s.currentAccount,
    endedBy: null,
  };
  s.stocktakeBatches.push(batch);
  s.selectedStocktakeBatchIds[workspace] = batch.id;
  appendBatchOperation(
    s,
    batch,
    "開始盤點",
    "",
    "",
    "進行中",
    "批次開始，固定記錄開始時間",
  );
  return batch;
}
// 出入庫共用每日三碼流水號；編號在建立時固定，取消或結束均不回收。
export function createMovementVoucher(s: DemoState, direction: string) {
  if (!["receipt", "issue"].includes(direction))
    throw new Error("請選擇入庫或出庫作業。");
  const today = new Date();
  const date = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const sequence =
    s.movementVouchers
      .filter((voucher) => voucher.id.startsWith(date))
      .reduce(
        (maximum, voucher) => Math.max(maximum, Number(voucher.id.slice(8))),
        0,
      ) + 1;
  if (sequence > 999)
    throw new Error("今日傳票三碼流水號已用完（999），無法建立新傳票。");
  const voucher: Voucher = {
    id: `${date}${String(sequence).padStart(3, "0")}`,
    direction,
    createdAt: today.toISOString(),
    createdBy: s.currentAccount,
    submittedAt: null,
    lines: [],
  };
  s.movementVouchers.push(voucher);
  s.selectedMovementVoucherIds[direction] = voucher.id;
  return voucher;
}
// 整批先驗證再更新，避免出庫不足時只完成部分明細。
export function submitMovementVoucher(s: DemoState, voucher: Voucher) {
  if (
    !voucher ||
    voucher.submittedAt ||
    voucher.cancelledAt ||
    !voucher.lines.length
  )
    throw new Error("請先加入明細，或此傳票已鎖定。");
  const quantities = new Map<string, number>();
  for (const line of voucher.lines) {
    if (
      !Number.isSafeInteger(line.quantity) ||
      line.quantity <= 0 ||
      line.quantity > 1000000
    )
      throw new Error("傳票明細數量必須為 1 至 1,000,000 的整數。");
    if (
      voucher.direction === "receipt" &&
      line.unitCost != null &&
      (!Number.isFinite(line.unitCost) ||
        line.unitCost < 0 ||
        line.unitCost > 1000000 ||
        Math.abs(line.unitCost * 100 - Math.round(line.unitCost * 100)) >
          0.000001)
    )
      throw new Error("入庫單價須為 0 至 1,000,000，最多兩位小數。");
    if (voucher.direction === "issue" && !line.note.trim())
      throw new Error("出庫明細須填寫用途。");
    const product = s.otcProducts.find(
      (product) => product.id === line.productId,
    );
    if (!product || product.status !== "啟用")
      throw new Error(`料號 ${line.productId} 未啟用，無法送出。`);
    quantities.set(
      product.id,
      (quantities.get(product.id) ?? 0) + line.quantity,
    );
  }
  for (const [productId, quantity] of quantities) {
    const product = s.otcProducts.find((product) => product.id === productId);
    if (voucher.direction === "issue" && quantity > product.stock)
      throw new Error(
        `料號 ${productId} 庫存不足，目前僅有 ${product.stock}。`,
      );
  }
  const submittedAt = new Date().toISOString();
  for (const line of voucher.lines) {
    const product = s.otcProducts.find(
      (product) => product.id === line.productId,
    );
    const change =
      voucher.direction === "receipt" ? line.quantity : -line.quantity;
    if (voucher.direction === "receipt") {
      line.productName = product.name;
      line.unit = product.unit;
    }
    product.stock += change;
    product.filledBy = s.currentAccount;
    recordInventoryMovement(s, {
      id: s.nextMovementId++,
      voucherId: voucher.id,
      unitCost: line.unitCost ?? null,
      workspace: "OTC",
      productId: product.id,
      type: change > 0 ? "入庫" : "耗用",
      quantity: change,
      note: line.note,
      time: new Date(submittedAt).toLocaleString("zh-TW"),
      filledBy: s.currentAccount,
    });
  }
  voucher.submittedAt = submittedAt;
  voucher.submittedBy = s.currentAccount;
}
export function recordInventoryMovement(s: DemoState, movement: Movement) {
  s.movements.push({
    ...movement,
    recordedAt: new Date().toISOString(),
  });
  const product = (
    movement.workspace === "HIS" ? s.hisMedicines : s.otcProducts
  ).find((product) => product.id === movement.productId);
  for (const batch of s.stocktakeBatches.filter(
    (batch) => batch.workspace === movement.workspace && !batch.endedAt,
  )) {
    const after = product?.stock;
    appendBatchOperation(
      s,
      batch,
      movement.type,
      movement.productId,
      after === undefined ? "" : after - movement.quantity,
      after,
      movement.note,
    );
  }
}
