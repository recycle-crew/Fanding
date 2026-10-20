import { useState } from "react";
import { BaseButton } from "@/components/ui/BaseButton";
import { BaseDataTable } from "@/components/ui/BaseDataTable";
import { moveTabFocus } from "@/features/items/tabKeyboard";
import {
  currency,
  lineBalance,
  originalAmount,
  operationLabels,
} from "./model";
import type { Purchase, PurchaseRecord } from "@/types/purchases";
export function PurchaseDetails({
  order,
  onResolve,
}: {
  order: Purchase;
  onResolve: (record: PurchaseRecord) => void;
}) {
  const [tab, setTab] = useState("lines");
  return (
    <div className="items-modal-scroll purchase-details">
      <dl className="purchase-facts">
        {[
          ["進貨單號", order.number],
          ["收貨日期", order.date],
          ["供應商", order.supplier],
          ["入庫倉別", order.warehouse],
          ["原始進貨金額", currency(originalAmount(order))],
          ["建立人員", order.createdBy],
          ["備註", order.remark || "—"],
          ["關聯退貨單", order.relatedReturn || "—"],
        ].map(([key, value]) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div
        className="items-tabs"
        role="tablist"
        aria-label="進貨單明細"
        onKeyDown={moveTabFocus}
      >
        {[
          ["lines", "進貨明細"],
          ["settlement", "核對結帳"],
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
              原始品名、規格與進貨成本為歷史快照。剩餘量為單據物流彙總，不代表目前庫存。
            </p>
            <BaseDataTable
              tableKey={`purchase-lines-${order.id}`}
              headers={[
                "料號",
                "品名",
                "規格",
                "批號",
                "效期",
                "原進貨數量",
                "單位",
                "原單位成本",
                "小計",
                "已處理量",
                "淨留存入庫量",
                "明細備註",
              ]}
              rows={order.lines.map((l) => [
                l.code,
                l.name,
                l.specification,
                l.batch || "—",
                l.expiry || "—",
                l.quantity,
                l.unit,
                l.unitCost.toFixed(4),
                currency(l.quantity * l.unitCost),
                lineBalance(order, l).processed,
                lineBalance(order, l).remaining,
                l.remark || "—",
              ])}
            />
          </>
        )}
        {tab === "settlement" &&
          (order.settlement ? (
            <>
              <dl className="purchase-facts">
                {[
                  ["原核對單號", order.settlement.number],
                  ["發票號碼", order.settlement.invoice || "未填寫"],
                  ["發票日期", order.settlement.invoiceDate],
                  ["稅別", order.settlement.tax],
                  ["原始核對金額", currency(order.settlement.amount)],
                  [
                    "累計更正金額",
                    currency(
                      order.records
                        .filter((r) => r.kind === "correction")
                        .reduce((s, r) => s + r.amount, 0),
                    ),
                  ],
                  [
                    "更正後參考金額",
                    currency(
                      order.settlement.amount +
                        order.records
                          .filter((r) => r.kind === "correction")
                          .reduce((s, r) => s + r.amount, 0),
                    ),
                  ],
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
                核對結帳不代表已付款；原始核對紀錄不會被後續更正覆蓋。
              </p>
            </>
          ) : (
            <p className="purchase-empty">
              此進貨單待核對，可由「更多作業」進入核對結帳。
            </p>
          ))}
        {tab === "history" && (
          <div className="purchase-history">
            <article>
              <header>
                <strong>進貨入庫（展示）</strong>
                <span>{order.date}</span>
              </header>
              <p>
                {order.number} · {order.createdBy} · 原始金額{" "}
                {currency(originalAmount(order))}
              </p>
            </article>
            {order.settlement && (
              <article>
                <header>
                  <strong>核對結帳</strong>
                  <span>{order.settlement.accountingDate}</span>
                </header>
                <p>
                  {order.settlement.number} · {order.settlement.operator} ·{" "}
                  {currency(order.settlement.amount)}
                </p>
              </article>
            )}
            {order.records.map((record) => (
              <article key={record.id}>
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
                      : `帳務${record.accountingStatus}`}
                  </span>
                </header>
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
                    <dd>{record.reference || "—"}</dd>
                  </div>
                </dl>
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
                {record.accountingStatus === "待處理" && (
                  <BaseButton
                    variant="outline"
                    onClick={() => onResolve(record)}
                  >
                    完成帳務處理 {record.number}
                  </BaseButton>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
