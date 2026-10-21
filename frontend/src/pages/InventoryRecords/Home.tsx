import type { MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { executeWorkspaceCommand } from "@/store/workspace";
import { PageHeading } from "@/components/workspace/PageHeading";
import { DataChangeHistory } from "@/components/workspace/DataChangeHistory";
import type { Editor, EditorKind } from "@/types/workspace";
import { ListPage } from "@/features/inventory/render";
import { InventoryFilters } from "@/features/inventory/InventoryFilters";
export function InventoryRecordsPage() {
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
  const [vendorOptions, setVendorOptions] = useState(false);
  const [highlightedVendor, setHighlightedVendor] = useState<string | null>(
    null,
  );
  useEffect(() => {
    setHighlightedVendor(null);
  }, [s.searchTerm]);
  function onClick(event: MouseEvent<HTMLElement>) {
    const button = (event.target as HTMLElement).closest("button");
    if (!button) return;
    const action = button.dataset.action;
    if (button.dataset.vendorOption) {
      dispatch(
        executeWorkspaceCommand({
          type: "update",
          update: (d) => {
            d.searchTerm = button.dataset.vendorOption;
            d.pageRevision++;
          },
        }),
      );
      setVendorOptions(false);
      return;
    }
    if (action === "add" || action === "edit") {
      dispatch(
        executeWorkspaceCommand({
          type: "open-editor",
          kind: s.activeModule as EditorKind,
          ...(action === "edit" ? { id: button.dataset.id } : {}),
        }),
      );
      return;
    }
    if (action === "delete") {
      dispatch(
        executeWorkspaceCommand({
          type: "action",
          action,
          id: button.dataset.id,
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
        onClick={onClick}
        onChange={(event) => {
          const target = event.target;
          if (!(
            target instanceof HTMLInputElement ||
            target instanceof HTMLSelectElement
          ))
            return;
          const value = target.value;
          if (target.id === "vendor-status-filter")
            dispatch(
              executeWorkspaceCommand({
                type: "update",
                update: (d) => {
                  d.vendorStatusFilter = value;
                  d.pageRevision++;
                },
              }),
            );
          if (target.id === "search")
            dispatch(
              executeWorkspaceCommand({
                type: "update",
                update: (d) => {
                  d.searchTerm = value;
                  d.pageRevision++;
                },
              }),
            );
        }}
        onKeyDown={(event) => {
          const target = event.target as HTMLElement;
          const search = target.closest(".vendor-search");
          if (!search) return;
          const options = Array.from(
            search.querySelectorAll<HTMLButtonElement>("[data-vendor-option]"),
          );
          if (event.key === "Escape") {
            event.preventDefault();
            search.querySelector<HTMLInputElement>("#search")?.focus();
            setVendorOptions(false);
          }
          if (
            (event.key === "ArrowDown" || event.key === "ArrowUp") &&
            options.length
          ) {
            event.preventDefault();
            setVendorOptions(true);
            const index = options.indexOf(target as HTMLButtonElement);
            const next =
              index < 0
                ? event.key === "ArrowDown"
                  ? 0
                  : options.length - 1
                : (index +
                    (event.key === "ArrowDown" ? 1 : -1) +
                    options.length) %
                  options.length;
            setHighlightedVendor(options[next].dataset.vendorOption ?? null);
            options[next].focus();
          }
        }}
        onFocus={(event) => {
          if ((event.target as HTMLElement).id === "search")
            setVendorOptions(true);
        }}
        onBlur={(event) => {
          if (!(event.relatedTarget as HTMLElement)?.closest(".vendor-search"))
            setVendorOptions(false);
        }}
      >
        <PageHeading />
        <ListPage
          vendorOptions={vendorOptions}
          highlightedVendor={highlightedVendor}
        />
        <DataChangeHistory />
      </div>
    </InventoryFilters>
  );
}
