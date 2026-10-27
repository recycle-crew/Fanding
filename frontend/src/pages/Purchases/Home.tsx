import { useWorkspaceDirty } from "@/features/workspace/useWorkspaceDirty";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownUp,
  Clock3,
  Eye,
  Plus,
  Search,
  Truck,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addPurchase,
  addExchangeOrder,
  settlePurchase,
  addPurchaseRecord,
  resolvePurchaseRecord,
} from "@/store/purchases";
import { BaseButton } from "@/components/ui/BaseButton";
import { BaseInput } from "@/components/ui/BaseInput";
import { BaseLabel } from "@/components/ui/BaseLabel";
import {
  BaseNativeSelect,
  BaseNativeSelectOption as Option,
} from "@/components/ui/BaseNativeSelect";
import {
  BaseDialog,
  BaseDialogContent,
  BaseDialogTitle,
  BaseDialogDescription,
} from "@/components/ui/BaseDialog";
import {
  BaseTableCell,
  BaseTableHead,
  BaseTableRow,
} from "@/components/ui/BaseTable";
import { BaseTableFrame } from "@/components/ui/BaseDataTable";
import { suppliers, warehouses } from "@/features/items/model";
import { moveTabFocus } from "@/features/items/tabKeyboard";
import { NewPurchaseForm } from "@/features/purchases/NewPurchaseForm";
import { SettlementForm } from "@/features/purchases/SettlementForm";
import { OperationForm } from "@/features/purchases/OperationForm";
import { PurchaseDetails } from "@/features/purchases/PurchaseDetails";
import { ResolutionForm } from "@/features/purchases/ResolutionForm";
import {
  OrderActions,
  type OrderAction,
} from "@/features/purchases/OrderActions";
import {
  correctionStatus,
  lineBalance,
  reversalStatus,
  pendingAccounting,
  currency,
  nextNumber,
  operationLabels,
  originalAmount,
  recentMonthRange,
  returnStatus,
} from "@/features/purchases/model";
import type { ExchangeOrder } from "@/types/purchases";
import "@/features/items/items.css";
import "@/features/purchases/purchases.css";
type Mode = "new" | OrderAction | "resolve";
const blankFilter = {
  search: "",
  start: "",
  end: "",
  supplier: "",
  warehouse: "",
  returns: "",
  correction: "",
};
export function PurchasesPage() {
  const state = useAppSelector((s) => s.purchases);
  const account =
    useAppSelector((s) => s.workspace.currentAccount) || "demo.pharmacy";
  const dispatch = useAppDispatch();
  const [filter, setFilter] = useState(() => ({
    ...blankFilter,
    ...recentMonthRange(),
  }));
  const [tab, setTab] = useState("all");
  const [documentType, setDocumentType] = useState<
    "purchase" | "return" | "exchange"
  >("purchase");
  const [sort, setSort] = useState({ key: "date", direction: -1 });
  const [modal, setModal] = useState<{
    kind: Mode;
    id?: string;
    recordId?: string;
  } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [pending, setPending] = useState<{
    summary: string;
    detail: string;
    commit: () => void;
  } | null>(null);
  const [notice, setNotice] = useState("");
  const titleRef = useRef<HTMLHeadingElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const safeRef = useRef<HTMLButtonElement>(null);
  const commitLock = useRef(false);
  const order = state.orders.find((o) => o.id === modal?.id);
  const record = order?.records.find((r) => r.id === modal?.recordId);
  const filtered = useMemo(
    () =>
      state.orders.filter(
        (o) =>
          (!filter.start || o.date >= filter.start) &&
          (!filter.end || o.date <= filter.end) &&
          (!filter.supplier || o.supplier === filter.supplier) &&
          (!filter.warehouse || o.warehouse === filter.warehouse) &&
          (!filter.returns || returnStatus(o) === filter.returns) &&
          (!filter.correction || correctionStatus(o) === filter.correction) &&
          [
            o.number,
            o.supplier,
            o.remark,
            ...o.lines.flatMap((l) => [l.name, l.code]),
          ].some((text) =>
            text.toLowerCase().includes(filter.search.trim().toLowerCase()),
          ),
      ),
    [state.orders, filter],
  );
  const rows = filtered
    .filter(
      (o) =>
        tab === "all" ||
        (tab === "accounting"
          ? pendingAccounting(o).length > 0
          : tab === "settled"
            ? !!o.settlement
            : !o.settlement && reversalStatus(o) !== "全部沖銷"),
    )
    .sort(
      (a, b) =>
        sort.direction *
        (sort.key === "amount"
          ? originalAmount(a) - originalAmount(b)
          : a.date.localeCompare(b.date) || a.number.localeCompare(b.number)),
    );
  const returnRows = state.orders
    .flatMap((purchase) =>
      purchase.records
        .filter((record) => record.kind === "return")
        .map((record) => ({ purchase, record })),
    )
    .filter(
      ({ purchase, record }) =>
        (!filter.start || record.date >= filter.start) &&
        (!filter.end || record.date <= filter.end) &&
        (!filter.supplier || purchase.supplier === filter.supplier) &&
        (!filter.warehouse || purchase.warehouse === filter.warehouse) &&
        (tab === "all" ||
          (tab === "pending"
            ? record.accountingStatus === "待處理"
            : record.accountingStatus === "已完成")) &&
        [
          record.number,
          purchase.number,
          purchase.supplier,
          record.reason,
          ...record.lines.map(
            (line) =>
              purchase.lines.find((source) => source.id === line.lineId)
                ?.name || "",
          ),
        ].some((value) =>
          value.toLowerCase().includes(filter.search.trim().toLowerCase()),
        ),
    );
  const exchangeRows = state.exchanges.filter(
    (exchange) =>
      (!filter.start || exchange.date >= filter.start) &&
      (!filter.end || exchange.date <= filter.end) &&
      (!filter.supplier || exchange.supplier === filter.supplier) &&
      (!filter.warehouse || exchange.warehouse === filter.warehouse) &&
      (tab === "all" ||
        (tab === "pending"
          ? exchange.status === "待收貨"
          : exchange.status === "已收貨")) &&
      [
        exchange.number,
        exchange.returnNumber,
        exchange.purchaseNumber,
        exchange.supplier,
        ...exchange.expectedLines.map((line) => line.name),
        exchange.receipt?.name || "",
      ].some((value) =>
        value.toLowerCase().includes(filter.search.trim().toLowerCase()),
      ),
  );
  const pendingCount = filtered.filter(
    (o) => !o.settlement && reversalStatus(o) !== "全部沖銷",
  ).length;
  const settledCount = filtered.filter((o) => !!o.settlement).length;
  useWorkspaceDirty(dirty);
  useEffect(() => {
    if (notice) {
      const timer = window.setTimeout(() => setNotice(""), 6500);
      return () => window.clearTimeout(timer);
    }
  }, [notice]);
  useEffect(() => {
    if (discard || pending) safeRef.current?.focus();
  }, [discard, pending]);
  useEffect(() => {
    if (modal?.kind === "new")
      document
        .getElementById("purchase-item-search")
        ?.focus({ preventScroll: true });
    else if (modal) titleRef.current?.focus();
  }, [modal?.kind]);
  function open(kind: Mode, id?: string, recordId?: string) {
    triggerRef.current = document.activeElement as HTMLElement;
    commitLock.current = false;
    setModal({ kind, id, recordId });
    setDirty(false);
    setDiscard(false);
    setPending(null);
  }
  function close(force = false) {
    if (dirty && !force) {
      setDiscard(true);
      return;
    }
    setModal(null);
    setPending(null);
    setDirty(false);
    setDiscard(false);
  }
  function review(summary: string, detail: string, commit: () => void) {
    setPending({ summary, detail, commit });
    setDirty(true);
  }
  function complete(message: string) {
    setNotice(message);
    close(true);
  }
  function setField(key: keyof typeof blankFilter, value: string) {
    setFilter((current) => ({ ...current, [key]: value }));
  }
  function filterSelect(
    key: "supplier" | "warehouse" | "returns" | "correction",
    text: string,
    values: readonly string[],
  ) {
    return (
      <BaseLabel key={key} htmlFor={`purchase-filter-${key}`}>
        <span id={`purchase-filter-${key}-label`}>{text}</span>
        <BaseNativeSelect
          id={`purchase-filter-${key}`}
          aria-labelledby={`purchase-filter-${key}-label`}
          value={filter[key]}
          onChange={(e) => setField(key, e.target.value)}
        >
          <Option value="">全部</Option>
          {values.map((value) => (
            <Option key={value}>{value}</Option>
          ))}
        </BaseNativeSelect>
      </BaseLabel>
    );
  }
  const title =
    modal?.kind === "new"
      ? "新增進貨單"
      : modal?.kind === "view"
        ? "進貨單明細"
        : modal?.kind === "settle"
          ? "進貨單核對"
          : modal?.kind === "resolve"
            ? record?.resolution === "換貨"
              ? "換貨單收貨"
              : "完成帳務處理"
            : modal
              ? operationLabels[modal.kind as keyof typeof operationLabels]
              : "進貨單";
  const tableKey = `purchase-list-${tab}-${JSON.stringify(filter)}-${sort.key}-${sort.direction}`;
  return (
    <section
      className="items-page purchases-page"
      aria-label="進貨管理"
      onClick={(e) => e.stopPropagation()}
      onSubmit={(e) => e.stopPropagation()}
    >
      <header className="items-heading">
        <div className="items-title">
          <Truck aria-hidden="true" />
          <div>
            <h2>進貨管理</h2>
            <p>管理進貨單據、單據核對與進貨明細</p>
          </div>
        </div>
        <div className="items-heading-tools">
          <div className="items-search">
            <Search size={17} aria-hidden="true" />
            <BaseInput
              aria-label={
                documentType === "purchase"
                  ? "搜尋進貨單"
                  : documentType === "return"
                    ? "搜尋退貨單"
                    : "搜尋換貨單"
              }
              value={filter.search}
              placeholder="搜尋單號、供應商、品名、備註…"
              onChange={(e) => setField("search", e.target.value)}
            />
          </div>
          {documentType === "purchase" && (
            <BaseButton onClick={() => open("new")}>
              <Plus size={17} aria-hidden="true" />
              新增進貨單
            </BaseButton>
          )}
        </div>
      </header>
      <div
        className="items-tabs purchase-document-tabs"
        role="tablist"
        aria-label="單據類型"
        onKeyDown={moveTabFocus}
      >
        {(
          [
            ["purchase", `進貨單（${state.orders.length}）`],
            [
              "return",
              `退貨單（${state.orders.reduce((sum, purchase) => sum + purchase.records.filter((record) => record.kind === "return").length, 0)}）`,
            ],
            ["exchange", `換貨單（${state.exchanges.length}）`],
          ] as const
        ).map(([key, label]) => (
          <BaseButton
            key={key}
            id={`purchase-document-tab-${key}`}
            role="tab"
            aria-selected={documentType === key}
            aria-controls="purchase-list-panel"
            tabIndex={documentType === key ? 0 : -1}
            variant="ghost"
            onClick={() => {
              setDocumentType(key);
              setTab("all");
            }}
            onFocus={() => setDocumentType(key)}
          >
            {label}
          </BaseButton>
        ))}
      </div>
      <div className="purchase-summary" aria-live="polite">
        <span>
          {documentType === "purchase"
            ? "進貨單"
            : documentType === "return"
              ? "退貨單"
              : "換貨單"}
          <strong>
            {documentType === "purchase"
              ? rows.length
              : documentType === "return"
                ? returnRows.length
                : exchangeRows.length}
          </strong>
          筆
        </span>
        <span className="purchase-summary-pending">
          <Clock3 size={15} aria-hidden="true" />
          {documentType === "purchase"
            ? `待核對 ${rows.filter((order) => !order.settlement && reversalStatus(order) !== "全部沖銷").length} 筆`
            : documentType === "return"
              ? `帳務待處理 ${returnRows.filter(({ record }) => record.accountingStatus === "待處理").length} 筆`
              : `待收貨 ${exchangeRows.filter((exchange) => exchange.status === "待收貨").length} 筆`}
        </span>
      </div>

      <div
        className="items-tabs"
        role="tablist"
        aria-label={
          documentType === "purchase"
            ? "進貨核對狀態"
            : documentType === "return"
              ? "退貨單狀態"
              : "換貨單狀態"
        }
        onKeyDown={moveTabFocus}
      >
        {(documentType === "purchase"
          ? [
              ["all", `全部（${filtered.length}）`],
              ["pending", `待核對（${pendingCount}）`],
              ["settled", `核對完成（${settledCount}）`],
              [
                "accounting",
                `待處理帳務（${filtered.filter((o) => pendingAccounting(o).length > 0).length}）`,
              ],
            ]
          : documentType === "return"
            ? [
                ["all", `全部（${returnRows.length}）`],
                [
                  "pending",
                  `待處理（${returnRows.filter(({ record }) => record.accountingStatus === "待處理").length}）`,
                ],
                [
                  "settled",
                  `已完成（${returnRows.filter(({ record }) => record.accountingStatus === "已完成").length}）`,
                ],
              ]
            : [
                ["all", `全部（${exchangeRows.length}）`],
                [
                  "pending",
                  `待收貨（${exchangeRows.filter((exchange) => exchange.status === "待收貨").length}）`,
                ],
                [
                  "settled",
                  `已收貨（${exchangeRows.filter((exchange) => exchange.status === "已收貨").length}）`,
                ],
              ]
        ).map(([key, text]) => (
          <BaseButton
            key={key}
            id={`purchase-tab-${key}`}
            role="tab"
            aria-selected={tab === key}
            aria-controls="purchase-list-panel"
            tabIndex={tab === key ? 0 : -1}
            variant="ghost"
            onClick={() => setTab(key)}
            onFocus={() => setTab(key)}
          >
            {text}
          </BaseButton>
        ))}
      </div>
      <div
        id="purchase-list-panel"
        role="tabpanel"
        aria-labelledby={`purchase-tab-${tab}`}
        tabIndex={0}
      >
        <div className="items-filter-bar purchase-filters">
          {(
            [
              [
                "start",
                documentType === "purchase"
                  ? "收貨日期起"
                  : documentType === "return"
                    ? "退貨日期起"
                    : "建立日期起",
              ],
              [
                "end",
                documentType === "purchase"
                  ? "收貨日期迄"
                  : documentType === "return"
                    ? "退貨日期迄"
                    : "建立日期迄",
              ],
            ] as const
          ).map(([key, text]) => (
            <BaseLabel key={key} htmlFor={`purchase-filter-${key}`}>
              {text}
              <BaseInput
                id={`purchase-filter-${key}`}
                type="date"
                value={filter[key]}
                onChange={(e) => setField(key, e.target.value)}
              />
            </BaseLabel>
          ))}
          {filterSelect("supplier", "供應商", suppliers)}
          {filterSelect("warehouse", "倉別", warehouses)}
          <BaseButton
            variant="ghost"
            onClick={() => {
              setFilter(blankFilter);
              setTab("all");
            }}
          >
            清除
          </BaseButton>
          <BaseButton
            variant="outline"
            onClick={() => {
              setFilter((current) => ({
                ...current,
                ...recentMonthRange(),
              }));
            }}
          >
            最近一個月
          </BaseButton>
          {documentType === "purchase" && (
            <details className="purchase-advanced-filters">
              <summary>
                更多篩選
                {[filter.warehouse, filter.returns, filter.correction].filter(
                  Boolean,
                ).length > 0 &&
                  `（已套用 ${[filter.warehouse, filter.returns, filter.correction].filter(Boolean).length} 項）`}
              </summary>
              <div>
                {filterSelect("returns", "退貨狀態", [
                  "無",
                  "部分退貨",
                  "全部退貨",
                ])}
                {filterSelect("correction", "更正狀態", [
                  "無",
                  "更正處理中",
                  "已更正",
                ])}
              </div>
            </details>
          )}
        </div>
        <p className="purchase-status-note">
          {documentType === "purchase"
            ? "核對完成表示單據已核對，不代表已付款。"
            : documentType === "return"
              ? "退貨單連結原進貨單；退款、折讓與換貨收貨狀態分開追蹤。"
              : "換貨單連結退貨單與原進貨單；收貨確認後才記錄換入資料。"}
        </p>
        {filter.start && filter.end && filter.start > filter.end && (
          <p role="alert" className="items-error">
            收貨日期起不可晚於迄日，請調整日期條件。
          </p>
        )}
        <div className="purchase-list-card">
          {documentType === "purchase" && (
            <>
              <div className="purchase-mobile-sort">
                <BaseLabel htmlFor="purchase-mobile-sort">排序方式</BaseLabel>
                <BaseNativeSelect
                  id="purchase-mobile-sort"
                  value={`${sort.key}-${sort.direction === 1 ? "asc" : "desc"}`}
                  onChange={(e) => {
                    const [key, direction] = e.target.value.split("-");
                    setSort({ key, direction: direction === "asc" ? 1 : -1 });
                  }}
                >
                  <Option value="date-desc">收貨日期：新到舊</Option>
                  <Option value="date-asc">收貨日期：舊到新</Option>
                  <Option value="amount-desc">進貨金額：高到低</Option>
                  <Option value="amount-asc">進貨金額：低到高</Option>
                </BaseNativeSelect>
              </div>
              <BaseTableFrame
                key={tableKey}
                tableKey={tableKey}
                columns={9}
                region="進貨管理列表，可左右捲動"
                variant="sticky-actions"
                headers={
                  <BaseTableRow>
                    {[
                      "進貨單號",
                      "收貨日期",
                      "供應商",
                      "入庫倉別",
                      "品項數",
                      "原始進貨金額",
                      "核對狀態",
                      "備註",
                      "操作",
                    ].map((text, index) => (
                      <BaseTableHead
                        key={text}
                        data-export-ignore={index === 8 ? "true" : undefined}
                        aria-sort={
                          (index === 1 && sort.key === "date") ||
                          (index === 5 && sort.key === "amount")
                            ? sort.direction === 1
                              ? "ascending"
                              : "descending"
                            : undefined
                        }
                      >
                        {index === 1 || index === 5 ? (
                          <BaseButton
                            variant="sort"
                            size="sm"
                            type="button"
                            onClick={() =>
                              setSort({
                                key: index === 1 ? "date" : "amount",
                                direction:
                                  sort.key === (index === 1 ? "date" : "amount")
                                    ? -sort.direction
                                    : -1,
                              })
                            }
                          >
                            {text}
                            <ArrowDownUp size={12} aria-hidden="true" />
                          </BaseButton>
                        ) : (
                          text
                        )}
                      </BaseTableHead>
                    ))}
                  </BaseTableRow>
                }
                rows={rows.map((o) => (
                  <BaseTableRow key={o.id}>
                    <BaseTableCell data-label="進貨單號">
                      <BaseButton
                        variant="record-link"
                        size="sm"
                        type="button"
                        onClick={() => open("view", o.id)}
                      >
                        {o.number}
                      </BaseButton>
                    </BaseTableCell>
                    <BaseTableCell data-label="收貨日期">
                      {o.date}
                    </BaseTableCell>
                    <BaseTableCell data-label="供應商">
                      {o.supplier}
                    </BaseTableCell>
                    <BaseTableCell data-label="入庫倉別">
                      {o.warehouse}
                    </BaseTableCell>
                    <BaseTableCell data-label="品項數">
                      {o.lines.length}
                    </BaseTableCell>
                    <BaseTableCell variant="money" data-label="原始進貨金額">
                      {originalAmount(o).toFixed(2)}
                    </BaseTableCell>
                    <BaseTableCell data-label="核對狀態">
                      <span
                        className={`items-status ${o.settlement ? "" : "warning"}`}
                      >
                        {reversalStatus(o) === "全部沖銷"
                          ? "全部沖銷"
                          : o.settlement
                            ? "核對完成"
                            : "待核對"}
                      </span>
                    </BaseTableCell>
                    <BaseTableCell
                      data-label="備註"
                      className={
                        !o.remark && !pendingAccounting(o).length
                          ? "purchase-mobile-optional"
                          : undefined
                      }
                    >
                      {pendingAccounting(o).length > 0 && (
                        <BaseButton
                          type="button"
                          variant="ghost"
                          onClick={() => open("view", o.id)}
                        >
                          待處理帳務 {pendingAccounting(o).length} 筆
                        </BaseButton>
                      )}
                      {o.remark || "—"}
                    </BaseTableCell>
                    <BaseTableCell>
                      <div className="purchase-row-actions">
                        <BaseButton
                          variant="outline"
                          size="sm"
                          aria-label={`查看進貨單 ${o.number}`}
                          onClick={() => open("view", o.id)}
                        >
                          <Eye size={16} aria-hidden="true" />
                          明細
                        </BaseButton>
                        <OrderActions
                          order={o}
                          onAction={(kind) => open(kind, o.id)}
                        />
                      </div>
                    </BaseTableCell>
                  </BaseTableRow>
                ))}
              />
            </>
          )}
          {documentType === "return" && (
            <BaseTableFrame
              key={`return-list-${tab}-${JSON.stringify(filter)}`}
              tableKey={`return-list-${tab}-${JSON.stringify(filter)}`}
              columns={8}
              region="退貨單列表，可左右捲動"
              variant="sticky-actions"
              headers={
                <BaseTableRow>
                  {[
                    "退貨單號",
                    "退貨日期",
                    "供應商",
                    "原進貨單",
                    "退貨品項／數量",
                    "退貨原成本",
                    "處理狀態",
                    "操作",
                  ].map((label) => (
                    <BaseTableHead key={label}>{label}</BaseTableHead>
                  ))}
                </BaseTableRow>
              }
              rows={returnRows.map(({ purchase, record }) => {
                const exchange = state.exchanges.find(
                  (item) => item.returnRecordId === record.id,
                );
                return (
                  <BaseTableRow key={record.id}>
                    <BaseTableCell data-label="退貨單號">
                      <BaseButton
                        variant="record-link"
                        size="sm"
                        onClick={() => open("view", purchase.id, record.id)}
                      >
                        {record.number}
                      </BaseButton>
                    </BaseTableCell>
                    <BaseTableCell data-label="退貨日期">
                      {record.date}
                    </BaseTableCell>
                    <BaseTableCell data-label="供應商">
                      {purchase.supplier}
                    </BaseTableCell>
                    <BaseTableCell data-label="原進貨單">
                      <BaseButton
                        variant="record-link"
                        size="sm"
                        onClick={() => open("view", purchase.id)}
                      >
                        {purchase.number}
                      </BaseButton>
                    </BaseTableCell>
                    <BaseTableCell data-label="退貨品項／數量">
                      {record.lines
                        .map(
                          (line) =>
                            `${purchase.lines.find((item) => item.id === line.lineId)?.name || "品項"} ${-line.quantityChange}`,
                        )
                        .join("、")}
                    </BaseTableCell>
                    <BaseTableCell variant="money" data-label="退貨原成本">
                      {currency(record.amount)}
                    </BaseTableCell>
                    <BaseTableCell data-label="處理狀態">
                      <span
                        className={`items-status ${record.accountingStatus === "待處理" ? "warning" : ""}`}
                      >
                        {exchange?.status === "待收貨"
                          ? "換貨待收貨"
                          : record.accountingStatus === "待處理"
                            ? "帳務待處理"
                            : "已完成"}
                      </span>
                    </BaseTableCell>
                    <BaseTableCell data-label="操作">
                      <div className="purchase-row-actions">
                        <BaseButton
                          variant="outline"
                          size="sm"
                          onClick={() => open("view", purchase.id, record.id)}
                        >
                          退貨明細
                        </BaseButton>
                        {record.accountingStatus === "待處理" && (
                          <BaseButton
                            size="sm"
                            onClick={() =>
                              open("resolve", purchase.id, record.id)
                            }
                          >
                            {record.resolution === "換貨"
                              ? "登錄換貨收貨"
                              : "處理帳務"}
                          </BaseButton>
                        )}
                      </div>
                    </BaseTableCell>
                  </BaseTableRow>
                );
              })}
            />
          )}
          {documentType === "exchange" && (
            <BaseTableFrame
              key={`exchange-list-${tab}-${JSON.stringify(filter)}`}
              tableKey={`exchange-list-${tab}-${JSON.stringify(filter)}`}
              columns={8}
              region="換貨單列表，可左右捲動"
              variant="sticky-actions"
              headers={
                <BaseTableRow>
                  {[
                    "換貨單號",
                    "建立日期",
                    "供應商",
                    "退貨單／原進貨單",
                    "預計換入品項",
                    "收貨倉別",
                    "收貨狀態",
                    "操作",
                  ].map((label) => (
                    <BaseTableHead key={label}>{label}</BaseTableHead>
                  ))}
                </BaseTableRow>
              }
              rows={exchangeRows.map((exchange) => (
                <BaseTableRow key={exchange.id}>
                  <BaseTableCell data-label="換貨單號">
                    <BaseButton
                      variant="record-link"
                      size="sm"
                      onClick={() =>
                        open(
                          exchange.status === "待收貨" ? "resolve" : "view",
                          exchange.purchaseId,
                          exchange.returnRecordId,
                        )
                      }
                    >
                      {exchange.number}
                    </BaseButton>
                  </BaseTableCell>
                  <BaseTableCell data-label="建立日期">
                    {exchange.date}
                  </BaseTableCell>
                  <BaseTableCell data-label="供應商">
                    {exchange.supplier}
                  </BaseTableCell>
                  <BaseTableCell data-label="退貨單／原進貨單">
                    <BaseButton
                      variant="record-link"
                      size="sm"
                      onClick={() =>
                        open(
                          "view",
                          exchange.purchaseId,
                          exchange.returnRecordId,
                        )
                      }
                    >
                      {exchange.returnNumber}
                    </BaseButton>
                    <small>{exchange.purchaseNumber}</small>
                  </BaseTableCell>
                  <BaseTableCell data-label="預計換入品項">
                    {exchange.receipt
                      ? `${exchange.receipt.code} · ${exchange.receipt.name} ${exchange.receipt.quantity} ${exchange.receipt.unit}`
                      : exchange.expectedLines
                          .map(
                            (line) =>
                              `${line.name} ${line.quantity} ${line.unit}`,
                          )
                          .join("、")}
                  </BaseTableCell>
                  <BaseTableCell data-label="收貨倉別">
                    {exchange.receipt?.warehouse || exchange.warehouse}
                  </BaseTableCell>
                  <BaseTableCell data-label="收貨狀態">
                    <span
                      className={`items-status ${exchange.status === "待收貨" ? "warning" : ""}`}
                    >
                      {exchange.status}
                    </span>
                  </BaseTableCell>
                  <BaseTableCell data-label="操作">
                    <BaseButton
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        open(
                          exchange.status === "待收貨" ? "resolve" : "view",
                          exchange.purchaseId,
                          exchange.returnRecordId,
                        )
                      }
                    >
                      {exchange.status === "待收貨"
                        ? "登錄收貨"
                        : "查看換貨紀錄"}
                    </BaseButton>
                  </BaseTableCell>
                </BaseTableRow>
              ))}
            />
          )}
        </div>
      </div>
      <p className="items-sample-note">
        展示模式・僅更新當次進貨單假資料，不連動模組一庫存。金額單位：NT$；重新整理即重置。
      </p>
      {notice && (
        <div className="items-toast" role="status">
          {notice}
          <BaseButton
            variant="ghost"
            size="icon"
            aria-label="關閉提示"
            onClick={() => setNotice("")}
          >
            <X size={15} />
          </BaseButton>
        </div>
      )}
      <BaseDialog
        open={!!modal}
        onOpenChange={(value) => {
          if (!value) close();
        }}
      >
        <BaseDialogContent
          variant={
            modal?.kind === "settle" || modal?.kind === "resolve"
              ? "workspace"
              : "workspace-wide"
          }
          aria-modal="true"
          className="purchase-modal"
          showCloseButton={false}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            if (modal?.kind === "new")
              document
                .getElementById("purchase-item-search")
                ?.focus({ preventScroll: true });
            else titleRef.current?.focus();
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            if (triggerRef.current?.isConnected) triggerRef.current.focus();
            else
              document
                .querySelector<HTMLInputElement>('[aria-label="搜尋進貨單"]')
                ?.focus();
          }}
        >
          <div className="items-modal-heading">
            <BaseDialogTitle ref={titleRef} tabIndex={-1}>
              <Truck size={23} aria-hidden="true" />
              {title}
            </BaseDialogTitle>
            <BaseButton
              variant="ghost"
              size="icon"
              aria-label="關閉進貨視窗"
              onClick={() => close()}
            >
              <X size={19} aria-hidden="true" />
            </BaseButton>
          </div>
          <BaseDialogDescription variant="workspace">
            {modal?.kind === "view"
              ? "查看進貨商品、核對資訊及異動紀錄。"
              : order
                ? `${order.number} · ${order.supplier}`
                : "填寫收貨資料並加入商品，下一步可確認整張單據。"}
          </BaseDialogDescription>
          {discard && (
            <div className="items-discard" role="alert">
              <strong>有尚未完成的內容，要放棄嗎？</strong>
              <div>
                <BaseButton
                  ref={safeRef}
                  variant="outline"
                  onClick={() => {
                    setDiscard(false);
                    titleRef.current?.focus();
                  }}
                >
                  繼續編輯
                </BaseButton>
                <BaseButton variant="destructive" onClick={() => close(true)}>
                  放棄修改
                </BaseButton>
              </div>
            </div>
          )}
          {pending && (
            <div
              className="purchase-review"
              role="region"
              aria-labelledby="purchase-review-title"
            >
              <h3 id="purchase-review-title">確認本次操作</h3>
              <strong>{pending.summary}</strong>
              <p id="purchase-review-description">{pending.detail}</p>
              <p className="purchase-callout">
                操作只影響當次展示單據，原始歷史資料會保留。
              </p>
              <div>
                <BaseButton
                  ref={safeRef}
                  variant="outline"
                  aria-describedby="purchase-review-description"
                  onClick={() => {
                    setPending(null);
                    titleRef.current?.focus();
                  }}
                >
                  返回檢查
                </BaseButton>
                <BaseButton
                  onClick={() => {
                    if (commitLock.current) return;
                    commitLock.current = true;
                    pending.commit();
                  }}
                >
                  {modal?.kind === "settle"
                    ? "確認核對"
                    : modal?.kind === "new"
                      ? "確認入庫"
                      : modal?.kind === "reversal"
                        ? "確認沖銷"
                        : modal?.kind === "return"
                          ? "確認退貨"
                          : modal?.kind === "resolve" &&
                              record?.resolution === "換貨"
                            ? "確認換貨收貨"
                            : "確認送出"}
                </BaseButton>
              </div>
            </div>
          )}
          <div className="purchase-form-slot" hidden={!!pending}>
            {modal?.kind === "new" && (
              <NewPurchaseForm
                onCancel={() => close()}
                onDirty={() => setDirty(true)}
                onSubmit={(input) =>
                  review(
                    `建立進貨單 · ${currency(input.lines.reduce((s, l) => s + l.quantity * l.unitCost, 0))}`,
                    `${input.supplier}／${input.warehouse}，共 ${input.lines.length} 筆明細，確認後列為待核對。`,
                    () => {
                      const id = crypto.randomUUID();
                      dispatch(
                        addPurchase({
                          ...input,
                          id,
                          number: nextNumber("PO", state.orders.length),
                          createdBy: account,
                          createdAt: new Date().toISOString(),
                          settlement: null,
                          records: [],
                        }),
                      );
                      setFilter(blankFilter);
                      setTab("all");
                      complete(
                        "已建立進貨單（展示），待核對。模組一庫存未變更。",
                      );
                    },
                  )
                }
              />
            )}
            {modal?.kind === "view" && order && (
              <>
                <PurchaseDetails
                  key={`${order.id}-${modal.recordId || "purchase"}`}
                  order={order}
                  initialTab={modal.recordId ? "history" : "lines"}
                  onSettle={() => open("settle", order.id)}
                  onResolve={(r) => open("resolve", order.id, r.id)}
                />
                <footer className="items-modal-footer">
                  <OrderActions
                    order={order}
                    onAction={(kind) => open(kind, order.id)}
                  />
                  <BaseButton variant="outline" onClick={() => close()}>
                    關閉
                  </BaseButton>
                </footer>
              </>
            )}
            {modal?.kind === "settle" && order && (
              <SettlementForm
                order={order}
                onCancel={() => close()}
                onDirty={() => setDirty(true)}
                onSubmit={(value) =>
                  review(
                    `核對金額 ${currency(value.amount)}`,
                    "確認後標記核對完成，保留原始進貨金額，不代表已付款。",
                    () => {
                      dispatch(
                        settlePurchase({
                          id: order.id,
                          settlement: {
                            ...value,
                            number: nextNumber(
                              "PS",
                              state.orders.filter((o) => o.settlement).length,
                            ),
                            operator: account,
                            createdAt: new Date().toISOString(),
                          },
                        }),
                      );
                      complete("已完成單據核對（展示），未執行付款。");
                    },
                  )
                }
              />
            )}
            {modal &&
              ["return", "reversal", "correction"].includes(modal.kind) &&
              order && (
                <OperationForm
                  key={`${modal.kind}-${order.id}`}
                  order={order}
                  kind={modal.kind as "return" | "reversal" | "correction"}
                  onCancel={() => close()}
                  onDirty={() => setDirty(true)}
                  onSubmit={(value) =>
                    review(
                      `${operationLabels[value.kind]} · ${currency(value.amount)}`,
                      value.kind === "return"
                        ? `商品已交付退回；處理方式：${value.resolution}；退貨商品原成本 ${currency(value.amount)}。${value.resolution === "換貨" ? "換入商品待後續確認收貨。" : value.resolution === "退款" ? "退款金額待確認。" : value.resolution === "折讓" ? "折讓金額待確認。" : "供應商處理方式待確認。"}原因：${value.reason}。\n${value.lines
                            .map((line) => {
                              const source = order.lines.find(
                                (l) => l.id === line.lineId,
                              )!;
                              return `${source.name}／批號 ${source.batch || "未填寫"}／效期 ${source.expiry || "未填寫"}：${-line.quantityChange} ${source.unit}，${currency(-line.amount)}`;
                            })
                            .join("\n")}`
                        : value.kind === "reversal"
                          ? `${order.lines.every((line) => lineBalance(order, line).remaining + (value.lines.find((l) => l.lineId === line.id)?.quantityChange ?? 0) === 0) ? "本次沖銷後無剩餘量" : "本次為部分沖銷"}；原因：${value.reason}。\n${value.lines
                              .map((line) => {
                                const source = order.lines.find(
                                  (l) => l.id === line.lineId,
                                )!;
                                return `${source.name}／批號 ${source.batch || "未填寫"}／效期 ${source.expiry || "未填寫"}：${-line.quantityChange} ${source.unit}，${currency(-line.amount)}`;
                              })
                              .join("\n")}\n原始單據與歷史成本保留。`
                          : `${value.lines.length} 筆處理明細；原因：${value.reason}。原始單據不修改。`,
                      () => {
                        const count = state.orders.flatMap(
                          (o) => o.records,
                        ).length;
                        const returnRecordId = crypto.randomUUID();
                        const returnNumber = nextNumber(
                          value.kind === "return"
                            ? "PR"
                            : value.kind === "reversal"
                              ? "PV"
                              : "PC",
                          count,
                        );
                        dispatch(
                          addPurchaseRecord({
                            id: order.id,
                            record: {
                              ...value,
                              id: returnRecordId,
                              number: returnNumber,
                              operator: account,
                              createdAt: new Date().toISOString(),
                            },
                          }),
                        );
                        if (
                          value.kind === "return" &&
                          value.resolution === "換貨"
                        ) {
                          const exchange: ExchangeOrder = {
                            id: crypto.randomUUID(),
                            number: nextNumber("EX", state.exchanges.length),
                            purchaseId: order.id,
                            purchaseNumber: order.number,
                            returnRecordId,
                            returnNumber,
                            supplier: order.supplier,
                            warehouse: order.warehouse,
                            date: value.date,
                            status: "待收貨",
                            expectedLines: value.lines.map((line) => {
                              const source = order.lines.find(
                                (item) => item.id === line.lineId,
                              )!;
                              return {
                                lineId: source.id,
                                itemId: source.itemId,
                                code: source.code,
                                name: source.name,
                                specification: source.specification,
                                unit: source.unit,
                                quantity: -line.quantityChange,
                              };
                            }),
                          };
                          dispatch(addExchangeOrder(exchange));
                        }
                        complete(
                          `已記錄${operationLabels[value.kind]}（展示），原始資料與歷史成本保留。`,
                        );
                      },
                    )
                  }
                />
              )}
            {modal?.kind === "resolve" && order && record && (
              <ResolutionForm
                record={record}
                order={order}
                onCancel={() => close()}
                onDirty={() => setDirty(true)}
                onSubmit={(value) =>
                  review(
                    `完成帳務處理 · ${record.number}`,
                    `${value.resolution}；${value.reference ? `相關單號 ${value.reference}` : `未提供外部單號，使用內部追蹤單號 ${record.number}`}。供應商確認金額與原成本分開保存。`,
                    () => {
                      dispatch(
                        resolvePurchaseRecord({
                          orderId: order.id,
                          recordId: record.id,
                          ...value,
                          resolvedAt: new Date().toISOString(),
                          operator: account,
                        }),
                      );
                      complete("帳務處理結果已記錄（展示）。");
                    },
                  )
                }
              />
            )}
          </div>
        </BaseDialogContent>
      </BaseDialog>
    </section>
  );
}
