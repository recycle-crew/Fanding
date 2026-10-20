import { BaseButton } from "@/components/ui/BaseButton";
import { useAppSelector } from "@/store/hooks";
import { money, refunded, saleStatus } from "./model";
import type { Sale } from "@/types/pos";
export function SaleDetails({
  sale,
  onClose,
  onReturn,
  onVoid,
  onRefund,
  authorized,
}: {
  sale: Sale;
  onClose: () => void;
  onReturn: () => void;
  onVoid: () => void;
  onRefund: (id: string) => void;
  authorized: boolean;
}) {
  const allMovements = useAppSelector((root) => root.pos.movements);
  const movements = allMovements.filter((row) => row.saleId === sale.id);
  return (
    <>
      <div className="items-modal-scroll pos-receipt" id="pos-receipt">
        <h3>{sale.seller} · 展示交易憑證</h3>
        <p>銷售主體統一編號：{sale.sellerTaxId || "未提供／不適用"}</p>
        <p>
          {sale.number} ／ {saleStatus(sale)} ／ {sale.date}
        </p>
        <p>
          顧客：{sale.customer.name}　{sale.customer.phone || "—"}
          <br />
          倉別：{sale.warehouse}　收銀：{sale.cashier}
        </p>
        {sale.lines.map((line) => (
          <article className="pos-return-line" key={line.id}>
            <strong>
              {line.code} {line.name}
            </strong>
            <p>
              {line.specification} ／ {line.category} ／ {line.quantity}{" "}
              {line.unit}
            </p>
            <p>
              原價 {money(line.originalPrice)}，成交單價 {money(line.price)}
              ；單品折扣 {money(line.discount)}，整單分攤{" "}
              {money(line.orderShare)}，明細淨額 {money(line.net)}
            </p>
            <ul>
              {line.allocations.map((allocation) => (
                <li key={allocation.batchId}>
                  {allocation.batchNumber || "無批號"} ／ 效期{" "}
                  {allocation.expiry || "不追蹤"} ／ 出庫 {allocation.quantity}{" "}
                  {line.unit}
                  <small>
                    　歷史出庫估值 {money(allocation.estimatedCost)}
                    ／單位（展示估值，非毛利報表）
                  </small>
                </li>
              ))}
            </ul>
          </article>
        ))}
        <p>
          商品小計 {money(sale.subtotal)} ／ 整單折扣{" "}
          {money(sale.orderDiscount)}
        </p>
        <strong className="pos-total">原成交 {money(sale.total)}</strong>
        <p>
          已實際退款 {money(refunded(sale))} ／ 待退款{" "}
          {money(
            sale.refunds
              .filter((refund) => refund.status === "待退款")
              .reduce((sum, refund) => sum + refund.amount, 0),
          )}{" "}
          ／ 淨銷售 {money(sale.void ? 0 : sale.total - refunded(sale))}
        </p>
        <section>
          <h4>付款紀錄</h4>
          <p>
            {sale.payment.method} ／ 實收 {money(sale.payment.received)} ／ 找零{" "}
            {money(sale.payment.change)} ／{" "}
            {sale.payment.confirmed ? "人工確認完成（展示）" : "待確認"}
          </p>
          <p>
            付款參考：{sale.payment.reference || "—"}
            <br />
            授權紀錄：{sale.authorization}
            <br />
            備註：{sale.remark || "—"}
          </p>
        </section>
        <section>
          <h4>退貨紀錄</h4>
          {sale.returns.length ? (
            sale.returns.map((record) => (
              <article key={record.id}>
                <p>
                  {record.id} ／ {record.date} ／ {record.actor} ／{" "}
                  {record.reason}
                </p>
                <ul>
                  {record.lines.map((line) => (
                    <li key={line.lineId}>
                      {
                        sale.lines.find((entry) => entry.id === line.lineId)
                          ?.name
                      }
                      ：退回 {line.quantity}，{line.disposition}，應退{" "}
                      {money(line.refund)}
                      {line.allocations.length
                        ? `；實際回庫 ${line.allocations.map((allocation) => `${allocation.batchNumber} × ${allocation.quantity}`).join("、")}`
                        : "；未增加可用庫存"}
                    </li>
                  ))}
                </ul>
              </article>
            ))
          ) : (
            <p>尚無退貨。</p>
          )}
        </section>
        <section>
          <h4>退款紀錄</h4>
          {sale.refunds.length ? (
            sale.refunds.map((refund) => (
              <article key={refund.id}>
                <p>
                  {refund.sourceId} ／ {refund.method} ／ {money(refund.amount)}{" "}
                  ／ <strong>{refund.status}</strong>
                </p>
                <p>
                  {refund.reference || "無參考號碼"} ／{" "}
                  {refund.actor || "尚未確認人員"} ／{" "}
                  {refund.confirmedAt || "尚未實際退款"}
                </p>
                {refund.status === "待退款" && (
                  <BaseButton
                    variant="outline"
                    disabled={!authorized}
                    onClick={() => onRefund(refund.id)}
                  >
                    確認退款 {refund.id}
                  </BaseButton>
                )}
              </article>
            ))
          ) : (
            <p>尚無退款。</p>
          )}
        </section>
        {sale.void && (
          <section>
            <h4>作廢紀錄</h4>
            <p>
              {sale.void.reason} ／ {sale.void.actor} ／ {sale.void.date}
            </p>
          </section>
        )}
        <section>
          <h4>單據與發票</h4>
          <p>
            {sale.receiptType} ／ 發票狀態：{sale.invoiceStatus}
          </p>
          <p>僅供展示，不作正式收據或發票；發票串接待後續確認。</p>
          <small>交易識別碼：{sale.requestId}</small>
        </section>
        <details>
          <summary>庫存異動追溯</summary>
          {movements.length ? (
            movements.map((record) => (
              <p key={record.id}>
                {record.time} ／ {record.type} ／ 批次 ID {record.batchId} ／{" "}
                {record.quantity} ／ {record.reference} ／ {record.actor}
              </p>
            ))
          ) : (
            <p>此為歷史種子單據；本次工作階段沒有新增庫存異動。</p>
          )}
        </details>
      </div>
      <footer className="items-modal-footer pos-actions">
        <BaseButton variant="outline" onClick={onClose}>
          關閉
        </BaseButton>
        <BaseButton variant="outline" onClick={() => window.print()}>
          列印展示憑證
        </BaseButton>
        <BaseButton
          variant="outline"
          disabled={
            !authorized || Boolean(sale.void) || saleStatus(sale) === "全部退貨"
          }
          onClick={onReturn}
        >
          銷售退貨
        </BaseButton>
        <BaseButton
          variant="outline"
          disabled={
            !authorized || Boolean(sale.void) || Boolean(sale.returns.length)
          }
          onClick={onVoid}
        >
          作廢交易
        </BaseButton>
      </footer>
    </>
  );
}
