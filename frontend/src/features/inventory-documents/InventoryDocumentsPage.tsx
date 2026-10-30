import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { BaseTabs } from "@/components/ui/BaseTabs";
import { BaseBadge } from "@/components/ui/BaseBadge";
import { ClipboardMinus, Plus, Trash2 } from "lucide-react";
import { BaseButton } from "@/components/ui/BaseButton";
import { BaseInput } from "@/components/ui/BaseInput";
import { BaseSearchSelect } from "@/components/ui/BaseSearchSelect";
import { useInventoryPeople } from "@/features/people/useInventoryPeople";
import { BaseTextarea } from "@/components/ui/BaseTextarea";
import {
  BaseNativeSelect as Select,
  BaseNativeSelectOption as Option,
} from "@/components/ui/BaseNativeSelect";
import { BaseField as Field, BaseForm } from "@/components/ui/BaseForm";
import { BaseDataTable } from "@/components/ui/BaseDataTable";
import { BaseWorkspaceModal } from "@/components/ui/BaseWorkspaceModal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  saveInventoryDraft,
  deleteInventoryDraft,
  confirmInventoryDocument,
  cancelInventoryDocument,
} from "@/store/inventoryDocuments";
import {
  blankDocument,
  blankDocumentLine,
  disposalReasons,
  documentNoun,
} from "@/features/inventory/documents";
import { available, usageStatus } from "@/features/items/model";
import { useWorkspaceDirty } from "@/features/workspace/useWorkspaceDirty";
import type {
  InventoryDocument,
  InventoryDocumentLine,
} from "@/types/inventory-documents";
import "@/features/items/items.css";
import "@/features/purchases/purchases.css";

const emptyFilters = {
  search: "",
  warehouse: "",
  status: "",
  from: "",
  to: "",
};
function totals(document: InventoryDocument) {
  const result = new Map<string, number>();
  document.lines.forEach((line) =>
    result.set(line.unit, (result.get(line.unit) || 0) + line.quantity),
  );
  return [...result]
    .map(([unit, quantity]) => `${quantity} ${unit}`)
    .join("、");
}
export function InventoryDocumentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const kind =
    searchParams.get("tab") === "disposal" ? "disposal" : "requisition";
  const tabNavigation = useRef(kind);
  tabNavigation.current = kind;
  const dispatch = useAppDispatch();
  const personnel = useInventoryPeople();
  const inventory = useAppSelector((state) => state.items);
  const master = useAppSelector((state) => state.baseData);
  const { orders, persona } = useAppSelector(
    (state) => state.inventoryDocuments,
  );
  const account =
    useAppSelector((state) => state.workspace.currentAccount) || "展示使用者";
  const stocktakes = useAppSelector((state) => state.stocktakes.orders);
  const noun = documentNoun(kind),
    isDisposal = kind === "disposal",
    readonly = persona === "唯讀";
  const [filters, setFilters] = useState(emptyFilters);
  const [draft, setDraft] = useState<InventoryDocument | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [dirty, setDirty] = useState(false);
  const [action, setAction] = useState<
    "confirm" | "cancel" | "delete" | "discard" | null
  >(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useWorkspaceDirty(dirty);
  const selected = orders.find((order) => order.id === selectedId);
  const owner = selected?.createdBy === account || persona === "主管";
  const documents = orders.filter((order) => order.kind === kind);
  const invalidRange = Boolean(
    filters.from && filters.to && filters.from > filters.to,
  );
  const rows = useMemo(
    () =>
      documents.filter(
        (order) =>
          !invalidRange &&
          (!filters.warehouse || order.warehouse === filters.warehouse) &&
          (!filters.status || order.status === filters.status) &&
          (!filters.from || order.date >= filters.from) &&
          (!filters.to || order.date <= filters.to) &&
          [
            order.number,
            order.person,
            order.purpose,
            ...order.lines.flatMap((line) => [
              line.name,
              line.code,
              line.reason,
              line.explanation,
            ]),
          ]
            .join(" ")
            .toLowerCase()
            .includes(filters.search.trim().toLowerCase()),
      ),
    [documents, filters, invalidRange],
  );
  const warehouseOptions = master.warehouses.filter(
    (warehouse) =>
      warehouse.active ||
      (isDisposal &&
        inventory.batches.some(
          (batch) => batch.warehouse === warehouse.name && batch.quantity > 0,
        )),
  );
  const itemOptions = inventory.items.filter(
    (item) =>
      isDisposal ||
      (item.group !== "HIS_MEDICINE" && usageStatus(item) === "使用中"),
  );
  function updateDraft(next: InventoryDocument) {
    setDraft(next);
    setDirty(true);
    setError("");
  }
  function changeLine(id: string, values: Partial<InventoryDocumentLine>) {
    if (draft)
      updateDraft({
        ...draft,
        lines: draft.lines.map((line) =>
          line.id === id ? { ...line, ...values } : line,
        ),
      });
  }
  function close(force = false) {
    if (dirty && !force) {
      setAction("discard");
      return;
    }
    setDraft(null);
    setSelectedId("");
    setDirty(false);
    setAction(null);
    setError("");
    setReason("");
  }
  function startDraft(order = blankDocument(kind)) {
    setDraft(structuredClone(order));
    setSelectedId(order.id);
    setDirty(false);
    setError("");
    setNotice("");
  }
  function performAction() {
    if (!selected) return;
    const result =
      action === "confirm"
        ? dispatch(confirmInventoryDocument(selected.id))
        : action === "cancel"
          ? dispatch(cancelInventoryDocument(selected.id, reason))
          : dispatch(deleteInventoryDraft(selected.id));
    if (result.error) {
      setError(result.error);
      return;
    }
    setNotice(
      action === "confirm"
        ? `${selected.number}已確認並扣庫。`
        : action === "cancel"
          ? `${selected.number}已作廢並沖回原批次。`
          : "草稿已刪除。",
    );
    if (action === "delete") close(true);
    else {
      setAction(null);
      setError("");
      setReason("");
    }
  }
  function beginAction(next: "confirm" | "cancel" | "delete") {
    setAction(next);
    setReason("");
    setError("");
  }
  return (
    <div className="items-page purchases-page">
      <header className="items-heading">
        <div className="items-title">
          <ClipboardMinus aria-hidden="true" />
          <div>
            <h2>領用／報廢管理</h2>
            <p>
              {isDisposal
                ? "處理過期、破損與不可用庫存，保留批次及報廢歷程"
                : "管理內部實際領用，依批次扣庫並追蹤流向"}
            </p>
          </div>
        </div>
        <BaseButton disabled={readonly} onClick={() => startDraft()}>
          <Plus aria-hidden="true" />
          新增{noun}單
        </BaseButton>
      </header>
      <BaseTabs
        id="inventory-documents"
        label="出庫單據類型"
        value={kind}
        options={[
          { value: "requisition", label: "領用" },
          { value: "disposal", label: "報廢" },
        ]}
        onChange={(value) => {
          if (dirty || draft || selected || tabNavigation.current === value)
            return;
          // BaseTabs selects on focus and click; create one history entry per tab change.
          tabNavigation.current = value;
          setFilters(emptyFilters);
          setNotice("");
          setError("");
          setSearchParams((current) => {
            const next = new URLSearchParams(current);
            if (value === "disposal") next.set("tab", value);
            else next.delete("tab");
            return next;
          });
        }}
      />
      <div
        role="tabpanel"
        id="inventory-documents-panel"
        aria-labelledby={`inventory-documents-${kind}`}
        tabIndex={0}
      >
        <p className="items-note">
          展示模式・重新整理後重置。草稿不扣庫，確認出庫後才更新庫存。
        </p>
        <div className="purchase-summary" aria-label={`${noun}單據摘要`}>
          <span>
            {noun}單 <strong>{rows.length}</strong> 筆
          </span>
          <span className="purchase-summary-pending">
            草稿 {rows.filter((order) => order.status === "草稿").length} 筆 ／
            已確認 {rows.filter((order) => order.status === "已確認").length} 筆
          </span>
        </div>
        <section
          className="items-filter-bar purchase-filters"
          aria-label={`${noun}查詢`}
        >
          <Field name="document-search" label="關鍵字">
            <BaseInput
              placeholder={
                isDisposal
                  ? "單號、品項、經辦人或原因"
                  : "單號、品項、領用人或部門／用途"
              }
              value={filters.search}
              onChange={(event) =>
                setFilters({ ...filters, search: event.target.value })
              }
            />
          </Field>
          <Field name="document-warehouse-filter" label="查詢倉別">
            <Select
              value={filters.warehouse}
              onChange={(event) =>
                setFilters({ ...filters, warehouse: event.target.value })
              }
            >
              <Option value="">全部</Option>
              {Array.from(
                new Set([
                  ...master.warehouses.map((warehouse) => warehouse.name),
                  ...documents.map((order) => order.warehouse),
                ]),
              ).map((name) => (
                <Option key={name} value={name}>
                  {name}
                </Option>
              ))}
            </Select>
          </Field>
          <Field name="document-status" label="單據狀態">
            <Select
              value={filters.status}
              onChange={(event) =>
                setFilters({ ...filters, status: event.target.value })
              }
            >
              <Option value="">全部</Option>
              {["草稿", "已確認", "已作廢"].map((status) => (
                <Option key={status} value={status}>
                  {status}
                </Option>
              ))}
            </Select>
          </Field>
          <Field name="document-from" label="日期起">
            <BaseInput
              type="date"
              value={filters.from}
              onChange={(event) =>
                setFilters({ ...filters, from: event.target.value })
              }
            />
          </Field>
          <Field name="document-to" label="日期迄">
            <BaseInput
              type="date"
              value={filters.to}
              onChange={(event) =>
                setFilters({ ...filters, to: event.target.value })
              }
            />
          </Field>
          <BaseButton
            variant="outline"
            onClick={() => setFilters(emptyFilters)}
          >
            清除查詢
          </BaseButton>
        </section>
        {invalidRange && (
          <p role="alert" className="items-error">
            查詢起日不可晚於迄日。
          </p>
        )}
        {notice && <p role="status">{notice}</p>}
        <p className="purchase-status-note">
          共 {rows.length} 筆。
          {isDisposal
            ? "報廢請選擇實際庫存批次；不可用部分會同時減少帳面量與不可用量。"
            : "領用限非 HIS 品項；倉庫移轉請另走調撥，避免與 HIS 耗用重複扣帳。"}
        </p>
        <div className="purchase-list-card">
          <BaseDataTable
            key={`${kind}-${JSON.stringify(filters)}`}
            tableKey={`${kind}-documents`}
            headers={[
              "單號／日期",
              "倉別",
              isDisposal ? "經辦人／原因" : "領用人／用途",
              "品項／數量",
              "狀態",
              "操作",
            ]}
            rows={rows.map((order) => [
              <span>
                {order.number}
                <small className="block">{order.date}</small>
              </span>,
              order.warehouse,
              <span>
                {order.person}
                <small className="block">
                  {isDisposal
                    ? [...new Set(order.lines.map((line) => line.reason))].join(
                        "、",
                      )
                    : order.purpose}
                </small>
              </span>,
              <span>
                {new Set(order.lines.map((line) => line.itemId)).size} 種品項
                <small className="block">{totals(order)}</small>
              </span>,
              <BaseBadge
                variant={
                  order.status === "已確認"
                    ? "secondary"
                    : order.status === "已作廢"
                      ? "muted"
                      : "outline"
                }
              >
                {order.status}
              </BaseBadge>,
              <BaseButton
                variant="outline"
                aria-label={`查看${order.number}`}
                onClick={() => {
                  setSelectedId(order.id);
                  setError("");
                }}
              >
                查看
              </BaseButton>,
            ])}
          />
        </div>
      </div>
      <BaseWorkspaceModal
        open={Boolean(draft || selected)}
        title={
          action === "discard"
            ? "尚有未儲存變更"
            : action === "confirm"
              ? `確認${noun}出庫`
              : action === "cancel"
                ? `作廢${noun}單`
                : action === "delete"
                  ? "刪除草稿"
                  : draft
                    ? `${draft.id ? "編輯" : "新增"}${noun}單`
                    : `${noun}單 ${selected?.number || ""}`
        }
        description={
          action === "cancel"
            ? "僅用於撤銷錯誤登錄；已實際消耗或銷毀的物品請勿當作實物退回。"
            : "草稿可修改；確認後鎖定，歷史單據保留原資料快照。"
        }
        onClose={() =>
          action && action !== "discard"
            ? (setAction(null), setError(""))
            : close()
        }
      >
        {action === "discard" ? (
          <div className="items-modal-scroll">
            <p>要放棄目前未儲存的修改嗎？</p>
            <footer className="items-modal-footer">
              <BaseButton variant="outline" onClick={() => setAction(null)}>
                繼續編輯
              </BaseButton>
              <BaseButton onClick={() => close(true)}>放棄變更</BaseButton>
            </footer>
          </div>
        ) : action && selected ? (
          <div className="items-modal-scroll">
            <p>
              {selected.number}・{selected.warehouse}・{selected.person}
            </p>
            <ul>
              {selected.lines.map((line) => (
                <li key={line.id}>
                  {line.name}／{line.batchNumber || "無批號"}／{line.quantity}{" "}
                  {line.unit}
                  {isDisposal &&
                    `／${line.reason}／${line.portion === "unavailable" ? "不可用部分" : "一般帳面部分"}`}
                </li>
              ))}
            </ul>
            {action === "confirm" && (
              <p>確認後立即更新品項庫存；庫存不足或盤點中時不會扣帳。</p>
            )}
            {action === "delete" && <p>刪除後無法復原；此草稿尚未扣庫。</p>}
            {action === "cancel" && (
              <Field name="document-cancel-reason" label="作廢原因" required>
                <BaseTextarea
                  value={reason}
                  maxLength={500}
                  onChange={(event) => setReason(event.target.value)}
                />
              </Field>
            )}
            {error && (
              <p role="alert" className="items-error">
                {error}
              </p>
            )}
            <footer className="items-modal-footer">
              <BaseButton
                variant="outline"
                onClick={() => {
                  setAction(null);
                  setError("");
                }}
              >
                返回單據
              </BaseButton>
              <BaseButton
                variant={action === "confirm" ? "default" : "destructive"}
                onClick={performAction}
              >
                {action === "confirm"
                  ? "確認出庫"
                  : action === "cancel"
                    ? "確認作廢並沖回"
                    : "確認刪除草稿"}
              </BaseButton>
            </footer>
          </div>
        ) : draft ? (
          <BaseForm
            submitText="儲存草稿"
            onDirty={() => setDirty(true)}
            onCancel={() => close()}
            submit={() => {
              const person = personnel.people.find(
                (row) => row.id === draft.personId,
              );
              if (!person)
                return {
                  field: "document-person",
                  message: "請從選單選擇有效人員。",
                };
              const result = dispatch(saveInventoryDraft(draft));
              if (result.error) return { message: result.error };
              setDraft(null);
              setDirty(false);
              setSelectedId(result.id || "");
              setError("");
              setNotice("草稿已儲存，尚未扣庫。");
            }}
          >
            <div className="items-form-grid">
              <Field name="document-date" label={`${noun}日期`} required>
                <BaseInput
                  type="date"
                  value={draft.date}
                  onChange={(event) =>
                    updateDraft({ ...draft, date: event.target.value })
                  }
                />
              </Field>
              <Field name="document-warehouse" label="來源倉別" required>
                <Select
                  value={draft.warehouse}
                  onChange={(event) => {
                    if (draft.lines.length) {
                      setError("已有明細，請先移除明細再切換倉別。");
                      return;
                    }
                    updateDraft({ ...draft, warehouse: event.target.value });
                  }}
                >
                  <Option value="">請選擇</Option>
                  {warehouseOptions.map((warehouse) => (
                    <Option key={warehouse.id} value={warehouse.name}>
                      {warehouse.name}
                      {!warehouse.active && "（停用・庫存清理）"}
                    </Option>
                  ))}
                </Select>
              </Field>
              <Field
                name="document-person"
                label={isDisposal ? "經辦人" : "領用人"}
                required
              >
                <BaseSearchSelect
                  value={draft.personId}
                  disabled={personnel.loading || Boolean(personnel.error)}
                  placeholder={
                    personnel.loading
                      ? "載入人員中…"
                      : "搜尋姓名、員工編號或部門"
                  }
                  options={personnel.people.map((person) => ({
                    value: person.id,
                    label: person.name,
                    description: `${person.employeeNumber} / ${person.department}`,
                    keywords: `${person.employeeNumber} ${person.department}`,
                  }))}
                  onValueChange={(personId) => {
                    const person = personnel.people.find(
                      (row) => row.id === personId,
                    );
                    updateDraft({
                      ...draft,
                      personId,
                      person: person?.name || "",
                    });
                  }}
                />
              </Field>
              {personnel.error && (
                <div className="items-field-wide">
                  <p role="alert" className="items-error">
                    {personnel.error}
                  </p>
                  <BaseButton
                    type="button"
                    variant="outline"
                    onClick={personnel.retry}
                  >
                    重新載入人員
                  </BaseButton>
                </div>
              )}
              {!isDisposal && (
                <Field name="document-purpose" label="部門／用途" required>
                  <BaseInput
                    value={draft.purpose}
                    maxLength={200}
                    onChange={(event) =>
                      updateDraft({ ...draft, purpose: event.target.value })
                    }
                  />
                </Field>
              )}
            </div>
            {stocktakes.some(
              (order) =>
                order.warehouse === draft.warehouse &&
                ["盤點中", "待核對"].includes(order.status),
            ) && (
              <p role="status">
                此倉別正在盤點，可儲存草稿，確認出庫會被阻擋。
              </p>
            )}
            <section>
              <h3>{noun}明細</h3>
              <Field
                name="document-item-search"
                label="搜尋品項"
                hint="可輸入料號、品名、國際條碼、健保碼或規格，選取後加入明細。"
              >
                <BaseSearchSelect
                  value=""
                  disabled={!draft.warehouse}
                  placeholder="輸入料號、名稱或國際條碼"
                  emptyText="此倉別沒有符合的可用品項"
                  options={itemOptions
                    .filter((item) =>
                      inventory.batches.some(
                        (batch) =>
                          batch.itemId === item.id &&
                          batch.warehouse === draft.warehouse &&
                          (isDisposal
                            ? batch.quantity > 0
                            : available(batch) > 0),
                      ),
                    )
                    .map((item) => ({
                      value: item.id,
                      label: `${item.code} ${item.name}`,
                      description: `${item.specification} / ${item.unit} / 國際條碼 ${item.barcode || "未建立"}`,
                      keywords: `${item.barcode} ${item.nhiCode} ${item.englishName} ${item.specification}`,
                    }))}
                  onValueChange={(itemId) => {
                    if (!itemId) return;
                    const batches = inventory.batches.filter(
                      (batch) =>
                        batch.itemId === itemId &&
                        batch.warehouse === draft.warehouse &&
                        (isDisposal
                          ? batch.quantity > 0
                          : available(batch) > 0),
                    );
                    updateDraft({
                      ...draft,
                      lines: [
                        ...draft.lines,
                        {
                          ...blankDocumentLine(),
                          itemId,
                          batchId: batches.length === 1 ? batches[0].id : "",
                        },
                      ],
                    });
                  }}
                />
              </Field>
              {!draft.lines.length && (
                <p className="items-note">請先選擇倉別，再搜尋並選取品項。</p>
              )}
              {draft.lines.map((line, index) => {
                const item = inventory.items.find(
                  (row) => row.id === line.itemId,
                );
                const batches = inventory.batches.filter(
                  (batch) =>
                    batch.itemId === line.itemId &&
                    batch.warehouse === draft.warehouse &&
                    (isDisposal ? batch.quantity > 0 : available(batch) > 0),
                );
                const batch = inventory.batches.find(
                  (row) => row.id === line.batchId,
                );
                return (
                  <article
                    className="items-editor-section p-3 mb-4"
                    key={line.id}
                  >
                    <div className="items-heading-tools justify-between mb-3">
                      <h4>
                        第 {index + 1} 筆{item ? `・${item.unit}` : ""}
                      </h4>
                      <BaseButton
                        type="button"
                        variant="ghost"
                        aria-label={`移除第${index + 1}筆`}
                        onClick={() =>
                          updateDraft({
                            ...draft,
                            lines: draft.lines.filter(
                              (entry) => entry.id !== line.id,
                            ),
                          })
                        }
                      >
                        <Trash2 aria-hidden="true" />
                        移除
                      </BaseButton>
                    </div>
                    <div className="items-form-grid">
                      <div className="items-field-wide">
                        <strong>
                          {item?.code} {item?.name}
                        </strong>
                        <p className="items-note">
                          {item?.specification} / {item?.unit} / 國際條碼{" "}
                          {item?.barcode || "未建立"}
                        </p>
                      </div>
                      <Field
                        name={`line-batch-${index}`}
                        label={`第${index + 1}筆批次`}
                        required
                      >
                        <Select
                          value={line.batchId}
                          onChange={(event) =>
                            changeLine(line.id, { batchId: event.target.value })
                          }
                        >
                          <Option value="">請選擇</Option>
                          {batches.map((entry) => (
                            <Option key={entry.id} value={entry.id}>
                              {entry.batchNumber || "無批號"}／
                              {isDisposal &&
                                `效期 ${entry.expiryDate || "不適用"}／`}
                              {isDisposal
                                ? `帳面 ${entry.quantity}・不可用 ${entry.unavailable}`
                                : `可用 ${available(entry)}`}
                            </Option>
                          ))}
                        </Select>
                      </Field>
                      {isDisposal && (
                        <Field
                          name={`line-portion-${index}`}
                          label={`第${index + 1}筆庫存部分`}
                          required
                        >
                          <Select
                            value={line.portion}
                            onChange={(event) =>
                              changeLine(line.id, {
                                portion: event.target
                                  .value as InventoryDocumentLine["portion"],
                              })
                            }
                          >
                            <Option value="normal">一般帳面部分</Option>
                            <Option value="unavailable">不可用部分</Option>
                          </Select>
                        </Field>
                      )}
                      <Field
                        name={`line-quantity-${index}`}
                        label={`第${index + 1}筆數量`}
                        required
                      >
                        <BaseInput
                          type="number"
                          min={1}
                          step={1}
                          value={
                            Number.isNaN(line.quantity) ? "" : line.quantity
                          }
                          onChange={(event) =>
                            changeLine(line.id, {
                              quantity:
                                event.target.value === ""
                                  ? NaN
                                  : Number(event.target.value),
                            })
                          }
                        />
                      </Field>
                      {isDisposal && (
                        <>
                          <Field
                            name={`line-reason-${index}`}
                            label={`第${index + 1}筆報廢原因`}
                            required
                          >
                            <Select
                              value={line.reason}
                              onChange={(event) =>
                                changeLine(line.id, {
                                  reason: event.target.value,
                                })
                              }
                            >
                              <Option value="">請選擇</Option>
                              {disposalReasons.map((value) => (
                                <Option key={value} value={value}>
                                  {value}
                                </Option>
                              ))}
                            </Select>
                          </Field>
                          {line.reason === "其他" && (
                            <Field
                              name={`line-explanation-${index}`}
                              label={`第${index + 1}筆原因說明`}
                              required
                            >
                              <BaseInput
                                value={line.explanation}
                                maxLength={500}
                                onChange={(event) =>
                                  changeLine(line.id, {
                                    explanation: event.target.value,
                                  })
                                }
                              />
                            </Field>
                          )}
                        </>
                      )}
                    </div>
                    {batch && (
                      <p>
                        帳面 {batch.quantity}・不可用 {batch.unavailable}・
                        {isDisposal
                          ? `本部分最多 ${line.portion === "unavailable" ? batch.unavailable : batch.quantity - batch.unavailable}`
                          : `可用 ${available(batch)}`}{" "}
                        {item?.unit}
                      </p>
                    )}
                  </article>
                );
              })}
            </section>
            {error && (
              <p role="alert" className="items-error">
                {error}
              </p>
            )}
          </BaseForm>
        ) : (
          selected && (
            <div className="items-modal-scroll">
              <dl className="purchase-facts">
                <div>
                  <dt>狀態</dt>
                  <dd>{selected.status}</dd>
                </div>
                <div>
                  <dt>日期／倉別</dt>
                  <dd>
                    {selected.date}／{selected.warehouse}
                  </dd>
                </div>
                <div>
                  <dt>{isDisposal ? "經辦人" : "領用人"}</dt>
                  <dd>{selected.person}</dd>
                </div>
                {!isDisposal && (
                  <div>
                    <dt>部門／用途</dt>
                    <dd>{selected.purpose}</dd>
                  </div>
                )}
                <div>
                  <dt>建立人</dt>
                  <dd>{selected.createdBy}</dd>
                </div>
                <div>
                  <dt>分單位合計</dt>
                  <dd>{totals(selected)}</dd>
                </div>
              </dl>
              {selected.lines.map((line, index) => (
                <article
                  key={line.id}
                  className="items-editor-section p-3 mb-4"
                >
                  <h3>
                    {index + 1}. {line.code} {line.name}
                  </h3>
                  <p>
                    {line.specification}・{line.quantity} {line.unit}
                  </p>
                  <p>
                    批號：{line.batchNumber || "無批號"}／效期：
                    {line.expiryDate || "不適用"}
                  </p>
                  {isDisposal && (
                    <p>
                      報廢原因：{line.reason}
                      {line.explanation && `：${line.explanation}`}／
                      {line.portion === "unavailable"
                        ? "不可用部分"
                        : "一般帳面部分"}
                    </p>
                  )}
                </article>
              ))}
              <h3>操作歷程</h3>
              <ul className="items-note list-disc pl-5 space-y-2 break-words">
                {selected.audit.map((entry, index) => (
                  <li key={index}>{entry}</li>
                ))}
              </ul>
              {selected.status !== "草稿" && (
                <section>
                  <h3>庫存異動</h3>
                  <ul>
                    {inventory.transactions
                      .filter((entry) => entry.reference === selected.number)
                      .map((entry) => (
                        <li key={entry.id}>
                          {entry.type}・{entry.batchNumber || "無批號"}・
                          {entry.change > 0 ? "+" : ""}
                          {entry.change}・異動後 {entry.after}
                        </li>
                      ))}
                  </ul>
                </section>
              )}
              {selected.cancelReason && (
                <p>作廢原因：{selected.cancelReason}</p>
              )}
              {error && <p role="alert">{error}</p>}
              <footer className="items-modal-footer flex flex-wrap gap-3">
                {selected.status === "草稿" && !readonly && owner && (
                  <>
                    <BaseButton
                      variant="outline"
                      onClick={() => startDraft(selected)}
                    >
                      編輯草稿
                    </BaseButton>
                    <BaseButton
                      variant="destructive"
                      onClick={() => beginAction("delete")}
                    >
                      刪除草稿
                    </BaseButton>
                    <BaseButton onClick={() => beginAction("confirm")}>
                      確認出庫
                    </BaseButton>
                  </>
                )}
                {selected.status === "已確認" && persona === "主管" && (
                  <BaseButton
                    variant="destructive"
                    onClick={() => beginAction("cancel")}
                  >
                    作廢單據
                  </BaseButton>
                )}
                <BaseButton variant="outline" onClick={() => close()}>
                  關閉
                </BaseButton>
              </footer>
            </div>
          )
        )}
      </BaseWorkspaceModal>
    </div>
  );
}
