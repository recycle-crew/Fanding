import { BaseButton } from "@/components/ui/BaseButton";
import {
  BaseTable,
  BaseTableHeader,
  BaseTableBody,
  BaseTableRow,
  BaseTableHead,
  BaseTableCell,
} from "@/components/ui/BaseTable";
import {
  money,
  saleStatus,
  saleReturnAmount,
  saleReturnRefunded,
  saleReturnPending,
  saleReturnRefundStatus,
} from "./model";
import type { Sale, SaleReturn } from "@/types/pos";
import "./sale-details.css";

export function SaleReturnDetails({
  sale,
  record,
  authorized,
  onClose,
  onViewSale,
  onRefund,
}: {
  sale: Sale;
  record: SaleReturn;
  authorized: boolean;
  onClose: () => void;
  onViewSale: () => void;
  onRefund: (refundId: string) => void;
}) {
  const refunds = sale.refunds.filter(
    (refund) => refund.sourceId === record.id,
  );
  const waiting = saleReturnPending(sale, record);
  return (
    <>
      <div className="items-modal-scroll sale-details">
        <header className="sale-detail-heading">
          <div>
            <h3>{record.number}</h3>
            <p>退貨日期 {record.date.slice(0, 10)}</p>
          </div>
          <span className={`items-status ${waiting > 0 ? "warning" : ""}`}>
            {saleReturnRefundStatus(sale, record)}
          </span>
        </header>
        <div className="sale-return-source">
          <span>原銷售單</span>
          <BaseButton
            variant="record-link"
            size="sm"
            aria-label={`查看原銷售單 ${sale.number}`}
            onClick={onViewSale}
          >
            {sale.number}
          </BaseButton>
          <small>原銷售狀態：{saleStatus(sale)}</small>
        </div>
        <dl className="sale-detail-facts">
          <div>
            <dt>顧客</dt>
            <dd>{sale.customer.name}</dd>
          </div>
          <div>
            <dt>經辦人</dt>
            <dd>{record.actor}</dd>
          </div>
          <div>
            <dt>退款方式</dt>
            <dd>{record.method}</dd>
          </div>
          <div>
            <dt>建立時間</dt>
            <dd>{record.createdAt}</dd>
          </div>
        </dl>
        <div
          className="sale-detail-totals"
          role="region"
          aria-label="退貨金額摘要"
        >
          <div>
            <span>應退款金額</span>
            <strong>{money(saleReturnAmount(record))}</strong>
          </div>
          <div>
            <span>已實際退款</span>
            <strong>{money(saleReturnRefunded(sale, record))}</strong>
          </div>
          <div className={waiting > 0 ? "has-pending" : undefined}>
            <span>待退款</span>
            <strong>{money(waiting)}</strong>
          </div>
        </div>
        <div className="sale-detail-remark">
          <h4>退貨原因</h4>
          <p>{record.reason}</p>
        </div>
        <div className="sale-detail-table-wrap">
          <BaseTable className="sale-detail-table" aria-label="退貨商品明細">
            <BaseTableHeader>
              <BaseTableRow>
                {["商品／規格", "退貨數量", "商品處理", "應退款金額"].map(
                  (header) => (
                    <BaseTableHead key={header} scope="col">
                      {header}
                    </BaseTableHead>
                  ),
                )}
              </BaseTableRow>
            </BaseTableHeader>
            <BaseTableBody>
              {record.lines.map((line) => {
                const item = sale.lines.find(
                  (original) => original.id === line.lineId,
                );
                return (
                  <BaseTableRow key={line.lineId}>
                    <BaseTableCell className="sale-detail-product">
                      <strong>{item?.name || "未提供品名"}</strong>
                      <small>
                        {item?.code}・{item?.specification}
                      </small>
                    </BaseTableCell>
                    <BaseTableCell data-label="退貨數量">
                      {line.quantity} {item?.unit}
                    </BaseTableCell>
                    <BaseTableCell data-label="商品處理">
                      {line.disposition}
                    </BaseTableCell>
                    <BaseTableCell
                      data-label="應退款金額"
                      className="sale-detail-net"
                    >
                      {money(line.refund)}
                    </BaseTableCell>
                  </BaseTableRow>
                );
              })}
            </BaseTableBody>
          </BaseTable>
        </div>
        <section className="sale-return-refunds" aria-label="本退貨單退款紀錄">
          <h4>退款紀錄</h4>
          {refunds.length ? (
            refunds.map((refund) => (
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
                {refund.status === "待退款" ? (
                  <>
                    <p>待退款 {money(refund.amount)}；尚未實際退款。</p>
                    <BaseButton
                      variant="outline"
                      disabled={!authorized}
                      title={!authorized ? "需主管／財務權限" : undefined}
                      aria-label={`確認退款 ${refund.id}`}
                      onClick={() => onRefund(refund.id)}
                    >
                      確認退款
                    </BaseButton>
                  </>
                ) : (
                  <>
                    <p>
                      {refund.confirmedAt}・{refund.actor}
                    </p>
                    {refund.reference && (
                      <small>退款參考：{refund.reference}</small>
                    )}
                  </>
                )}
              </article>
            ))
          ) : (
            <p className="sale-history-empty">本退貨單無須退款。</p>
          )}
        </section>
      </div>
      <footer className="items-modal-footer">
        <BaseButton variant="outline" onClick={onClose}>
          關閉
        </BaseButton>
        <BaseButton variant="outline" onClick={onViewSale}>
          原銷售明細
        </BaseButton>
      </footer>
    </>
  );
}
