import { BaseCheckbox } from "@/components/ui/BaseCheckbox";
import { BaseLabel } from "@/components/ui/BaseLabel";
import { useState } from "react";
import { BaseButton } from "@/components/ui/BaseButton";
import { BaseInput } from "@/components/ui/BaseInput";
import {
  BaseNativeSelect,
  BaseNativeSelectOption as Option,
} from "@/components/ui/BaseNativeSelect";
import {
  BaseTable,
  BaseTableHeader,
  BaseTableHead,
  BaseTableBody,
  BaseTableCell,
  BaseTableRow,
} from "@/components/ui/BaseTable";
import { useAppSelector } from "@/store/hooks";
import { taipeiToday, usageStatus } from "@/features/items/model";
import { Field, PurchaseForm } from "./FormParts";
import {
  currency,
  lineBalance,
  reversalStatus,
  operationLabels,
  originalAmount,
  rounded,
} from "./model";
import type {
  CorrectionType,
  OperationLine,
  Purchase,
  PurchaseOperation,
  PurchaseRecord,
} from "@/types/purchases";
export type OperationInput = Omit<
  PurchaseRecord,
  "id" | "number" | "operator" | "createdAt"
>;
export function OperationForm({
  order,
  kind,
  onCancel,
  onDirty,
  onSubmit,
}: {
  order: Purchase;
  kind: PurchaseOperation;
  onCancel: () => void;
  onDirty: () => void;
  onSubmit: (value: OperationInput) => void;
}) {
  const items = useAppSelector((s) => s.items.items).filter(
    (i) => usageStatus(i) === "使用中",
  );
  const [draft, setDraft] = useState({
    date: taipeiToday(),
    reason: "",
    resolution: "",
    remark: "",
    physical: false,
    type: "數量更正" as CorrectionType,
    amount: "",
    replacementId: "",
    replacementBatch: "",
    replacementExpiry: "",
  });
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [newCosts, setNewCosts] = useState<Record<string, string>>({});
  const monetary = kind === "correction" && draft.type === "發票金額更正";
  const costOnly = kind === "correction" && draft.type === "成本更正";
  const replacement =
    kind === "correction" && ["品項更正", "批號更正"].includes(draft.type);
  const reversal = kind === "reversal";
  const chosenItem = items.find((i) => i.id === draft.replacementId);
  const choices = order.lines.filter((l) => selected[l.id]);
  const reversalLimit = (line: Purchase["lines"][number]) => {
    const balance = lineBalance(order, line);
    return Math.min(balance.remaining, balance.traceable);
  };
  const returnLimit = (line: Purchase["lines"][number]) =>
    Math.min(
      lineBalance(order, line).remaining,
      lineBalance(order, line).traceable,
    );
  const selectableLines = reversal
    ? order.lines.filter((line) => reversalLimit(line) > 0)
    : [];
  const estimatedAmount = monetary
    ? Number(draft.amount)
    : choices.reduce(
        (s, l) =>
          s +
          (costOnly
            ? (Number(newCosts[l.id]) - l.unitCost) * l.quantity
            : (kind === "correction" && !replacement
                ? Number(quantities[l.id] || 0)
                : -Number(quantities[l.id] || 0)) * l.unitCost),
        0,
      );
  const invalidReversals = choices.filter((line) => {
    const qty = Number(quantities[line.id]);
    return !Number.isFinite(qty) || qty <= 0 || qty > reversalLimit(line);
  });
  const reversalTotal = rounded(
    choices.reduce((sum, line) => {
      const qty = Number(quantities[line.id]);
      return (
        sum +
        (Number.isFinite(qty) && qty > 0 && qty <= reversalLimit(line)
          ? rounded(qty * line.unitCost)
          : 0)
      );
    }, 0),
  );
  const invalidReturns = choices.filter((line) => {
    const quantity = Number(quantities[line.id]);
    return (
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      quantity > returnLimit(line)
    );
  });
  const returnTotal = rounded(
    choices.reduce((sum, line) => {
      const quantity = Number(quantities[line.id]);
      return (
        sum +
        (Number.isFinite(quantity) &&
        quantity > 0 &&
        quantity <= returnLimit(line)
          ? rounded(quantity * line.unitCost)
          : 0)
      );
    }, 0),
  );
  return (
    <PurchaseForm
      onCancel={onCancel}
      onDirty={onDirty}
      footerSummary={
        reversal || kind === "return" ? (
          <div className="purchase-draft-total" role="status">
            <span>
              已選 {choices.length} 筆
              {(reversal ? invalidReversals : invalidReturns).length > 0 &&
                ` · ${(reversal ? invalidReversals : invalidReturns).length} 筆數量待確認`}
            </span>
            <strong>
              {reversal
                ? `本次沖銷金額 ${currency(reversalTotal)}`
                : `退貨商品原成本 ${currency(returnTotal)} · ${
                    draft.resolution === "換貨"
                      ? "換貨收貨待追蹤"
                      : draft.resolution === "退款"
                        ? "退款金額待確認"
                        : draft.resolution === "折讓"
                          ? "折讓金額待確認"
                          : "供應商處理方式待確認"
                  }`}
            </strong>
          </div>
        ) : undefined
      }
      submitText={
        reversal
          ? "下一步：確認沖銷"
          : kind === "return"
            ? "下一步：確認退貨"
            : "檢查並更正"
      }
      submit={() => {
        if (reversalStatus(order) === "全部沖銷")
          return { message: "此單據已全部沖銷，無法再進行異動。" };
        if (kind === "reversal" && order.settlement)
          return { message: "已核對單據請使用核對後更正。" };
        if (kind === "correction" && !order.settlement)
          return { message: "此單據尚未核對。" };
        if (!draft.reason.trim())
          return { message: "請填寫處理原因。", field: "operation-reason" };
        if (kind === "return" && !draft.physical)
          return {
            message: "請先確認商品已實際交付退回。",
            field: "operation-physical",
          };
        if (!monetary && !choices.length)
          return { message: "請至少勾選一筆要處理的商品。" };
        if (replacement && choices.length !== 1)
          return { message: "品項或批號更正一次請選擇一筆原始明細。" };
        if (
          monetary &&
          (!Number.isFinite(Number(draft.amount)) || Number(draft.amount) === 0)
        )
          return {
            message: "請輸入非零的帳務更正金額。",
            field: "operation-amount",
          };
        const lines: OperationLine[] = [];
        for (const line of choices) {
          const amount = costOnly
            ? Number(newCosts[line.id])
            : Number(quantities[line.id]);
          if (
            !Number.isFinite(amount) ||
            (costOnly
              ? newCosts[line.id] === undefined ||
                amount < 0 ||
                amount === line.unitCost
              : !amount ||
                ((kind !== "correction" || replacement) && amount < 0))
          )
            return {
              message: `${line.name}：請填寫有效${costOnly ? "新單位成本（需與原成本不同）" : "處理數量"}。`,
            };
          const delta = costOnly
            ? 0
            : kind === "correction" && !replacement
              ? amount
              : -amount;
          const balance = lineBalance(order, line);
          if (delta < 0 && -delta > balance.remaining)
            return {
              message: `${line.name}：本次數量超過單據剩餘可處理量 ${balance.remaining} ${line.unit}。`,
            };
          if (delta < 0 && -delta > balance.traceable)
            return {
              message: `${line.name}：可追溯剩餘量不足（${balance.traceable} ${line.unit}），請由管理員確認後續交易影響。`,
            };
          const result: OperationLine = {
            lineId: line.id,
            quantityChange: delta,
            amount: rounded(
              costOnly
                ? (amount - line.unitCost) * line.quantity
                : delta * line.unitCost,
            ),
          };
          if (costOnly) result.newUnitCost = amount;
          if (replacement) {
            const target = draft.type === "品項更正" ? chosenItem : undefined;
            if (
              draft.type === "品項更正" &&
              (!target || target.id === line.itemId)
            )
              return {
                message: "請選擇不同的正確商品。",
                field: "operation-replacement",
              };
            if (target && target.unit !== line.unit)
              return {
                message: "展示版不提供單位換算，請選擇相同基本單位的商品。",
                field: "operation-replacement",
              };
            if (
              (target?.trackBatch ?? line.trackBatch) &&
              !draft.replacementBatch.trim()
            )
              return { message: "請填寫正確批號。", field: "operation-batch" };
            if (
              (target?.trackExpiry ?? line.trackExpiry) &&
              !draft.replacementExpiry
            )
              return { message: "請填寫正確效期。", field: "operation-expiry" };
            if (
              !target &&
              draft.replacementBatch === line.batch &&
              draft.replacementExpiry === line.expiry
            )
              return { message: "正確批號或效期需與原資料不同。" };
            result.replacement = {
              itemId: target?.id || line.itemId,
              code: target?.code || line.code,
              name: target?.name || line.name,
              specification: target?.specification || line.specification,
              unit: target?.unit || line.unit,
              batch: draft.replacementBatch,
              expiry: draft.replacementExpiry,
            };
            result.amount = 0;
          }
          lines.push(result);
        }
        onSubmit({
          kind,
          correctionType: kind === "correction" ? draft.type : undefined,
          date: draft.date,
          reason: draft.reason.trim(),
          resolution: kind === "reversal" ? "不適用" : draft.resolution,
          accountingStatus: kind === "reversal" ? "已完成" : "待處理",
          amount: monetary
            ? rounded(Number(draft.amount))
            : kind === "correction"
              ? rounded(lines.reduce((s, l) => s + l.amount, 0))
              : rounded(-lines.reduce((s, l) => s + l.amount, 0)),
          resolutionAmount: "",
          reference: "",
          remark: draft.remark,
          lines,
        });
      }}
    >
      <section>
        <h3>原進貨資訊</h3>
        <dl className="purchase-facts">
          <div>
            <dt>原進貨單號</dt>
            <dd>{order.number}</dd>
          </div>
          <div>
            <dt>供應商／倉別</dt>
            <dd>
              {order.supplier} · {order.warehouse}
            </dd>
          </div>
          <div>
            <dt>原始進貨金額</dt>
            <dd>{currency(originalAmount(order))}</dd>
          </div>
          {kind === "correction" && (
            <div>
              <dt>原核對紀錄</dt>
              <dd>
                {order.settlement
                  ? `${order.settlement.number} · ${currency(order.settlement.amount)}`
                  : "尚未核對"}
              </dd>
            </div>
          )}
        </dl>
      </section>
      <section>
        <h3>{operationLabels[kind]}資料</h3>
        <div className="items-form-grid purchase-header-grid">
          {kind === "correction" && (
            <Field name="operation-type" label="更正類型" required>
              <BaseNativeSelect
                value={draft.type}
                onChange={(e) => {
                  setDraft({
                    ...draft,
                    type: e.target.value as CorrectionType,
                  });
                  setSelected({});
                  setQuantities({});
                  setNewCosts({});
                }}
              >
                {[
                  "數量更正",
                  "品項更正",
                  "批號更正",
                  "成本更正",
                  "發票金額更正",
                ].map((t) => (
                  <Option key={t}>{t}</Option>
                ))}
              </BaseNativeSelect>
            </Field>
          )}
          <Field
            name="operation-date"
            label={`${kind === "return" ? "退貨" : kind === "reversal" ? "沖銷" : "更正"}日期`}
            required
          >
            <BaseInput
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            />
          </Field>
          <Field name="operation-reason" label="處理原因" required>
            <BaseInput
              value={draft.reason}
              onChange={(e) => setDraft({ ...draft, reason: e.target.value })}
              placeholder="請說明本次處理原因"
            />
          </Field>
          {kind !== "reversal" && (
            <Field
              name="operation-resolution"
              label={kind === "return" ? "供應商處理方式" : "帳務處理方式"}
              required
            >
              <BaseNativeSelect
                value={draft.resolution}
                onChange={(e) =>
                  setDraft({ ...draft, resolution: e.target.value })
                }
              >
                <Option value="">請選擇</Option>
                {(kind === "return"
                  ? ["折讓", "退款", "換貨", "待確認"]
                  : ["補貨", "折讓", "退款", "補收", "待確認"]
                ).map((t) => (
                  <Option key={t}>{t}</Option>
                ))}
              </BaseNativeSelect>
            </Field>
          )}
          {monetary && (
            <Field
              name="operation-amount"
              label="本次帳務更正金額"
              required
              hint="補增為正、減少為負；不覆蓋原核對金額。"
            >
              <BaseInput
                type="number"
                step="0.01"
                value={draft.amount}
                onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
              />
            </Field>
          )}
          {!reversal && (
            <>
              <Field name="operation-remark" label="備註">
                <BaseInput
                  value={draft.remark}
                  onChange={(e) =>
                    setDraft({ ...draft, remark: e.target.value })
                  }
                />
              </Field>
            </>
          )}
        </div>
      </section>
      {reversal && (
        <>
          <p className="purchase-callout">
            登錄錯誤請使用沖銷；商品實際退回供應商請使用進貨退貨。原始單據與歷史成本會保留。
          </p>
          <section className="purchase-reversal-lines">
            <h3>選擇沖銷商品</h3>
            <div className="purchase-reversal-selection">
              <span>
                可沖銷 {selectableLines.length} 項 · 已選 {choices.length} 項
              </span>
              <div>
                <BaseButton
                  type="button"
                  variant="outline"
                  disabled={
                    !selectableLines.length ||
                    choices.length === selectableLines.length
                  }
                  onClick={() => {
                    setSelected(
                      Object.fromEntries(
                        selectableLines.map((line) => [line.id, true]),
                      ),
                    );
                    onDirty();
                    requestAnimationFrame(() => {
                      document
                        .getElementById(
                          `reversal-quantity-${selectableLines[0].id}`,
                        )
                        ?.focus();
                    });
                  }}
                >
                  全選可沖銷商品
                </BaseButton>
                <BaseButton
                  type="button"
                  variant="ghost"
                  disabled={!choices.length}
                  onClick={() => {
                    setSelected({});
                    setQuantities({});
                    onDirty();
                  }}
                >
                  清除選取
                </BaseButton>
              </div>
            </div>
            <div className="purchase-table-scroll">
              <BaseTable variant="lines">
                <BaseTableHeader>
                  <BaseTableRow>
                    {[
                      "選擇",
                      "商品／批次",
                      "數量摘要",
                      "本次沖銷數量",
                      "沖銷金額",
                    ].map((text) => (
                      <BaseTableHead key={text}>{text}</BaseTableHead>
                    ))}
                  </BaseTableRow>
                </BaseTableHeader>
                <BaseTableBody>
                  {order.lines.map((line) => {
                    const balance = lineBalance(order, line);
                    const limit = reversalLimit(line);
                    const qty = Number(quantities[line.id]);
                    const invalid =
                      !!selected[line.id] &&
                      (!Number.isFinite(qty) || qty <= 0 || qty > limit);
                    const inputId = `reversal-quantity-${line.id}`;
                    return (
                      <BaseTableRow key={line.id}>
                        <BaseTableCell data-label="選擇">
                          <BaseCheckbox
                            aria-label={`選擇${line.name}`}
                            disabled={limit <= 0}
                            checked={!!selected[line.id]}
                            onCheckedChange={(checked) => {
                              setSelected((current) => ({
                                ...current,
                                [line.id]: checked === true,
                              }));
                              onDirty();
                              if (checked === true)
                                requestAnimationFrame(() =>
                                  document.getElementById(inputId)?.focus(),
                                );
                            }}
                          />
                        </BaseTableCell>
                        <BaseTableCell data-label="商品／批次">
                          <strong>{line.name}</strong>
                          <small>
                            {line.code} · {line.specification}
                          </small>
                          <small>
                            批號 {line.batch || "未填寫"} · 效期{" "}
                            {line.expiry || "未填寫"}
                          </small>
                        </BaseTableCell>
                        <BaseTableCell data-label="數量摘要">
                          <span>
                            原數量 {line.quantity} {line.unit}
                          </span>
                          <small>
                            已處理 {balance.processed} · 剩餘{" "}
                            {balance.remaining}
                          </small>
                          <small>
                            {limit > 0
                              ? `本次最多可沖銷 ${limit} ${line.unit}`
                              : balance.remaining <= 0
                                ? "無剩餘可沖銷量"
                                : "可追溯量不足，無法沖銷"}
                          </small>
                        </BaseTableCell>
                        <BaseTableCell data-label="本次沖銷數量">
                          <BaseInput
                            id={inputId}
                            aria-label={`${line.name}本次數量`}
                            aria-describedby={`${inputId}-hint`}
                            type="number"
                            min="0.001"
                            step="0.001"
                            disabled={!selected[line.id]}
                            required={!!selected[line.id]}
                            value={quantities[line.id] ?? ""}
                            onChange={(e) =>
                              setQuantities((current) => ({
                                ...current,
                                [line.id]: e.target.value,
                              }))
                            }
                          />
                          <small id={`${inputId}-hint`}>
                            {selected[line.id] && invalid
                              ? `請填寫大於 0 且不超過 ${limit} 的數量`
                              : `單位：${line.unit}`}
                          </small>
                          <BaseButton
                            type="button"
                            variant="ghost"
                            disabled={!selected[line.id] || limit <= 0}
                            aria-label={`帶入${line.name}可沖銷量`}
                            onClick={() => {
                              setQuantities((current) => ({
                                ...current,
                                [line.id]: String(limit),
                              }));
                              onDirty();
                              document.getElementById(inputId)?.focus();
                            }}
                          >
                            帶入可沖銷量
                          </BaseButton>
                        </BaseTableCell>
                        <BaseTableCell data-label="沖銷金額">
                          <strong>
                            {selected[line.id] && !invalid
                              ? currency(rounded(qty * line.unitCost))
                              : "—"}
                          </strong>
                          <small>原單位成本 {line.unitCost.toFixed(4)}</small>
                        </BaseTableCell>
                      </BaseTableRow>
                    );
                  })}
                </BaseTableBody>
              </BaseTable>
            </div>
          </section>
          <details className="purchase-optional-fields">
            <summary>備註（選填）{draft.remark && " · 已填寫"}</summary>
            <Field name="operation-remark" label="備註">
              <BaseInput
                value={draft.remark}
                onChange={(e) => setDraft({ ...draft, remark: e.target.value })}
              />
            </Field>
          </details>
        </>
      )}
      {kind === "return" && (
        <>
          <p className="purchase-callout">
            退貨代表商品已實際交付供應商；本次原成本只作數量與成本參考，退款或折讓金額待供應商確認後另行記錄。
          </p>
          <section className="purchase-reversal-lines purchase-return-lines">
            <h3>選擇退貨商品</h3>
            <div className="purchase-reversal-selection">
              <span>
                可退貨{" "}
                {order.lines.filter((line) => returnLimit(line) > 0).length} 項
                · 已選 {choices.length} 項
              </span>
              <div>
                <BaseButton
                  type="button"
                  variant="outline"
                  disabled={
                    !order.lines.some((line) => returnLimit(line) > 0) ||
                    choices.length ===
                      order.lines.filter((line) => returnLimit(line) > 0).length
                  }
                  onClick={() => {
                    const lines = order.lines.filter(
                      (line) => returnLimit(line) > 0,
                    );
                    setSelected(
                      Object.fromEntries(lines.map((line) => [line.id, true])),
                    );
                    onDirty();
                    if (lines[0])
                      requestAnimationFrame(() =>
                        document
                          .getElementById(`return-quantity-${lines[0].id}`)
                          ?.focus(),
                      );
                  }}
                >
                  全選可退貨商品
                </BaseButton>
                <BaseButton
                  type="button"
                  variant="ghost"
                  disabled={!choices.length}
                  onClick={() => {
                    setSelected({});
                    setQuantities({});
                    onDirty();
                  }}
                >
                  清除選取
                </BaseButton>
              </div>
            </div>
            <div className="purchase-table-scroll">
              <BaseTable variant="lines">
                <BaseTableHeader>
                  <BaseTableRow>
                    {[
                      "選擇",
                      "商品／批次",
                      "數量摘要",
                      "本次退貨數量",
                      "退貨商品原成本",
                    ].map((text) => (
                      <BaseTableHead key={text}>{text}</BaseTableHead>
                    ))}
                  </BaseTableRow>
                </BaseTableHeader>
                <BaseTableBody>
                  {order.lines.map((line) => {
                    const balance = lineBalance(order, line);
                    const limit = returnLimit(line);
                    const quantity = Number(quantities[line.id]);
                    const invalid =
                      !!selected[line.id] &&
                      (!Number.isFinite(quantity) ||
                        quantity <= 0 ||
                        quantity > limit);
                    const inputId = `return-quantity-${line.id}`;
                    return (
                      <BaseTableRow key={line.id}>
                        <BaseTableCell data-label="選擇">
                          <BaseCheckbox
                            aria-label={`選擇${line.name}`}
                            disabled={limit <= 0}
                            checked={!!selected[line.id]}
                            onCheckedChange={(checked) => {
                              setSelected((current) => ({
                                ...current,
                                [line.id]: checked === true,
                              }));
                              onDirty();
                              if (checked === true)
                                requestAnimationFrame(() =>
                                  document.getElementById(inputId)?.focus(),
                                );
                            }}
                          />
                        </BaseTableCell>
                        <BaseTableCell data-label="商品／批次">
                          <strong>{line.name}</strong>
                          <small>
                            {line.code} · {line.specification}
                          </small>
                          <small>
                            批號 {line.batch || "未填寫"} · 效期{" "}
                            {line.expiry || "未填寫"}
                          </small>
                        </BaseTableCell>
                        <BaseTableCell data-label="數量摘要">
                          <span>
                            原數量 {line.quantity} {line.unit}
                          </span>
                          <small>
                            已退／沖銷 {balance.processed} · 剩餘{" "}
                            {balance.remaining}
                          </small>
                          <small>
                            {limit > 0
                              ? `本次最多可退 ${limit} ${line.unit}`
                              : balance.remaining <= 0
                                ? "無剩餘可退數量"
                                : "可追溯量不足，無法退貨"}
                          </small>
                        </BaseTableCell>
                        <BaseTableCell data-label="本次退貨數量">
                          <BaseInput
                            id={inputId}
                            aria-label={`${line.name}本次數量`}
                            aria-describedby={`${inputId}-hint`}
                            type="number"
                            min="0.001"
                            max={limit}
                            step="0.001"
                            disabled={!selected[line.id]}
                            required={!!selected[line.id]}
                            value={quantities[line.id] ?? ""}
                            onChange={(e) =>
                              setQuantities((current) => ({
                                ...current,
                                [line.id]: e.target.value,
                              }))
                            }
                          />
                          <small id={`${inputId}-hint`}>
                            {selected[line.id] && invalid
                              ? `請填寫大於 0 且不超過 ${limit} 的數量`
                              : `單位：${line.unit}`}
                          </small>
                          <BaseButton
                            type="button"
                            variant="ghost"
                            disabled={!selected[line.id] || limit <= 0}
                            aria-label={`帶入${line.name}可退貨量`}
                            onClick={() => {
                              setQuantities((current) => ({
                                ...current,
                                [line.id]: String(limit),
                              }));
                              onDirty();
                              document.getElementById(inputId)?.focus();
                            }}
                          >
                            帶入可退貨量
                          </BaseButton>
                        </BaseTableCell>
                        <BaseTableCell data-label="退貨商品原成本">
                          <strong>
                            {selected[line.id] && !invalid
                              ? currency(rounded(quantity * line.unitCost))
                              : "—"}
                          </strong>
                          <small>原單位成本 {line.unitCost.toFixed(4)}</small>
                        </BaseTableCell>
                      </BaseTableRow>
                    );
                  })}
                </BaseTableBody>
              </BaseTable>
            </div>
          </section>
          <BaseLabel variant="check-inline">
            <BaseCheckbox
              id="operation-physical"
              checked={draft.physical}
              onCheckedChange={(checked) => {
                setDraft({ ...draft, physical: checked === true });
                onDirty();
              }}
            />
            已確認商品實際交付退回供應商
          </BaseLabel>
          <details className="purchase-optional-fields">
            <summary>備註（選填）{draft.remark && " · 已填寫"}</summary>
            <Field name="operation-remark" label="備註">
              <BaseInput
                value={draft.remark}
                onChange={(e) => setDraft({ ...draft, remark: e.target.value })}
              />
            </Field>
          </details>
        </>
      )}
      {!monetary && !reversal && kind !== "return" && (
        <section>
          <h3>選擇處理商品</h3>
          <div
            className="purchase-table-scroll"
            role="region"
            tabIndex={0}
            aria-label="處理商品明細，可左右捲動"
          >
            <BaseTable variant="lines">
              <BaseTableHeader>
                <BaseTableRow>
                  {[
                    "選擇",
                    "商品／規格",
                    "批號／效期",
                    "原數量",
                    "已處理量",
                    "可處理量",
                    "可追溯上限",
                    costOnly ? "新單位成本" : "本次數量",
                    "原單位成本",
                  ].map((h) => (
                    <BaseTableHead key={h}>{h}</BaseTableHead>
                  ))}
                </BaseTableRow>
              </BaseTableHeader>
              <BaseTableBody>
                {order.lines.map((l) => {
                  const balance = lineBalance(order, l);
                  return (
                    <BaseTableRow key={l.id}>
                      <BaseTableCell>
                        <BaseCheckbox
                          aria-label={`選擇${l.name}`}
                          checked={!!selected[l.id]}
                          onCheckedChange={(checked) =>
                            setSelected(
                              replacement
                                ? { [l.id]: checked === true }
                                : { ...selected, [l.id]: checked === true },
                            )
                          }
                        />
                      </BaseTableCell>
                      <BaseTableCell>
                        <strong>{l.name}</strong>
                        <small>
                          {l.code} · {l.specification} · {l.unit}
                        </small>
                      </BaseTableCell>
                      <BaseTableCell>
                        {l.batch || "—"}
                        <small>{l.expiry || "—"}</small>
                      </BaseTableCell>
                      <BaseTableCell>{l.quantity}</BaseTableCell>
                      <BaseTableCell>{balance.processed}</BaseTableCell>
                      <BaseTableCell>{balance.remaining}</BaseTableCell>
                      <BaseTableCell>{balance.traceable}</BaseTableCell>
                      <BaseTableCell>
                        <BaseInput
                          aria-label={`${l.name}${costOnly ? "新單位成本" : "本次數量"}`}
                          type="number"
                          step={costOnly ? "0.0001" : "0.001"}
                          min={
                            costOnly
                              ? 0
                              : kind === "correction" && !replacement
                                ? undefined
                                : "0.001"
                          }
                          disabled={!selected[l.id]}
                          required={!!selected[l.id]}
                          value={(costOnly ? newCosts : quantities)[l.id] ?? ""}
                          onChange={(e) =>
                            costOnly
                              ? setNewCosts({
                                  ...newCosts,
                                  [l.id]: e.target.value,
                                })
                              : setQuantities({
                                  ...quantities,
                                  [l.id]: e.target.value,
                                })
                          }
                        />
                      </BaseTableCell>
                      <BaseTableCell>{l.unitCost.toFixed(4)}</BaseTableCell>
                    </BaseTableRow>
                  );
                })}
              </BaseTableBody>
            </BaseTable>
          </div>
          {kind === "correction" && !replacement && !costOnly && (
            <p className="items-note">
              數量少登填正數補入，多登填負數扣除；原始數量不變。
            </p>
          )}
        </section>
      )}
      {replacement && (
        <section>
          <h3>正確商品／批次資料</h3>
          <div className="items-form-grid">
            {draft.type === "品項更正" && (
              <Field name="operation-replacement" label="正確商品" required>
                <BaseNativeSelect
                  value={draft.replacementId}
                  onChange={(e) =>
                    setDraft({ ...draft, replacementId: e.target.value })
                  }
                >
                  <Option value="">請選擇正確商品</Option>
                  {items.map((i) => (
                    <Option key={i.id} value={i.id}>
                      {i.code} · {i.name}（{i.unit}）
                    </Option>
                  ))}
                </BaseNativeSelect>
              </Field>
            )}
            <Field name="operation-batch" label="正確批號">
              <BaseInput
                value={draft.replacementBatch}
                onChange={(e) =>
                  setDraft({ ...draft, replacementBatch: e.target.value })
                }
              />
            </Field>
            <Field name="operation-expiry" label="正確效期">
              <BaseInput
                type="date"
                value={draft.replacementExpiry}
                onChange={(e) =>
                  setDraft({ ...draft, replacementExpiry: e.target.value })
                }
              />
            </Field>
          </div>
        </section>
      )}
      {!reversal && kind !== "return" && (
        <div className="purchase-total">
          <span>
            {monetary || costOnly
              ? "僅更正金額，不異動數量"
              : replacement
                ? "原資料反向處理，另記正確商品／批次"
                : "原始明細與歷史成本會保留"}
          </span>
          <strong>
            {kind === "correction" ? "本次更正金額" : "原成本處理金額"}{" "}
            {currency(
              Number.isFinite(estimatedAmount) && !replacement
                ? kind === "correction"
                  ? estimatedAmount
                  : -estimatedAmount
                : 0,
            )}
          </strong>
        </div>
      )}
      {!reversal && (
        <p className="purchase-callout">
          {kind === "return"
            ? "退貨成本與供應商最後同意的折讓／退款金額分開保存，物流完成不代表帳務完成。"
            : "保留原進貨與核對紀錄，庫存更正與帳務確認分開追蹤。"}
          本頁僅展示單據流程，不連動模組一庫存。
        </p>
      )}
    </PurchaseForm>
  );
}
