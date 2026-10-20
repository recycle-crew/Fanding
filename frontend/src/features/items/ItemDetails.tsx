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
  available,
  batchAverage,
  expiryStatus,
  usageStatus,
  warehouses,
} from "./model";
import type { Item } from "@/types/items";

export function ItemDetails({ item }: { item: Item }) {
  const state = useAppSelector((s) => s.items);
  const [tab, setTab] = useState("batches");
  const [filter, setFilter] = useState({
    start: "",
    end: "",
    warehouse: "",
    type: "",
    batch: "",
  });
  const batches = state.batches.filter((b) => b.itemId === item.id);
  const costs = state.costs.filter((c) => c.itemId === item.id);
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
          <span className="items-kicker">
            {item.group === "HIS_MEDICINE" ? "HIS 藥品" : "自費／OTC／其他商品"}
          </span>
          <h3>{item.name}</h3>
          <p>{item.englishName || "—"}</p>
        </div>
        <div className="items-stock-total">
          <small>總可用庫存</small>
          <strong>
            {batches.reduce((s, b) => s + available(b), 0)}{" "}
            <span>{item.unit}</span>
          </strong>
        </div>
      </div>
      <dl className="items-facts">
        {[
          ["料號", item.code],
          ["健保碼", item.nhiCode || "—"],
          ["國際條碼", item.barcode || "—"],
          ["規格", item.specification || "—"],
          ["分類", item.category],
          ["基本單位", item.unit],
          ["安全庫存", String(item.safetyStock)],
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
            <p className="items-note">
              成本算法：同批次歷次進貨金額 ÷
              進貨數量，僅供展示參考；各筆原始成本請見進貨成本歷史。
            </p>
            <BaseDataTable
              tableKey={`items-batches-${item.id}`}
              headers={[
                "批號",
                "效期",
                "倉別",
                "帳面數量",
                "可用數量",
                "單位",
                "加權平均成本",
                "最近入庫日期",
                "狀態",
              ]}
              rows={batches.map((b) => [
                b.batchNumber || "—",
                b.expiryDate || "—",
                b.warehouse,
                b.quantity,
                available(b),
                item.unit,
                batchAverage(b.id, costs)?.toFixed(4) ?? "—",
                b.receivedAt,
                <span
                  className={`items-status ${expiryStatus(b) === "已過期" ? "danger" : expiryStatus(b) === "即將到期" ? "warning" : ""}`}
                >
                  {expiryStatus(b)}
                </span>,
              ])}
            />
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
                倉別
                <BaseNativeSelect
                  aria-label="倉別"
                  value={filter.warehouse}
                  onChange={(e) =>
                    setFilter({ ...filter, warehouse: e.target.value })
                  }
                >
                  <BaseNativeSelectOption value="">全部倉別</BaseNativeSelectOption>
                  {warehouses.map((w) => (
                    <BaseNativeSelectOption key={w}>{w}</BaseNativeSelectOption>
                  ))}
                </BaseNativeSelect>
              </BaseLabel>
              <BaseLabel>
                異動類型
                <BaseNativeSelect
                  aria-label="異動類型"
                  value={filter.type}
                  onChange={(e) =>
                    setFilter({ ...filter, type: e.target.value })
                  }
                >
                  <BaseNativeSelectOption value="">全部類型</BaseNativeSelectOption>
                  {[...new Set(state.transactions.map((t) => t.type))].map(
                    (t) => (
                      <BaseNativeSelectOption key={t}>{t}</BaseNativeSelectOption>
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
                t.type,
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
              tableKey={`items-costs-${item.id}`}
              headers={[
                "進貨單號",
                "入庫日期",
                "供應商",
                "批號",
                "進貨數量",
                "單位成本",
                "小計",
              ]}
              rows={costs.map((c) => [
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
    </div>
  );
}
