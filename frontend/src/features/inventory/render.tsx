import { BaseLabel } from "@/components/ui/BaseLabel";
import { BaseInput } from "@/components/ui/BaseInput";
import { BaseCard } from "@/components/ui/BaseCard";
import {
  BaseNativeSelect,
  BaseNativeSelectOption,
} from "@/components/ui/BaseNativeSelect";
import { BaseButton } from "@/components/ui/BaseButton";
import { useAppSelector } from "@/store/hooks";
import { BaseBadge } from "@/components/ui/BaseBadge";
import { BaseFilterForm } from "@/components/ui/BaseFilterForm";
import React from "react";
import { BaseDataTable } from "@/components/ui/BaseDataTable";
import {
  compileInventoryFilter,
  matchesInventoryFilter,
} from "@/helpers/inventoryFilter";
import type {
  WorkspaceState,
  InventoryFilter,
  Product,
  Vendor,
  Requisition,
} from "@/types/workspace";

type DisplayRecord = {
  id: string | number;
} & Partial<Omit<Product, "id"> & Omit<Vendor, "id"> & Omit<Requisition, "id">>;
function renderInventoryIdentityFilters(
  filters: InventoryFilter,
  people: string[],
  listId: string,
  personLabel = "人員",
  voucherIds: string[] | null = null,
) {
  return (
    <>
      {voucherIds ? (
        <>
          <BaseLabel>
            {"批次／傳票編號"}
            <BaseInput
              name={"voucherId"}
              list={String(listId) + "-batches"}
              placeholder={"所有批次，可輸入日期或傳票編號"}
              defaultValue={String(filters.voucherId ?? "")}
              autoComplete={"off"}
              inputMode={"numeric"}
            />
          </BaseLabel>
          <datalist id={String(listId) + "-batches"}>
            {React.Children.toArray(
              [...new Set(voucherIds.filter(Boolean))]
                .sort()
                .reverse()
                .map((voucherId, rowIndex) => (
                  <React.Fragment key={rowIndex}>
                    <BaseNativeSelectOption
                      value={String(voucherId ?? "")}
                    ></BaseNativeSelectOption>
                  </React.Fragment>
                )),
            )}
          </datalist>
        </>
      ) : (
        ""
      )}
      <BaseLabel>
        {"料號"}
        <BaseInput
          name={"materialNumber"}
          placeholder={"所有料號"}
          defaultValue={String(filters.materialNumber ?? "")}
        />
      </BaseLabel>
      <BaseLabel>
        {String(personLabel ?? "")}
        <BaseInput
          name={"person"}
          list={listId}
          placeholder={"所有人員"}
          autoComplete={"off"}
          defaultValue={String(filters.person ?? "")}
        />
      </BaseLabel>
      <datalist id={listId}>
        {React.Children.toArray(
          [...new Set(people.filter(Boolean))].map((person, rowIndex) => (
            <React.Fragment key={rowIndex}>
              <BaseNativeSelectOption
                value={String(person ?? "")}
              ></BaseNativeSelectOption>
            </React.Fragment>
          )),
        )}
      </datalist>
    </>
  );
}
export function MovementsTable() {
  const state = useAppSelector((root) => root.workspace);
  const {
    hisMedicines,
    otcProducts,
    movements,
    activeModule,
    canEditExistingData,
    issueMovementTimeFilter,
    receiptMovementFilter,
    issueMovementView,
    overviewMovementFilter,
  } = state;
  const filter = compileInventoryFilter(
    activeModule === "overview"
      ? overviewMovementFilter
      : activeModule === "receipt"
        ? receiptMovementFilter
        : issueMovementTimeFilter,
  );
  const visible = movements
    .filter((movement) => {
      if (
        !matchesInventoryFilter(
          {
            voucherId: movement.voucherId,
            materialNumber: movement.productId,
            person: movement.filledBy ?? "未記錄",
            timestamp: movement.recordedAt,
          },
          filter,
        )
      )
        return false;
      if (activeModule === "overview") {
        return (
          (!overviewMovementFilter.product ||
            `${movement.workspace}:${movement.productId}` ===
              overviewMovementFilter.product) &&
          (!overviewMovementFilter.action ||
            movement.type === overviewMovementFilter.action) &&
          (!overviewMovementFilter.workspace ||
            movement.workspace === overviewMovementFilter.workspace)
        );
      }
      if (movement.workspace !== "OTC") return false;
      if (activeModule !== "issue") return true;
      if (issueMovementView === "outbound" && movement.quantity >= 0)
        return false;
      if (issueMovementView === "inbound" && movement.quantity <= 0)
        return false;
      return true;
    })
    .slice()
    .reverse();
  return (
    <BaseDataTable
      headers={[
        "時間",
        "傳票編號",
        "工作區",
        "品項",
        "料號",
        "動作",
        "數量變化",
        "備註",
        "填寫人員",
      ]}
      rows={visible.map((movement) => {
        const product = (
          movement.workspace === "HIS" ? hisMedicines : otcProducts
        ).find((product) => product.id === movement.productId);
        return [
          String(movement.time ?? ""),
          String(movement.voucherId ?? "未建立"),
          String(movement.workspace ?? ""),
          String(product?.name ?? movement.productId),
          String(movement.productId ?? ""),
          String(movement.type ?? ""),
          <>
            <span className={movement.quantity >= 0 ? "positive" : "negative"}>
              {movement.quantity > 0 ? "+" : ""}
              {movement.quantity}
            </span>
          </>,
          String(movement.note ?? ""),
          String(movement.filledBy ?? "未記錄"),
        ];
      })}
      editableColumns={null}
      tableKey={`${activeModule}-movements`}
      privileged={canEditExistingData}
    />
  );
}
export function OverviewMovements() {
  const state = useAppSelector((root) => root.workspace);
  const { hisMedicines, otcProducts, movements, overviewMovementFilter } =
    state;
  if (overviewMovementFilter.date === null) {
    const today = new Date();
  }
  const products = [
    ...hisMedicines.map((product) => ({
      ...product,
      workspace: "HIS",
    })),
    ...otcProducts.map((product) => ({
      ...product,
      workspace: "OTC",
    })),
  ];
  const actions = [
    ...new Set([
      "入庫",
      "耗用",
      "領用",
      "領用修改",
      "領用修改回復",
      "領用刪除回復",
      "盤點送出調整",
      ...movements.map((movement) => movement.type),
    ]),
  ];
  return (
    <>
      <BaseCard variant="panel">
        <h3>{"庫存總覽"}</h3>
        <BaseFilterForm
          id={"overview-movement-filter"}
          className={"overview-movement-filter"}
          initial={overviewMovementFilter}

          filterFields={
            <>
              {renderInventoryIdentityFilters(
                overviewMovementFilter,
                movements.map((movement) => movement.filledBy ?? "未記錄"),
                "overview-filter-people",
                "人員",
                movements.map((movement) => movement.voucherId),
              )}
              <BaseLabel>
                {"日期"}
                <BaseInput
                  type={"date"}
                  name={"date"}
                  defaultValue={String(overviewMovementFilter.date ?? "")}
                />
              </BaseLabel>
              <BaseLabel>
                {"品項"}
                <BaseNativeSelect name={"product"}>
                  <BaseNativeSelectOption value={""}>
                    {"所有"}
                  </BaseNativeSelectOption>
                  {products.map((product, rowIndex) => {
                    const key = `${product.workspace}:${product.id}`;
                    return (
                      <React.Fragment key={rowIndex}>
                        <BaseNativeSelectOption value={String(key ?? "")}>
                          {String(
                            `${product.workspace} · ${product.id} ${product.name}`,
                          )}
                        </BaseNativeSelectOption>
                      </React.Fragment>
                    );
                  })}
                </BaseNativeSelect>
              </BaseLabel>
              <BaseLabel>
                {"動作"}
                <BaseNativeSelect name={"action"}>
                  <BaseNativeSelectOption value={""}>
                    {"所有"}
                  </BaseNativeSelectOption>
                  {React.Children.toArray(
                    actions.map((action, rowIndex) => (
                      <React.Fragment key={rowIndex}>
                        <BaseNativeSelectOption value={String(action ?? "")}>
                          {String(action ?? "")}
                        </BaseNativeSelectOption>
                      </React.Fragment>
                    )),
                  )}
                </BaseNativeSelect>
              </BaseLabel>
              <BaseLabel>
                {"工作區"}
                <BaseNativeSelect name={"workspace"}>
                  <BaseNativeSelectOption value={""}>
                    {"所有"}
                  </BaseNativeSelectOption>
                  {React.Children.toArray(
                    ["HIS", "OTC"].map((workspace, rowIndex) => (
                      <React.Fragment key={rowIndex}>
                        <BaseNativeSelectOption value={workspace}>
                          {workspace}
                        </BaseNativeSelectOption>
                      </React.Fragment>
                    )),
                  )}
                </BaseNativeSelect>
              </BaseLabel>
              <BaseButton variant="primary" type={"submit"}>
                {"搜尋"}
              </BaseButton>
              <BaseButton
                variant="outline"
                type={"button"}
                data-action={"reset-overview-filter"}
              >
                {"重設為當日所有"}
              </BaseButton>
            </>
          }
        />
        <p className={"small"}>
          {
            "預設查詢當日所有品項、動作及工作區。進銷存以批次查詢為主；輸入批次會清除日期限制，可再指定日期縮小範圍。"
          }
        </p>
        <div id={"overview-movements-table"}>{<MovementsTable />}</div>
      </BaseCard>
    </>
  );
}
export function ListPage({
  vendorOptions = false,
  highlightedVendor = null,
}: {
  vendorOptions?: boolean;
  highlightedVendor?: string | null;
}) {
  const state = useAppSelector((root) => root.workspace);
  const {
    vendors,
    hisMedicines,
    otcProducts,
    requisitions,
    activeModule,
    canEditExistingData,
    searchTerm,
    vendorStatusFilter,
    requisitionFilter,
  } = state;
  const collection: DisplayRecord[] =
    activeModule === "vendors"
      ? vendors
      : activeModule === "his"
        ? hisMedicines
        : activeModule === "products"
          ? otcProducts
          : requisitions;
  const inventoryFilter =
    activeModule === "requisitions"
      ? compileInventoryFilter(requisitionFilter)
      : null;
  const filtered = collection.filter((entry) => {
    const matchesSearch =
      Object.values(entry).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase()),
      ) ||
      (activeModule === "requisitions" &&
        otcProducts
          .find((product) => product.id === entry.productId)
          ?.name.includes(searchTerm));
    if (activeModule === "requisitions") {
      if (
        !matchesInventoryFilter(
          {
            materialNumber: entry.productId,
            person: entry.person,
            timestamp: entry.requisitionedAt,
          },
          inventoryFilter,
        )
      )
        return false;
    }
    return (
      matchesSearch &&
      (activeModule !== "vendors" ||
        !vendorStatusFilter ||
        entry.status === vendorStatusFilter)
    );
  });
  let headers;
  const rows = filtered.map((entry) => {
    const status = (
      <>
        <BaseBadge variant={entry.status === "停用" ? "muted" : "secondary"}>
          {String(entry.status ?? "")}
        </BaseBadge>
      </>
    );
    const actions = (
      <>
        <div className={"actions"}>
          <BaseButton
            variant="outline"
            data-action={"edit"}
            data-id={String(entry.id ?? "")}
          >
            {"編輯"}
          </BaseButton>
          {activeModule === "his" ? (
            ""
          ) : (
            <>
              <BaseButton
                variant="outline"
                data-action={"delete"}
                data-id={String(entry.id ?? "")}
              >
                {"刪除"}
              </BaseButton>
            </>
          )}
        </div>
      </>
    );
    if (activeModule === "vendors") {
      headers = [
        "代碼",
        "公司名稱",
        "簡稱",
        "聯絡人",
        "電話",
        "Email",
        "狀態",
        "填寫人員",
        "操作",
      ];
      return [
        entry.code ?? "",
        entry.name,
        entry.shortName ?? "",
        entry.contact,
        entry.phone,
        entry.email,
      ]
        .map<React.ReactNode>((value) => String(value ?? ""))
        .concat(status, String(entry.filledBy ?? "未記錄"), actions);
    }
    if (activeModule === "requisitions") {
      headers = [
        "編號",
        "領用時間",
        "品項",
        "料號",
        "領用人",
        "數量",
        "備註",
        "填寫人員",
        "操作",
      ];
      return [
        String(entry.id),
        entry.requisitionedAt
          ? new Date(entry.requisitionedAt).toLocaleString("zh-TW")
          : "未記錄",
        otcProducts.find((product) => product.id === entry.productId)?.name,
        entry.productId,
        entry.person,
        entry.quantity,
        entry.note,
      ]
        .map<React.ReactNode>((value) => String(value ?? ""))
        .concat(String(entry.filledBy ?? "未記錄"), actions);
    }
    headers =
      activeModule === "his"
        ? [
            "藥品代碼",
            "名稱",
            "規格",
            "單位",
            "庫存",
            "狀態",
            "填寫人員",
            "操作",
          ]
        : [
            "料號",
            "國際條碼",
            "名稱",
            "規格",
            "單位",
            "廠商",
            "成本價",
            "售價",
            "庫存",
            "最低庫存",
            "啟用日期",
            "停用日期",
            "狀態",
            "填寫人員",
            "操作",
          ];
    const cells =
      activeModule === "his"
        ? [entry.id, entry.name, entry.spec, entry.unit]
        : [
            entry.id,
            entry.barcode,
            entry.name,
            entry.spec,
            entry.unit,
            vendors.find((vendor) => vendor.id === entry.vendorId)?.name,
            entry.costPrice === null || entry.costPrice === undefined
              ? "未填寫"
              : Number(entry.costPrice).toFixed(2),
            entry.salePrice === null || entry.salePrice === undefined
              ? "未填寫"
              : Number(entry.salePrice).toFixed(2),
          ];
    return cells
      .map<React.ReactNode>((value) => String(value ?? ""))
      .concat(
        <>
          {entry.status === "啟用" &&
          entry.stock < (activeModule === "his" ? 20 : entry.minStock) ? (
            <BaseBadge variant="warning">{entry.stock}</BaseBadge>
          ) : (
            entry.stock
          )}
        </>,
        ...(activeModule === "products"
          ? [
              String(entry.minStock ?? ""),
              String(entry.activationDate || "未填寫"),
              String(entry.deactivationDate || "未填寫"),
            ]
          : []),
        status,
        String(entry.filledBy ?? "未記錄"),
        actions,
      );
  });
  // 空結果也保留各模組的欄位。
  headers ??=
    activeModule === "vendors"
      ? [
          "代碼",
          "公司名稱",
          "簡稱",
          "聯絡人",
          "電話",
          "Email",
          "狀態",
          "填寫人員",
          "操作",
        ]
      : activeModule === "requisitions"
        ? [
            "編號",
            "領用時間",
            "品項",
            "料號",
            "領用人",
            "數量",
            "備註",
            "填寫人員",
            "操作",
          ]
        : activeModule === "his"
          ? [
              "藥品代碼",
              "名稱",
              "規格",
              "單位",
              "庫存",
              "狀態",
              "填寫人員",
              "操作",
            ]
          : [
              "料號",
              "國際條碼",
              "名稱",
              "規格",
              "單位",
              "廠商",
              "成本價",
              "售價",
              "庫存",
              "最低庫存",
              "啟用日期",
              "停用日期",
              "狀態",
              "填寫人員",
              "操作",
            ];
  const editableColumns =
    activeModule === "vendors"
      ? ["代碼", "公司名稱", "簡稱", "聯絡人", "電話", "Email"]
      : activeModule === "requisitions"
        ? ["品項", "領用人", "數量", "備註"]
        : activeModule === "his"
          ? ["名稱", "規格", "單位"]
          : [
              "國際條碼",
              "名稱",
              "規格",
              "單位",
              "廠商",
              "成本價",
              "售價",
              "最低庫存",
              "啟用日期",
              "停用日期",
            ];
  return (
    <>
      <BaseCard variant="panel" className="list-panel">
        <div className={"toolbar"}>
          <div
            className={
              "search-control " +
              String(activeModule === "vendors" ? "vendor-search" : "")
            }
          >
            <BaseInput
              id={"search"}
              type={"search"}
              aria-label={"搜尋資料"}
              placeholder={"搜尋代碼、名稱或相關資訊…"}
              value={searchTerm}
              onChange={() => {}}
              autoComplete={"off"}
              role={activeModule === "vendors" ? "combobox" : undefined}
              aria-autocomplete={
                activeModule === "vendors" ? "list" : undefined
              }
              aria-controls={
                activeModule === "vendors" ? "vendor-options" : undefined
              }
              aria-expanded={
                activeModule === "vendors" ? vendorOptions : undefined
              }
            />
            {activeModule === "vendors" ? (
              <>
                <div
                  id={"vendor-options"}
                  className={"vendor-options"}
                  hidden={!vendorOptions}
                  role={"listbox"}
                  aria-label={"廠商搜尋選項"}
                >
                  {filtered.length ? (
                    React.Children.toArray(
                      filtered.slice(0, 5).map((vendor, rowIndex) => (
                        <React.Fragment key={rowIndex}>
                          <BaseButton
                            variant="outline"
                            type={"button"}
                            role={"option"}
                            aria-selected={vendor.id === highlightedVendor}
                            data-vendor-option={String(vendor.id ?? "")}
                          >
                            <span>{String(vendor.code || "未填代碼")}</span>{" "}
                            {String(vendor.name ?? "")}
                            {vendor.shortName ? (
                              <>
                                {" "}
                                <span>
                                  {"（"}
                                  {String(vendor.shortName ?? "")}
                                  {"）"}
                                </span>
                              </>
                            ) : (
                              ""
                            )}
                          </BaseButton>
                        </React.Fragment>
                      )),
                    )
                  ) : (
                    <>
                      <p className={"empty"}>{"沒有符合的廠商"}</p>
                    </>
                  )}
                </div>
              </>
            ) : (
              ""
            )}
          </div>
          {activeModule === "vendors" ? (
            <>
              <BaseLabel className={"vendor-filter"}>
                {"廠商狀態"}
                <BaseNativeSelect
                  id={"vendor-status-filter"}
                  value={vendorStatusFilter}
                  onChange={() => {}}
                >
                  <BaseNativeSelectOption value={""}>
                    {"全部狀態"}
                  </BaseNativeSelectOption>
                  {React.Children.toArray(
                    ["啟用", "停用"].map((status, rowIndex) => (
                      <React.Fragment key={rowIndex}>
                        <BaseNativeSelectOption value={status}>
                          {status}
                        </BaseNativeSelectOption>
                      </React.Fragment>
                    )),
                  )}
                </BaseNativeSelect>
              </BaseLabel>
            </>
          ) : (
            ""
          )}
          <span className={"muted small"}>
            {filtered.length}
            {" 筆資料"}
          </span>
        </div>
        {activeModule === "requisitions" ? (
          <>
            <BaseFilterForm
              id={"requisition-filter"}
              className={"overview-movement-filter"}
              initial={requisitionFilter}

              filterFields={
                <>
                  {renderInventoryIdentityFilters(
                    requisitionFilter,
                    requisitions.map((entry) => entry.person),
                    "requisition-filter-people",
                    "領用人",
                  )}
                  <BaseLabel>
                    {"開始時間"}
                    <BaseInput
                      name={"start"}
                      type={"datetime-local"}
                      step={"60"}
                      defaultValue={String(requisitionFilter.start ?? "")}
                    />
                  </BaseLabel>
                  <BaseLabel>
                    {"結束時間"}
                    <BaseInput
                      name={"end"}
                      type={"datetime-local"}
                      step={"60"}
                      defaultValue={String(requisitionFilter.end ?? "")}
                    />
                  </BaseLabel>
                  <BaseButton variant="primary" type={"submit"}>
                    {"搜尋"}
                  </BaseButton>
                  <BaseButton
                    variant="outline"
                    type={"button"}
                    data-action={"clear-requisition-filter"}
                  >
                    {"清除條件"}
                  </BaseButton>
                </>
              }
            />
            <p
              id={"requisition-filter-error"}
              className={"error"}
              role={"alert"}
            >
              {state.errors.filter}
            </p>
          </>
        ) : (
          ""
        )}
        <p className={"field-hint"}>
          {canEditExistingData
            ? "高權限可修改既有資料，修改會記錄歷程；料號及狀態仍為唯讀。"
            : "按「編輯」補填空白欄位；已有值與狀態均為唯讀。"}
          {"庫存透過作業更新。"}
        </p>
        <div id={"list-table"}>
          {
            <BaseDataTable
              headers={headers}
              rows={rows}
              editableColumns={editableColumns}
              tableKey={`list-${activeModule}`}
              privileged={canEditExistingData}
            />
          }
        </div>
      </BaseCard>
    </>
  );
}
// 歷史成本只採已送出的入庫快照；以整數分累計金額，最後才四捨五入。
export function HistoricalCostsPage() {
  const state = useAppSelector((root) => root.workspace);
  const {
    otcProducts,
    canEditExistingData,
    historicalCostFilter,
    movementVouchers,
  } = state;
  const filter = compileInventoryFilter(historicalCostFilter);
  const postedReceipts = movementVouchers.filter(
    (voucher) =>
      voucher.direction === "receipt" &&
      voucher.submittedAt &&
      !voucher.cancelledAt,
  );
  const receiptLines = postedReceipts
    .flatMap((voucher) =>
      voucher.lines.map((line) => ({
        ...line,
        voucherId: voucher.id,
        submittedAt: voucher.submittedAt,
        submittedBy: voucher.submittedBy,
      })),
    )
    .filter((line) =>
      matchesInventoryFilter(
        {
          voucherId: line.voucherId,
          materialNumber: line.productId,
          person: line.submittedBy,
          timestamp: line.submittedAt,
        },
        filter,
      ),
    );
  const totals = new Map<
    string,
    {
      productId: string;
      name: string;
      quantity: number;
      amountCents: bigint;
      missing: number;
      vouchers: Set<string>;
    }
  >();
  for (const line of receiptLines) {
    let total = totals.get(line.productId);
    if (!total) {
      total = {
        productId: line.productId,
        name:
          line.productName ??
          otcProducts.find((product) => product.id === line.productId)?.name,
        quantity: 0,
        amountCents: 0n,
        missing: 0,
        vouchers: new Set(),
      };
      totals.set(line.productId, total);
    }
    total.quantity += line.quantity;
    total.vouchers.add(line.voucherId);
    if (line.unitCost == null) total.missing++;
    else
      total.amountCents +=
        BigInt(Math.round(line.unitCost * 100)) * BigInt(line.quantity);
  }
  const summaryRows = [...totals.values()].map((total) => {
    const divisor = BigInt(total.quantity);
    const averageCents = (total.amountCents + divisor / 2n) / divisor;
    return [
      String(total.productId ?? ""),
      String(total.name ?? ""),
      String(total.vouchers.size),
      String(total.quantity),
      total.missing
        ? "資料不完整"
        : `${total.amountCents / 100n}.${String(total.amountCents % 100n).padStart(2, "0")}`,
      total.missing ? "待補完整成本" : (Number(averageCents) / 100).toFixed(2),
      total.missing ? `缺 ${total.missing} 筆單價` : "完整",
    ];
  });
  return (
    <>
      <BaseCard variant="panel">
        <BaseFilterForm
          id={"historical-cost-filter"}
          className={"overview-movement-filter"}
          initial={historicalCostFilter}

          filterFields={
            <>
              {renderInventoryIdentityFilters(
                historicalCostFilter,
                postedReceipts.map((voucher) => voucher.submittedBy),
                "historical-cost-people",
                "送出人員",
                postedReceipts.map((voucher) => voucher.id),
              )}
              <BaseLabel>
                {"開始時間"}
                <BaseInput
                  type={"datetime-local"}
                  name={"start"}
                  defaultValue={String(historicalCostFilter.start ?? "")}
                />
              </BaseLabel>
              <BaseLabel>
                {"結束時間"}
                <BaseInput
                  type={"datetime-local"}
                  name={"end"}
                  defaultValue={String(historicalCostFilter.end ?? "")}
                />
              </BaseLabel>
              <BaseButton variant="primary" type={"submit"}>
                {"搜尋"}
              </BaseButton>
              <BaseButton
                variant="outline"
                type={"button"}
                data-action={"clear-historical-cost-filter"}
              >
                {"清除條件"}
              </BaseButton>
            </>
          }
        />
        <p id={"historical-cost-error"} className={"error"} role={"alert"}>
          {state.errors.filter}
        </p>
        <p className={"field-hint"}>
          {
            "依目前查詢範圍計算：歷史平均成本價＝入庫總金額 ÷ 入庫總數量（數量加權平均）。僅計已送出入庫傳票；出庫、取消及草稿不納入。缺少單價時不顯示平均價。"
          }
        </p>
        <h3>{"各料號歷史平均成本價"}</h3>
        {
          <BaseDataTable
            headers={[
              "料號",
              "品項",
              "入庫傳票數",
              "入庫總數量",
              "入庫總金額",
              "歷史平均成本價",
              "成本資料",
            ]}
            rows={summaryRows}
            editableColumns={null}
            tableKey={"historical-cost-summary"}
            privileged={canEditExistingData}
          />
        }
      </BaseCard>
      <BaseCard variant="panel">
        <h3>{"入庫成本明細"}</h3>
        <p className={"field-hint"}>
          {"保存當次入庫單價，品項成本價之後變更也不回寫歷史傳票。"}
        </p>
        {
          <BaseDataTable
            headers={[
              "送出時間",
              "傳票編號",
              "品項",
              "料號",
              "數量",
              "單位",
              "入庫單價",
              "入庫金額",
              "填寫人員",
              "送出人員",
            ]}
            rows={receiptLines
              .slice()
              .reverse()
              .map((line) => [
                String(new Date(line.submittedAt).toLocaleString("zh-TW")),
                String(line.voucherId ?? ""),
                String(
                  line.productName ??
                    otcProducts.find((product) => product.id === line.productId)
                      ?.name,
                ),
                String(line.productId ?? ""),
                String(line.quantity),
                String(line.unit ?? "未記錄"),
                line.unitCost == null ? "未填" : line.unitCost.toFixed(2),
                line.unitCost == null
                  ? "未填"
                  : (
                      (Math.round(line.unitCost * 100) * line.quantity) /
                      100
                    ).toFixed(2),
                String(line.filledBy ?? ""),
                String(line.submittedBy ?? ""),
              ])}
            editableColumns={null}
            tableKey={"historical-cost-details"}
            privileged={canEditExistingData}
          />
        }
      </BaseCard>
    </>
  );
}
export function MovementVoucher() {
  const state = useAppSelector((root) => root.workspace);
  const {
    otcProducts,
    activeModule,
    canEditExistingData,
    movementVouchers,
    selectedMovementVoucherIds,
  } = state;
  const voucher = movementVouchers.find(
    (voucher) => voucher.id === selectedMovementVoucherIds[activeModule],
  );
  const locked = Boolean(voucher?.submittedAt || voucher?.cancelledAt);
  return (
    <>
      <section className={"voucher-section"} aria-label={"出入庫傳票"}>
        <div className={"toolbar"}>
          <h3>
            {activeModule === "receipt" ? "入庫" : "出庫"}
            {"傳票"}
          </h3>
          <BaseButton
            variant="outline"
            type={"button"}
            data-action={"create-voucher"}
            disabled={voucher && !locked}
          >
            {"建立傳票"}
          </BaseButton>
        </div>
        <BaseLabel>
          {"選擇傳票"}
          <BaseNativeSelect
            id={"movement-voucher"}
            value={selectedMovementVoucherIds[activeModule] ?? ""}
            onChange={() => {}}
          >
            <BaseNativeSelectOption value={""}>
              {"尚未建立"}
            </BaseNativeSelectOption>
            {React.Children.toArray(
              movementVouchers
                .filter((entry) => entry.direction === activeModule)
                .slice()
                .reverse()
                .map((entry, rowIndex) => (
                  <React.Fragment key={rowIndex}>
                    <BaseNativeSelectOption value={entry.id}>
                      {entry.id}
                      {" · "}
                      {entry.cancelledAt
                        ? "已取消"
                        : entry.submittedAt
                          ? "已送出"
                          : "草稿"}
                    </BaseNativeSelectOption>
                  </React.Fragment>
                )),
            )}
          </BaseNativeSelect>
        </BaseLabel>
        <p className={"field-hint"}>
          {
            "一張傳票是一個批次，編號為日期＋三碼流水號；加入明細後整批送出才更新庫存。"
          }
        </p>
        {voucher ? (
          <>
            <div className={"batch-summary"}>
              <p>
                <strong>{voucher.id}</strong>
                {" · "}
                {voucher.cancelledAt
                  ? "已取消・鎖定"
                  : voucher.submittedAt
                    ? "已送出・鎖定"
                    : "草稿"}
              </p>
              <p>
                {"建立日期："}
                {String(new Date(voucher.createdAt).toLocaleString("zh-TW"))}
                {" · 填寫人員："}
                {String(voucher.createdBy ?? "")}
              </p>
              {voucher.submittedAt ? (
                <>
                  <p>
                    {"送出："}
                    {String(
                      new Date(voucher.submittedAt).toLocaleString("zh-TW"),
                    )}
                    {" · "}
                    {String(voucher.submittedBy ?? "")}
                  </p>
                </>
              ) : (
                ""
              )}
            </div>
            {
              <BaseDataTable
                headers={[
                  "料號",
                  "品項",
                  "數量",
                  ...(activeModule === "receipt" ? ["入庫單價"] : []),
                  "備註",
                  "填寫人員",
                  "操作",
                ]}
                rows={voucher.lines.map((line, index) => [
                  String(line.productId ?? ""),
                  String(
                    otcProducts.find((product) => product.id === line.productId)
                      ?.name ?? "",
                  ),
                  String(line.quantity),
                  ...(activeModule === "receipt"
                    ? [
                        line.unitCost == null
                          ? "未填"
                          : line.unitCost.toFixed(2),
                      ]
                    : []),
                  String(line.note ?? ""),
                  String(line.filledBy ?? ""),
                  locked ? (
                    "鎖定"
                  ) : (
                    <>
                      <BaseButton
                        variant="outline"
                        type={"button"}
                        data-remove-voucher-line={index}
                      >
                        {"移除"}
                      </BaseButton>
                    </>
                  ),
                ])}
                editableColumns={["操作"]}
                tableKey={`voucher-${voucher.id}`}
                privileged={canEditExistingData}
              />
            }
            {locked ? (
              ""
            ) : (
              <>
                <div className={"time-filter-actions"}>
                  <BaseButton
                    variant="primary"
                    type={"button"}
                    data-action={"submit-voucher"}
                    disabled={!voucher.lines.length}
                  >
                    {"確認送出傳票"}
                  </BaseButton>
                  <BaseButton
                    variant="outline"
                    type={"button"}
                    data-action={"cancel-voucher"}
                  >
                    {"取消傳票"}
                  </BaseButton>
                </div>
              </>
            )}
          </>
        ) : (
          ""
        )}
        <p id={"voucher-error"} className={"error"} role={"alert"}>
          {state.errors.voucher}
        </p>
      </section>
    </>
  );
}
