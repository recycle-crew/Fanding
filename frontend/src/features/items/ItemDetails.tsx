import { useState } from "react";
import { moveTabFocus } from "./tabKeyboard";
import { useAppSelector } from "@/store/hooks";
import { BaseButton } from "@/components/ui/BaseButton";
import { BaseInput } from "@/components/ui/BaseInput";
import { BaseLabel } from "@/components/ui/BaseLabel";
import {
  BaseNativeSelect,
  BaseNativeSelectOption,
} from "@/components/ui/BaseNativeSelect";
import { BaseDataTable } from "@/components/ui/BaseDataTable";
import {
  itemGroupLabels,
  available,
  batchAverage,
  expiryStatus,
  usageStatus,
  warehouses,
} from "./model";
import type { Item } from "@/types/items";

const transactionLabels: Record<string, string> = {
  PURCHASE_IN: "進貨入庫",
  HIS_CONSUMPTION_OUT: "HIS 耗用出庫",
  POS_OUT: "POS 銷售出庫",
};
const transactionLabel = (type: string) => transactionLabels[type] || type;

export function ItemDetails({
  item,
  initialWarehouse = "",
}: {
  item: Item;
  initialWarehouse?: string;
}) {
  const state = useAppSelector((s) => s.items);
  const [tab, setTab] = useState("batches");
  const [filter, setFilter] = useState({
    start: "",
    end: "",
    warehouse: initialWarehouse,
    type: "",
    batch: "",
  });
  const [expiryFilter, setExpiryFilter] = useState("");
  const batches = state.batches.filter((b) => b.itemId === item.id);
  const warehouseBatches = batches.filter(
    (b) => !filter.warehouse || b.warehouse === filter.warehouse,
  );
  const visibleBatches = warehouseBatches.filter(
    (b) => !expiryFilter || expiryStatus(b) === expiryFilter,
  );
  const warehouseOptions = Array.from(
    new Set([
      ...warehouses,
      ...batches.map((b) => b.warehouse),
      ...(initialWarehouse ? [initialWarehouse] : []),
    ]),
  );
  const costs = state.costs.filter((c) => c.itemId === item.id);
  const visibleCosts = costs.filter(
    (c) =>
      !filter.warehouse || warehouseBatches.some((b) => b.id === c.batchId),
  );
  const transactions = state.transactions
    .filter(
      (t) =>
        t.itemId === item.id &&
        (!filter.start || t.date >= filter.start) &&
        (!filter.end || t.date <= filter.end) &&
        (!filter.warehouse || t.warehouse === filter.warehouse) &&
        (!filter.type || t.type === filter.type) &&
        t.batchNumber.toLowerCase().includes(filter.batch.toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="items-modal-scroll items-details">
      <div className="items-product-summary">
        <div>
          <span className="items-kicker">{itemGroupLabels[item.group]}</span>
          <h3>{item.name}</h3>
          <div className="items-product-meta">
            <span>料號 {item.code}</span>
            <span>健保碼 {item.nhiCode || "—"}</span>
            <span>規格 {item.specification || "—"}</span>
          </div>
        </div>
        <div className="items-stock-total">
          <small>可用庫存</small>
          <strong>
            {warehouseBatches.reduce((s, b) => s + available(b), 0)}{" "}
            <span>{item.unit}</span>
          </strong>
          <small>{filter.warehouse || "全部倉庫合計"}</small>
        </div>
      </div>
      <div className="items-detail-scope">
        <BaseLabel htmlFor="items-detail-warehouse">查看倉別</BaseLabel>
        <BaseNativeSelect
          id="items-detail-warehouse"
          value={filter.warehouse}
          onChange={(e) =>
            setFilter((f) => ({ ...f, warehouse: e.target.value }))
          }
        >
          <BaseNativeSelectOption value="">全部倉別</BaseNativeSelectOption>
          {warehouseOptions.map((w) => (
            <BaseNativeSelectOption key={w} value={w}>
              {w}
            </BaseNativeSelectOption>
          ))}
        </BaseNativeSelect>
        <span>適用批號庫存、庫存異動及成本歷史</span>
      </div>

      <div
        className="items-tabs"
        role="tablist"
        aria-label="品項明細"
        onKeyDown={moveTabFocus}
      >
        {[
          ["batches", "批號庫存"],
          ["transactions", "庫存異動"],
          ["costs", "進貨成本歷史"],
        ].map(([key, text]) => (
          <BaseButton
            key={key}
            id={`details-tab-${key}`}
            role="tab"
            aria-selected={tab === key}
            tabIndex={tab === key ? 0 : -1}
            aria-controls="item-detail-panel"
            variant="ghost"
            onClick={() => setTab(key)}
            onFocus={() => setTab(key)}
          >
            {text}
          </BaseButton>
        ))}
      </div>
      <div
        id="item-detail-panel"
        role="tabpanel"
        tabIndex={0}
        aria-labelledby={`details-tab-${tab}`}
      >
        {tab === "batches" && (
          <>
            <div className="items-detail-filters items-batch-filters">
              <BaseLabel htmlFor="items-batch-expiry">
                效期狀態
                <BaseNativeSelect
                  id="items-batch-expiry"
                  aria-label="效期狀態"
                  value={expiryFilter}
                  onChange={(e) => setExpiryFilter(e.target.value)}
                >
                  <BaseNativeSelectOption value="">
                    全部狀態
                  </BaseNativeSelectOption>
                  {["正常", "即將到期", "已過期", "不適用"].map((status) => (
                    <BaseNativeSelectOption key={status} value={status}>
                      {status}
                    </BaseNativeSelectOption>
                  ))}
                </BaseNativeSelect>
              </BaseLabel>
              <BaseButton
                variant="ghost"
                onClick={() => {
                  setExpiryFilter("");
                  setFilter((f) => ({ ...f, warehouse: "" }));
                }}
              >
                清除篩選
              </BaseButton>
            </div>
            <p className="items-availability-note">
              帳面數量為批次記錄的數量；可用數量已扣除過期及其他不可用數量。過期批次即使仍有帳面數量，可用數量也為
              0。
            </p>
            <details className="items-cost-note">
              <summary>成本計算說明</summary>
              <p className="items-note">
                成本算法：同批次歷次進貨金額 ÷
                進貨數量，僅供展示參考；各筆原始成本請見進貨成本歷史。
              </p>
            </details>
            <div className="items-batch-table">
              <BaseDataTable
                tableKey={`items-batches-${item.id}-${filter.warehouse}-${expiryFilter}`}
                headers={[
                  "批號／倉別",
                  "效期／狀態",
                  "可用數量",
                  "帳面數量",
                  "成本與入庫",
                ]}
                rows={visibleBatches.map((b) => [
                  <>
                    <span className="items-batch-label">批號</span>
                    <strong>{b.batchNumber || "—"}</strong>
                    <small className="items-secondary">{b.warehouse}</small>
                  </>,
                  <>
                    <span className="items-batch-label">效期</span>
                    {b.expiryDate || "—"}
                    <small className="items-secondary">
                      <span
                        className={`items-status ${expiryStatus(b) === "已過期" ? "danger" : expiryStatus(b) === "即將到期" ? "warning" : ""}`}
                      >
                        {expiryStatus(b) === "已過期"
                          ? "已過期（不可用）"
                          : expiryStatus(b)}
                      </span>
                    </small>
                  </>,
                  <>
                    <span className="items-batch-label">可用數量</span>
                    <strong>
                      {available(b)} {item.unit}
                    </strong>
                  </>,
                  <>
                    <span className="items-batch-label">帳面數量</span>
                    {b.quantity} {item.unit}
                  </>,
                  <details className="items-batch-extra">
                    <summary>成本與入庫</summary>
                    <dl>
                      <div>
                        <dt>加權平均成本</dt>
                        <dd>{batchAverage(b.id, costs)?.toFixed(4) ?? "—"}</dd>
                      </div>
                      <div>
                        <dt>最近入庫日期</dt>
                        <dd>{b.receivedAt}</dd>
                      </div>
                    </dl>
                  </details>,
                ])}
              />
            </div>
          </>
        )}
        {tab === "transactions" && (
          <>
            <div className="items-detail-filters">
              {(
                [
                  ["start", "開始日期"],
                  ["end", "結束日期"],
                  ["batch", "批號"],
                ] as const
              ).map(([key, text]) => (
                <BaseLabel key={key} htmlFor={`items-detail-${key}`}>
                  {text}
                  <BaseInput
                    id={`items-detail-${key}`}
                    aria-label={text}
                    type={key === "batch" ? "text" : "date"}
                    value={filter[key]}
                    onChange={(e) =>
                      setFilter({ ...filter, [key]: e.target.value })
                    }
                  />
                </BaseLabel>
              ))}
              <BaseLabel>
                異動類型
                <BaseNativeSelect
                  aria-label="異動類型"
                  value={filter.type}
                  onChange={(e) =>
                    setFilter({ ...filter, type: e.target.value })
                  }
                >
                  <BaseNativeSelectOption value="">
                    全部類型
                  </BaseNativeSelectOption>
                  {[...new Set(state.transactions.map((t) => t.type))].map(
                    (t) => (
                      <BaseNativeSelectOption key={t} value={t}>
                        {transactionLabel(t)}
                      </BaseNativeSelectOption>
                    ),
                  )}
                </BaseNativeSelect>
              </BaseLabel>
            </div>
            <BaseDataTable
              tableKey={`items-transactions-${item.id}-${JSON.stringify(filter)}`}
              headers={[
                "異動時間",
                "異動類型",
                "來源單號",
                "倉別",
                "批號",
                "異動數量",
                "異動後數量",
                "操作人員",
                "備註",
              ]}
              rows={transactions.map((t) => [
                t.date,
                transactionLabel(t.type),
                t.reference,
                t.warehouse,
                t.batchNumber,
                `${t.change > 0 ? "+" : ""}${t.change}`,
                t.after,
                t.operator,
                t.remark,
              ])}
            />
          </>
        )}
        {tab === "costs" && (
          <>
            <p className="items-note">
              以下為每筆進貨的歷史快照，修改品項參考成本不會改寫本紀錄。
            </p>
            <BaseDataTable
              tableKey={`items-costs-${item.id}-${filter.warehouse}`}
              headers={[
                "進貨單號",
                "入庫日期",
                "供應商",
                "批號",
                "進貨數量",
                "單位成本",
                "小計",
              ]}
              rows={visibleCosts.map((c) => [
                c.order,
                c.date,
                c.supplier,
                c.batchNumber,
                c.quantity,
                c.unitCost.toFixed(4),
                (c.quantity * c.unitCost).toFixed(2),
              ])}
            />
          </>
        )}
      </div>
      <details className="items-detail-facts">
        <summary>
          品項資料<span>英文名稱、供應商、價格與其他資料</span>
        </summary>
        <dl className="items-facts">
          {[
            ["料號", item.code],
            ["英文名稱", item.englishName || "—"],
            ["健保碼", item.nhiCode || "—"],
            ["國際條碼", item.barcode || "—"],
            ["規格", item.specification || "—"],
            ["分類", item.category],
            ["基本單位", item.unit],
            ["三個月最低庫存", String(item.safetyStock)],
            ["六個月最低庫存", String(item.safetyStockSixMonths)],
            ["預設供應商", item.supplier || "—"],
            [
              "參考成本",
              item.referenceCost === ""
                ? "—"
                : Number(item.referenceCost).toFixed(4),
            ],
            [
              "建議售價",
              item.suggestedPrice === ""
                ? "—"
                : Number(item.suggestedPrice).toFixed(2),
            ],
            ["使用狀態", usageStatus(item)],
            [
              "使用期間",
              `${item.effectiveFrom} ～ ${item.effectiveUntil || "無期限"}`,
            ],
            ["備註", item.remark || "—"],
          ].map(([title, value]) => (
            <div key={title}>
              <dt>{title}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}
