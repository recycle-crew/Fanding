import type { FormEvent, MouseEvent } from "react";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { executeWorkspaceCommand } from "@/store/workspace";
import { PageHeading } from "@/components/workspace/PageHeading";

import type { Editor } from "@/types/workspace";
import { ScanPage } from "@/features/inventory/ScanPage";
import { createMovementVoucher } from "@/features/inventory/domain";
import { InventoryFilters } from "@/features/inventory/InventoryFilters";
export function InventoryOperationsPage() {
  const s = useAppSelector((root) => root.workspace);
  const dispatch = useAppDispatch();
  const routeLocation = useLocation();
  const content = useRef<HTMLDivElement>(null);
  const previousEditor = useRef<Editor | null>(null);
  const preview =
    new URLSearchParams(routeLocation.search).get("preview") === "1";
  useEffect(() => {
    const previous = previousEditor.current;
    previousEditor.current = s.editor;
    if (!previous || s.editor || preview) return;
    const action =
      previous.kind === "stocktake-correction"
        ? "correct-count"
        : previous.kind === "stocktake"
          ? "edit-count"
          : "edit";
    const button = Array.from(
      content.current?.querySelectorAll<HTMLButtonElement>("[data-action]") ??
        [],
    ).find(
      (button) =>
        previous.id !== null &&
        button.dataset.id === String(previous.id) &&
        button.dataset.action === action,
    );
    (
      button ||
      (s.activeModule === "receipt"
        ? document.querySelector<HTMLInputElement>("#barcode")
        : null) ||
      document.getElementById("content")
    )?.focus();
  }, [s.editor, preview, s.activeModule]);
  function onSubmit(event: FormEvent<HTMLElement>) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    event.preventDefault();
    const values = Object.fromEntries(
      Array.from(new FormData(form)).map(([key, value]) => [
        key,
        String(value),
      ]),
    );
    if (form.id === "scan-form") {
      dispatch(
        executeWorkspaceCommand({ type: "lookup", barcode: values.barcode }),
      );
      return;
    }
    if (form.id === "movement-form") {
      dispatch(
        executeWorkspaceCommand({
          type: "update",
          update: (d) => {
            d.errors.movement = "";
            try {
              const quantity = Number(values.quantity),
                product = d.otcProducts.find(
                  (p) => p.id === d.selectedProductId,
                );
              if (!product || product.status !== "啟用")
                throw new Error("請選擇啟用品項。");
              if (
                !Number.isSafeInteger(quantity) ||
                quantity <= 0 ||
                quantity > 1000000
              )
                throw new Error("請輸入 1 至 1,000,000 的整數數量。");
              if (d.activeModule === "issue" && !values.note.trim())
                throw new Error("請輸入耗用用途。");
              let voucher = d.movementVouchers.find(
                (v) => v.id === d.selectedMovementVoucherIds[d.activeModule],
              );
              if (voucher?.submittedAt || voucher?.cancelledAt)
                throw new Error("此傳票已鎖定，請建立新傳票。");
              const reserved =
                voucher?.lines
                  .filter((l) => l.productId === product.id)
                  .reduce((sum, l) => sum + l.quantity, 0) ?? 0;
              if (
                d.activeModule === "issue" &&
                quantity + reserved > product.stock
              )
                throw new Error(
                  `庫存不足，目前僅有 ${product.stock}，本傳票已填 ${reserved}。`,
                );
              const unitCost =
                d.activeModule === "receipt"
                  ? values.unitCost.trim() === ""
                    ? (product.costPrice ?? null)
                    : Number(values.unitCost)
                  : null;
              if (
                unitCost != null &&
                (!Number.isFinite(unitCost) ||
                  unitCost < 0 ||
                  unitCost > 1000000 ||
                  Math.abs(unitCost * 100 - Math.round(unitCost * 100)) >
                    0.000001)
              )
                throw new Error("入庫單價須為 0 至 1,000,000，最多兩位小數。");
              voucher ??= createMovementVoucher(d, d.activeModule);
              voucher.lines.push({
                productId: product.id,
                quantity,
                note: values.note.trim(),
                unitCost,
                filledBy: d.currentAccount,
              });
              d.selectedProductId = null;
              d.scanBarcode = "";
              d.notice = "已加入傳票明細，庫存尚未異動。";
            } catch (error) {
              d.errors.movement =
                error instanceof Error ? error.message : String(error);
            }
          },
        }),
      );
      return;
    }
  }
  function onClick(event: MouseEvent<HTMLElement>) {
    const button = (event.target as HTMLElement).closest("button");
    if (!button) return;
    const action = button.dataset.action;
    if (
      ["create-voucher", "submit-voucher", "cancel-voucher"].includes(action)
    ) {
      dispatch(
        executeWorkspaceCommand({
          type: "action",
          action,
          id: button.dataset.id,
        }),
      );
      return;
    }
    if (button.hasAttribute("data-remove-voucher-line")) {
      dispatch(
        executeWorkspaceCommand({
          type: "update",
          update: (d) => {
            const voucher = d.movementVouchers.find(
              (v) => v.id === d.selectedMovementVoucherIds[d.activeModule],
            );
            if (voucher && !voucher.submittedAt && !voucher.cancelledAt)
              voucher.lines.splice(Number(button.dataset.removeVoucherLine), 1);
          },
        }),
      );
      return;
    }
  }
  return (
    <InventoryFilters>
      <div
        ref={content}
        tabIndex={-1}
        onSubmit={onSubmit}
        onClick={onClick}
        onChange={(event) => {
          const target = event.target;
          if (!(
            target instanceof HTMLInputElement ||
            target instanceof HTMLSelectElement
          ))
            return;
          const value = target.value;
          if (target.id === "movement-voucher")
            dispatch(
              executeWorkspaceCommand({
                type: "update",
                update: (d) => {
                  d.selectedMovementVoucherIds[d.activeModule] = value || null;
                  d.selectedProductId = null;
                  d.scanBarcode = "";
                },
              }),
            );
        }}
      >
        <PageHeading />
        <ScanPage />
      </div>
    </InventoryFilters>
  );
}
