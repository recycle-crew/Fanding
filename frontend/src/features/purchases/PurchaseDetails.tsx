import { useEffect, useState } from "react";
import { BaseButton } from "@/components/ui/BaseButton";
import { PurchaseLineMovements } from "./PurchaseLineMovements";
import { BaseDataTable } from "@/components/ui/BaseDataTable";
import { moveTabFocus } from "@/features/items/tabKeyboard";
import {
  currency,
  lineBalance,
  originalAmount,
  operationLabels,
  returnStatus,
  correctionStatus,
  reversalStatus,
  pendingAccounting,
} from "./model";
import type { Purchase, PurchaseRecord } from "@/types/purchases";
export function PurchaseDetails({
  order,
  onResolve,
  onSettle,
  initialTab = "lines",
}: {
  order: Purchase;
  onResolve: (record: PurchaseRecord) => void;
  onSettle: () => void;
  initialTab?: string;
}) {
  const [tab, setTab] = useState(initialTab);
  const [linkedRecord, setLinkedRecord] = useState("");
  useEffect(() => {
    if (tab !== "history" || !linkedRecord) return;
    const target = document.getElementById(`purchase-history-${linkedRecord}`);
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: "nearest" });
  }, [tab, linkedRecord]);
  const correctionTotal = order.records
    .filter((r) => r.kind === "correction")
    .reduce((sum, r) => sum + r.amount, 0);
  const historyEvents = [
    {
      id: "purchase",
      kind: "purchase",
      timestamp: order.createdAt || order.date,
      sequence: 0,
      record: null,
    },
    ...(order.settlement
      ? [
          {
            id: "settlement",
            kind: "settlement",
            timestamp:
              order.settlement.createdAt || order.settlement.accountingDate,
            sequence: 1,
            record: null,
          },
        ]
      : []),
    ...order.records.map((record, index) => ({
      id: record.id,
      kind: "record",
      timestamp: record.createdAt || record.date,
      sequence: index + 2,
      record,
    })),
  ].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime() ||
      b.sequence - a.sequence,
  );
  return (
    <div className="items-modal-scroll purchase-details">
      <div className="purchase-order-summary">
        <div className="purchase-order-heading">
          <div>
            <h3>{order.supplier}</h3>
            <p>{order.number}</p>
          </div>
          <div className="purchase-order-total">
            <small>原始進貨金額</small>
            <strong>{currency(originalAmount(order))}</strong>
          </div>
        </div>
        <div className="purchase-order-meta">
          <span>收貨日期 {order.date}</span>
          <span>廠商出貨日期 {order.supplierShippingDate || "未填寫"}</span>
          <span>入庫倉別 {order.warehouse}</span>
        </div>
        <div className="purchase-order-status">
          <span className={`items-status ${order.settlement ? "" : "warning"}`}>
            {reversalStatus(order) === "全部沖銷"
              ? "全部沖銷"
              : order.settlement
                ? "核對完成"
                : "待核對"}
          </span>
          {returnStatus(order) !== "無" && (
            <span className="items-status info">{returnStatus(order)}</span>
          )}
          {correctionStatus(order) !== "無" && (
            <span className="items-status warning">
              {correctionStatus(order)}
            </span>
          )}
          {order.records.some((r) => r.kind === "reversal") && (
            <span className="items-status neutral">
              {reversalStatus(order)}
            </span>
          )}
          {order.settlement && <small>核對完成不代表已付款</small>}
        </div>
      </div>
      <section aria-label="發票資料">
        <h3>發票資料</h3>
        <dl className="purchase-facts">
          {[
            ["發票號碼", order.invoice || "未填寫"],
            ["發票日期", order.invoiceDate || "未填寫"],
            ["稅別", order.tax],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      {pendingAccounting(order).length > 0 && (
        <section aria-label="待處理帳務">
          <h3>待處理帳務（{pendingAccounting(order).length}）</h3>
          {pendingAccounting(order).map((record) => (
            <div key={record.id} className="purchase-settlement-context">
              <span>
                {record.number} · {operationLabels[record.kind]} ·{" "}
                {record.resolution}
              </span>
              <BaseButton variant="outline" onClick={() => onResolve(record)}>
                處理帳務 {record.number}
              </BaseButton>
            </div>
          ))}
        </section>
      )}
      <div
        className="items-tabs"
        role="tablist"
        aria-label="進貨單明細"
        onKeyDown={moveTabFocus}
      >
        {[
          ["lines", "進貨明細"],
          ["settlement", "核對資訊"],
          ["history", "異動及更正歷史"],
        ].map(([key, text]) => (
          <BaseButton
            key={key}
            id={`purchase-detail-tab-${key}`}
            role="tab"
            tabIndex={tab === key ? 0 : -1}
            aria-selected={tab === key}
            aria-controls="purchase-detail-panel"
            variant="ghost"
            onClick={() => setTab(key)}
            onFocus={() => setTab(key)}
          >
            {text}
          </BaseButton>
        ))}
      </div>
      <div
        id="purchase-detail-panel"
        role="tabpanel"
        aria-labelledby={`purchase-detail-tab-${tab}`}
        tabIndex={0}
      >
        {tab === "lines" && (
          <>
            <p className="items-note">
              品名、規格與成本保留進貨當時資料。單據剩餘量已納入退貨、沖銷與數量更正，不代表目前可用庫存。
            </p>
            <div className="purchase-detail-lines">
              <BaseDataTable
                compactPagination
                tableKey={`purchase-lines-${order.id}`}
                headers={[
                  "品項／規格",
                  "批號／效期",
                  "進貨數量",
                  "單位成本",
                  "小計",
                  "單據剩餘量",
                  "數量異動紀錄",
                ]}
                rows={order.lines.map((l) => [
                  <>
                    <strong>{l.name}</strong>
                    <small className="items-secondary">
                      {l.code} · {l.specification || "—"}
                    </small>
                  </>,
                  <>
                    {l.batch || "—"}
                    <small className="items-secondary">{l.expiry || "—"}</small>
                  </>,
                  `${l.quantity} ${l.unit}`,
                  l.unitCost.toFixed(4),
                  currency(l.quantity * l.unitCost),
                  `${lineBalance(order, l).remaining} ${l.unit}`,
                  <PurchaseLineMovements
                    order={order}
                    line={l}
                    onOpenRecord={(record) => {
                      setLinkedRecord(record.id);
                      setTab("history");
                    }}
                  />,
                ])}
              />
            </div>
          </>
        )}
        {tab === "settlement" &&
          (order.settlement ? (
            <>
              <dl className="purchase-amount-comparison">
                <div>
                  <dt>原始核對金額</dt>
                  <dd>{currency(order.settlement.amount)}</dd>
                </div>
                <div>
                  <dt>累計更正金額</dt>
                  <dd>
                    {correctionTotal > 0 ? "+" : ""}
                    {currency(correctionTotal)}
                  </dd>
                </div>
                <div>
                  <dt>更正後參考金額</dt>
                  <dd>{currency(order.settlement.amount + correctionTotal)}</dd>
                </div>
              </dl>
              <p className="purchase-status-note">
                更正後參考金額＝原始核對金額＋累計更正金額；不代表已付款金額。
              </p>
              <dl className="purchase-facts">
                {[
                  ["原核對單號", order.settlement.number],
                  ["帳務歸屬日期", order.settlement.accountingDate],
                  ["核對人員", order.settlement.operator],
                  ["差異原因", order.settlement.differenceReason || "—"],
                  ["核對備註", order.settlement.remark || "—"],
                ].map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="purchase-callout">
                單據核對不代表已付款；原始核對紀錄不會被後續更正覆蓋。
              </p>
            </>
          ) : (
            <div className="purchase-empty purchase-pending-info">
              <strong>此進貨單尚未核對</strong>
              <p>確認發票與金額後，即可完成單據核對。</p>
              <BaseButton
                disabled={reversalStatus(order) === "全部沖銷"}
                onClick={onSettle}
              >
                前往核對
              </BaseButton>
            </div>
          ))}
        {tab === "history" && (
          <div className="purchase-history">
            {historyEvents.map((entry) => {
              if (entry.kind === "purchase")
                return (
                  <article key={entry.id}>
                    <header>
                      <strong>進貨入庫（展示）</strong>
                      <span>{order.date}</span>
                    </header>
                    <p>
                      {order.number} · {order.createdBy} · 原始金額{" "}
                      {currency(originalAmount(order))}
                    </p>
                  </article>
                );
              if (entry.kind === "settlement" && order.settlement)
                return (
                  <article key={entry.id}>
                    <header>
                      <strong>單據核對</strong>
                      <span>{order.settlement.accountingDate}</span>
                    </header>
                    <p>
                      {order.settlement.number} · {order.settlement.operator} ·{" "}
                      {currency(order.settlement.amount)}
                    </p>
                  </article>
                );
              const record = entry.record;
              if (!record) return null;
              return (
                <article
                  key={record.id}
                  id={`purchase-history-${record.id}`}
                  tabIndex={-1}
                  className={
                    linkedRecord === record.id
                      ? "purchase-history-linked"
                      : undefined
                  }
                >
                  <header>
                    <div>
                      <strong>
                        {operationLabels[record.kind]}
                        {record.correctionType
                          ? ` · ${record.correctionType}`
                          : ""}
                      </strong>
                      <small>
                        {record.number} · {record.date} · {record.operator}
                      </small>
                    </div>
                    <span
                      className={`items-status ${record.accountingStatus === "待處理" ? "warning" : ""}`}
                    >
                      {record.kind === "reversal"
                        ? "已沖銷"
                        : record.kind === "return" &&
                            record.resolution === "換貨" &&
                            record.accountingStatus === "待處理"
                          ? "換貨待收貨"
                          : `帳務${record.accountingStatus}`}
                    </span>
                  </header>
                  <p className="purchase-history-amount">
                    {currency(record.amount)}
                  </p>
                  <details className="purchase-history-extra">
                    <summary>原因與處理明細</summary>
                    <p>原因：{record.reason}</p>
                    <dl className="purchase-facts">
                      <div>
                        <dt>
                          {record.kind === "correction"
                            ? "本次更正金額"
                            : "原成本處理金額"}
                        </dt>
                        <dd>{currency(record.amount)}</dd>
                      </div>
                      <div>
                        <dt>處理方式</dt>
                        <dd>{record.resolution}</dd>
                      </div>
                      <div>
                        <dt>供應商確認金額</dt>
                        <dd>
                          {record.resolutionAmount === ""
                            ? "尚未確認"
                            : currency(Number(record.resolutionAmount))}
                        </dd>
                      </div>
                      <div>
                        <dt>相關單號</dt>
                        <dd>
                          {record.reference ||
                            `未提供外部單號（內部追蹤：${record.number}）`}
                        </dd>
                      </div>
                    </dl>
                    {record.exchangeReceipt && (
                      <section
                        className="purchase-exchange-receipt-summary"
                        aria-label="換貨收貨紀錄"
                      >
                        <h4>換貨收貨紀錄</h4>
                        <p>
                          {record.exchangeReceipt.date} ·{" "}
                          {record.exchangeReceipt.warehouse}
                        </p>
                        <p>
                          {record.exchangeReceipt.code} ·{" "}
                          {record.exchangeReceipt.name}（
                          {record.exchangeReceipt.specification}）
                          {record.exchangeReceipt.batch &&
                            ` · 批號 ${record.exchangeReceipt.batch}`}
                          {record.exchangeReceipt.expiry &&
                            ` · 效期 ${record.exchangeReceipt.expiry}`}
                          {` · ${record.exchangeReceipt.quantity} ${record.exchangeReceipt.unit}`}
                        </p>
                      </section>
                    )}
                    {record.lines.length > 0 && (
                      <ul>
                        {record.lines.map((l, i) => (
                          <li key={`${l.lineId}-${i}`}>
                            {
                              order.lines.find(
                                (original) => original.id === l.lineId,
                              )?.name
                            }
                            ：{l.quantityChange > 0 ? "+" : ""}
                            {l.quantityChange}
                            {l.newUnitCost !== undefined &&
                              `；新參考單位成本 ${l.newUnitCost.toFixed(4)}`}
                            {l.replacement &&
                              `；另補入 ${l.replacement.name}／${l.replacement.batch || "無批號"} ${-l.quantityChange} ${l.replacement.unit}`}
                          </li>
                        ))}
                      </ul>
                    )}
                    {record.resolvedAt && (
                      <p className="items-note">
                        帳務完成：{record.resolvedAt} ·{" "}
                        {record.resolvedBy || record.operator}
                      </p>
                    )}
                    {record.remark && <p>備註：{record.remark}</p>}
                  </details>
                  {record.accountingStatus === "待處理" && (
                    <BaseButton
                      variant="outline"
                      onClick={() => onResolve(record)}
                    >
                      完成帳務處理 {record.number}
                    </BaseButton>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
      <details className="purchase-optional-fields">
        <summary>
          其他單據資料<span>建立人員、備註、關聯退貨單</span>
        </summary>
        <dl className="purchase-facts">
          <div>
            <dt>建立人員</dt>
            <dd>{order.createdBy}</dd>
          </div>
          <div>
            <dt>備註</dt>
            <dd>{order.remark || "—"}</dd>
          </div>
          <div>
            <dt>關聯退貨單</dt>
            <dd>{order.relatedReturn || "—"}</dd>
          </div>
        </dl>
      </details>
    </div>
  );
}
