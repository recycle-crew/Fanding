import type { ReactNode, FormEvent, MouseEvent } from "react";

import { useAppDispatch } from "@/store/hooks";
import { executeWorkspaceCommand } from "@/store/workspace";

import type { InventoryFilter } from "@/types/workspace";
import { compileInventoryFilter } from "@/helpers/inventoryFilter";
export function InventoryFilters({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
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
    if (
      ![
        "overview-movement-filter",
        "receipt-movement-filter",
        "issue-movement-time-filter",
        "historical-cost-filter",
        "requisition-filter",
      ].includes(form.id)
    )
      return;
    const filters: InventoryFilter = {
      materialNumber: values.materialNumber ?? "",
      person: values.person ?? "",
      ...values,
    };
    try {
      compileInventoryFilter(filters);
    } catch (error) {
      dispatch(
        executeWorkspaceCommand({
          type: "update",
          update: (d) => {
            d.errors.filter =
              error instanceof Error ? error.message : String(error);
          },
        }),
      );
      return;
    }
    dispatch(
      executeWorkspaceCommand({
        type: "update",
        update: (d) => {
          d.errors.filter = "";
          if (form.id === "overview-movement-filter")
            d.overviewMovementFilter = filters;
          if (form.id === "receipt-movement-filter")
            d.receiptMovementFilter = filters;
          if (form.id === "issue-movement-time-filter")
            d.issueMovementTimeFilter = filters;
          if (form.id === "historical-cost-filter")
            d.historicalCostFilter = filters;
          if (form.id === "requisition-filter") d.requisitionFilter = filters;
          d.pageRevision++;
        },
      }),
    );
  }
  function onClick(event: MouseEvent<HTMLElement>) {
    const button = (event.target as HTMLElement).closest("button");
    if (!button) return;
    const action = button.dataset.action;
    if (action?.startsWith("clear-") || action === "reset-overview-filter") {
      dispatch(
        executeWorkspaceCommand({
          type: "update",
          update: (d) => {
            const empty = {
              voucherId: "",
              materialNumber: "",
              person: "",
              start: "",
              end: "",
            };
            if (action === "clear-historical-cost-filter")
              d.historicalCostFilter = empty;
            if (action === "clear-requisition-filter") {
              d.requisitionFilter = empty;
              d.searchTerm = "";
            }
            if (action === "clear-receipt-filter")
              d.receiptMovementFilter = empty;
            if (action === "clear-movement-time")
              d.issueMovementTimeFilter = empty;
            if (action === "reset-overview-filter")
              d.overviewMovementFilter = {
                ...empty,
                date: new Date().toLocaleDateString("sv-SE"),
                product: "",
                action: "",
                workspace: "",
              };
            d.errors.filter = "";
            d.pageRevision++;
          },
        }),
      );
      return;
    }
    if (button.dataset.movementPeriod) {
      // 使用本地日曆推算，跨月、跨年與夏令時間仍維持週一至週日。
      const [unit, relative] = button.dataset.movementPeriod.split("-"),
        offset = relative === "previous" ? -1 : relative === "next" ? 1 : 0;
      const now = new Date();
      const start =
        unit === "month"
          ? new Date(now.getFullYear(), now.getMonth() + offset, 1)
          : new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() - ((now.getDay() + 6) % 7) + offset * 7,
            );
      const end =
        unit === "month"
          ? new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59)
          : new Date(
              start.getFullYear(),
              start.getMonth(),
              start.getDate() + 6,
              23,
              59,
            );
      const local = (date: Date) =>
        `${date.toLocaleDateString("sv-SE")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
      dispatch(
        executeWorkspaceCommand({
          type: "update",
          update: (d) => {
            d.issueMovementTimeFilter = {
              ...d.issueMovementTimeFilter,
              start: local(start),
              end: local(end),
            };
            d.errors.filter = "";
            d.pageRevision++;
          },
        }),
      );
    }
  }
  return (
    <div onSubmit={onSubmit} onClick={onClick}>
      {children}
    </div>
  );
}
