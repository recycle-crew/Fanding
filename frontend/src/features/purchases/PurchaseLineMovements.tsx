import { BaseButton } from "@/components/ui/BaseButton";
import type { Purchase, PurchaseLine, PurchaseRecord } from "@/types/purchases";
import { lineMovements } from "./lineMovements";
import { operationLabels } from "./model";

const number = (value: number) =>
  value.toLocaleString("zh-TW", { maximumFractionDigits: 3 });
const signed = (value: number) =>
  `${value > 0 ? "+" : value < 0 ? "−" : ""}${number(Math.abs(value))}`;

export function PurchaseLineMovements({
  order,
  line,
  onOpenRecord,
}: {
  order: Purchase;
  line: PurchaseLine;
  onOpenRecord: (record: PurchaseRecord) => void;
}) {
  const movement = lineMovements(order, line);
  return (
    <section
      className="purchase-line-movements"
      aria-label={`${line.name} ${line.batch || "無批號"} 數量異動`}
    >
      <dl className="purchase-movement-summary">
        {[
          ["原始進貨", line.quantity],
          ["已退貨", movement.returned],
          ["已沖銷", movement.reversed],
          ...(movement.corrected !== 0
            ? [["數量更正", movement.corrected]]
            : []),
          ["本單剩餘", movement.remaining],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              {number(Number(value))} {line.unit}
            </dd>
          </div>
        ))}
      </dl>
      <ol
        className="purchase-movement-list"
        aria-label="依建立順序排列的異動紀錄"
      >
        <li className="purchase-movement purchase-movement-in">
          <div className="purchase-movement-main">
            <strong>進貨入庫</strong>
            <span className="purchase-movement-quantity">
              +{number(line.quantity)} {line.unit}
            </span>
            <span>
              剩餘 {number(line.quantity)} {line.unit}
            </span>
          </div>
          <p>
            {order.date} · {order.number} · {order.createdBy}
          </p>
          <p>{line.remark || order.remark || "原始進貨"}</p>
        </li>
        {movement.entries.map(({ record, entry, index, remaining }) => (
          <li
            key={`${record.id}-${index}`}
            className={`purchase-movement purchase-movement-${record.kind}`}
          >
            <div className="purchase-movement-main">
              <strong>
                {record.correctionType || operationLabels[record.kind]}
              </strong>
              <span className="purchase-movement-quantity">
                {entry.quantityChange === 0
                  ? "數量不變"
                  : `${signed(entry.quantityChange)} ${line.unit}`}
              </span>
              <span>
                剩餘 {number(remaining)} {line.unit}
              </span>
            </div>
            <div className="purchase-movement-meta">
              <time dateTime={record.date}>{record.date}</time>
              <BaseButton
                variant="link"
                size="sm"
                onClick={() => onOpenRecord(record)}
                aria-label={`查看異動紀錄 ${record.number}`}
              >
                {record.number}
              </BaseButton>
              <span>{record.operator}</span>
            </div>
            <p>原因：{record.reason || "未填寫"}</p>
            {entry.newUnitCost !== undefined && (
              <p>新參考單位成本 {entry.newUnitCost.toFixed(4)}</p>
            )}
            {entry.replacement && (
              <p>
                另補入 {entry.replacement.name} · 批號{" "}
                {entry.replacement.batch || "無批號"} ·{" "}
                {number(-entry.quantityChange)} {entry.replacement.unit}
              </p>
            )}
            {record.remark && <p>備註：{record.remark}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}
