import { useState } from "react";
import { BaseButton } from "@/components/ui/BaseButton";
import { BaseTabs } from "@/components/ui/BaseTabs";
import {
  BaseTable,
  BaseTableHeader,
  BaseTableBody,
  BaseTableRow,
  BaseTableHead,
  BaseTableCell,
} from "@/components/ui/BaseTable";
import { useAppSelector } from "@/store/hooks";
import {
  money,
  pendingRefund,
  refundStatus,
  refunded,
  saleStatus,
  saleActionReason,
  qty,
} from "./model";
import type { Sale, SaleDetailTab } from "@/types/pos";
import "./sale-details.css";

export function SaleDetails({
  sale,
  onClose,
  onReturn,
  onVoid,
  onRefund,
  onViewReturn,
  authorized,
  initialTab = "lines",
}: {
  sale: Sale;
  onClose: () => void;
  onReturn: () => void;
  onVoid: () => void;
  onRefund: (id: string) => void;
  onViewReturn: (id: string) => void;
  authorized: boolean;
  initialTab?: SaleDetailTab;
}) {
  const [tab, setTab] = useState<SaleDetailTab>(initialTab);
  const allMovements = useAppSelector((root) => root.pos.movements);
  const movements = allMovements.filter((row) => row.saleId === sale.id);
  const status = saleStatus(sale);
  const waiting = pendingRefund(sale);
  const paidRefund = refunded(sale);
  const pendingRecords = sale.refunds.filter(
    (record) => record.status === "待退款",
  );
  const invoiceStatus =
    !sale.invoiceStatus || sale.invoiceStatus === "未開立（未串接）"
      ? "不開立"
      : sale.invoiceStatus;
  return (
    <>
      <div
        className="items-modal-scroll pos-receipt sale-details"
        id="pos-receipt"
      >
        <header className="sale-detail-heading">
          <div>
            <h3>{sale.number}</h3>
            <p>{sale.date}</p>
          </div>
          <div className="sale-detail-status">
            <span
              className={`items-status ${sale.void ? "neutral" : status === "完成" ? "" : "info"}`}
            >
              {status}
            </span>
            <span
              className={`items-status ${waiting > 0 ? "warning" : paidRefund > 0 ? "" : "neutral"}`}
            >
              {refundStatus(sale)}
            </span>
          </div>
        </header>
        <dl className="sale-detail-facts">
          <div>
            <dt>顧客</dt>
            <dd>
              {sale.customer.name}
              {sale.customer.phone && <small>{sale.customer.phone}</small>}
            </dd>
          </div>
          <div>
            <dt>收銀人員</dt>
            <dd>{sale.cashier}</dd>
          </div>
          <div>
            <dt>付款方式</dt>
            <dd>{sale.payment.method}</dd>
          </div>
          <div>
            <dt>銷售倉別</dt>
            <dd>{sale.warehouse}</dd>
          </div>
        </dl>
        <div
          className="sale-detail-totals"
          role="region"
          aria-label="交易金額摘要"
        >
          <div>
            <span>原成交</span>
            <strong>{money(sale.total)}</strong>
          </div>
          <div>
            <span>已實際退款</span>
            <strong>{money(paidRefund)}</strong>
          </div>
          <div className={waiting > 0 ? "has-pending" : undefined}>
            <span>待退款</span>
            <strong>{money(waiting)}</strong>
          </div>
        </div>
        {pendingRecords.length > 0 && (
          <section className="sale-detail-pending" aria-label="待處理退款">
            <h4>待退款 {money(waiting)}</h4>
            <p>尚未實際退款，確認後才計入已退款金額。</p>
            {pendingRecords.map((refund) => (
              <div key={refund.id}>
                <span>
                  {refund.sourceId.startsWith("VOID") ? "作廢退款" : "退貨退款"}
                  ・{refund.method}・<strong>{money(refund.amount)}</strong>
                </span>
                <BaseButton
                  variant="outline"
                  size="sm"
                  aria-label={`確認退款 ${refund.id}`}
                  disabled={!authorized}
                  title={!authorized ? "需主管／財務權限" : undefined}
                  onClick={() => onRefund(refund.id)}
                >
                  確認退款
                </BaseButton>
              </div>
            ))}
          </section>
        )}
        <BaseTabs
          id="sale-detail"
          label="銷售明細內容"
          value={tab}
          options={[
            { value: "lines", label: "商品明細" },
            { value: "payment", label: "付款資訊" },
            { value: "history", label: "退貨與退款" },
          ]}
          onChange={setTab}
        />
        <div
          id="sale-detail-panel"
          role="tabpanel"
          aria-labelledby={`sale-detail-${tab}`}
          tabIndex={0}
        >
          <section className="sale-tab-content" hidden={tab !== "lines"}>
            <div className="sale-detail-table-wrap">
              <BaseTable
                className="sale-detail-table"
                aria-label="已售商品明細"
              >
                <BaseTableHeader>
                  <BaseTableRow>
                    {[
                      "商品／規格",
                      "數量",
                      "單價",
                      "單品折扣",
                      "整單分攤",
                      "成交淨額",
                    ].map((label) => (
                      <BaseTableHead key={label} scope="col">
                        {label}
                      </BaseTableHead>
                    ))}
                  </BaseTableRow>
                </BaseTableHeader>
                <BaseTableBody>
                  {sale.lines.map((line) => (
                    <BaseTableRow key={line.id}>
                      <BaseTableCell className="sale-detail-product">
                        <strong>{line.name}</strong>
                        {line.gift && (
                          <span className="pos-gift-badge">贈送</span>
                        )}
                        <small>
                          {line.code}・{line.specification}
                        </small>
                      </BaseTableCell>
                      <BaseTableCell data-label="數量">
                        {line.quantity} {line.unit}
                      </BaseTableCell>
                      <BaseTableCell data-label="單價">
                        {money(line.price)}
                      </BaseTableCell>
                      <BaseTableCell data-label="單品折扣">
                        {line.discount ? money(line.discount) : "—"}
                      </BaseTableCell>
                      <BaseTableCell data-label="整單分攤">
                        {line.orderShare ? money(line.orderShare) : "—"}
                      </BaseTableCell>
                      <BaseTableCell
                        data-label="成交淨額"
                        className="sale-detail-net"
                      >
                        {money(line.net)}
                      </BaseTableCell>
                    </BaseTableRow>
                  ))}
                </BaseTableBody>
              </BaseTable>
            </div>
            <div className="sale-detail-discounts">
              <span>商品小計 {money(sale.subtotal)}</span>
              {sale.orderDiscount > 0 && (
                <span>整單折扣 {money(sale.orderDiscount)}</span>
              )}
            </div>
          </section>
          <section className="sale-tab-content" hidden={tab !== "payment"}>
            <dl className="sale-detail-facts sale-payment-facts">
              <div>
                <dt>付款方式</dt>
                <dd>{sale.payment.method}</dd>
              </div>
              <div>
                <dt>付款狀態</dt>
                <dd>
                  <span
                    className={`items-status ${sale.payment.confirmed ? "" : "warning"}`}
                  >
                    {sale.payment.confirmed ? "已收款" : "待確認"}
                  </span>
                </dd>
              </div>
              {sale.payment.reference && (
                <div>
                  <dt>付款參考號碼</dt>
                  <dd>{sale.payment.reference}</dd>
                </div>
              )}
            </dl>
            {sale.remark && (
              <div className="sale-detail-remark">
                <h4>銷售備註</h4>
                <p>{sale.remark}</p>
              </div>
            )}
            <details className="sale-document-info">
              <summary>單據資訊</summary>
              <dl className="sale-detail-facts">
                <div>
                  <dt>銷售主體</dt>
                  <dd>{sale.seller}</dd>
                </div>
                <div>
                  <dt>單據類型</dt>
                  <dd>{sale.receiptType}</dd>
                </div>
                <div>
                  <dt>發票處理</dt>
                  <dd>{invoiceStatus}</dd>
                </div>
                {sale.sellerTaxId && (
                  <div>
                    <dt>統一編號</dt>
                    <dd>{sale.sellerTaxId}</dd>
                  </div>
                )}
              </dl>
            </details>
          </section>
          <section className="sale-tab-content" hidden={tab !== "history"}>
            {sale.void && (
              <article className="sale-history-card sale-history-void">
                <h4>作廢紀錄</h4>
                <p>{sale.void.reason}</p>
                <small>
                  {sale.void.date}・{sale.void.actor}
                </small>
              </article>
            )}
            <h4>退貨紀錄</h4>
            {sale.returns.length ? (
              sale.returns.map((record) => (
                <article className="sale-history-card" key={record.id}>
                  <header>
                    <BaseButton
                      variant="record-link"
                      onClick={() => onViewReturn(record.id)}
                    >
                      {record.number}
                    </BaseButton>
                    <strong>{record.date}</strong>
                    <span>{record.actor}</span>
                  </header>
                  <p>{record.reason}</p>
                  <ul>
                    {record.lines.map((line) => {
                      const item = sale.lines.find(
                        (entry) => entry.id === line.lineId,
                      );
                      return (
                        <li key={line.lineId}>
                          <strong>{item?.name}</strong>・退回 {line.quantity}{" "}
                          {item?.unit}・{line.disposition}
                          <span>應退 {money(line.refund)}</span>
                          {line.allocations.length > 0 && (
                            <small>
                              已回庫{" "}
                              {qty(
                                line.allocations.reduce(
                                  (sum, allocation) =>
                                    sum + allocation.quantity,
                                  0,
                                ),
                              )}{" "}
                              {item?.unit}
                            </small>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </article>
              ))
            ) : (
              <p className="sale-history-empty">尚無退貨。</p>
            )}
            <h4>退款紀錄</h4>
            {sale.refunds.length ? (
              sale.refunds.map((refund) => (
                <article className="sale-history-card" key={refund.id}>
                  <header>
                    <strong>
                      {money(refund.amount)}・{refund.method}
                    </strong>
                    <span
                      className={`items-status ${refund.status === "待退款" ? "warning" : ""}`}
                    >
                      {refund.status}
                    </span>
                  </header>
                  {refund.status === "已退款" ? (
                    <>
                      <p>
                        {refund.confirmedAt}・{refund.actor}
                      </p>
                      {refund.reference && (
                        <small>退款參考：{refund.reference}</small>
                      )}
                    </>
                  ) : (
                    <p>尚未實際退款</p>
                  )}
                </article>
              ))
            ) : (
              <p className="sale-history-empty">尚無退款。</p>
            )}
            <details className="sale-document-info sale-operation-trace">
              <summary>作業追蹤</summary>
              <p>交易識別碼：{sale.requestId}</p>
              <p>授權紀錄：{sale.authorization}</p>
              {movements.map((record) => (
                <p key={record.id}>
                  {record.time}・{record.type}・{record.quantity}・
                  {record.actor}
                </p>
              ))}
            </details>
          </section>
        </div>
      </div>
      <footer className="items-modal-footer sale-detail-footer">
        <BaseButton variant="outline" onClick={onClose}>
          關閉
        </BaseButton>
        <BaseButton variant="outline" onClick={() => window.print()}>
          列印明細
        </BaseButton>
        <BaseButton
          variant="outline"
          disabled={Boolean(saleActionReason(sale, "return", authorized))}
          title={saleActionReason(sale, "return", authorized) || undefined}
          onClick={onReturn}
        >
          銷售退貨
        </BaseButton>
        <BaseButton
          variant="outline"
          disabled={Boolean(saleActionReason(sale, "void", authorized))}
          title={saleActionReason(sale, "void", authorized) || undefined}
          onClick={onVoid}
        >
          作廢交易
        </BaseButton>
      </footer>
    </>
  );
}
