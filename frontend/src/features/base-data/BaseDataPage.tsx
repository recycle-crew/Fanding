import { useState } from "react";
import { Building2, Plus } from "lucide-react";
import { BaseButton } from "@/components/ui/BaseButton";
import { BaseInput } from "@/components/ui/BaseInput";
import { BaseTextarea } from "@/components/ui/BaseTextarea";
import { BaseLabel } from "@/components/ui/BaseLabel";
import {
  BaseNativeSelect as Select,
  BaseNativeSelectOption as Option,
} from "@/components/ui/BaseNativeSelect";
import { BaseSwitch } from "@/components/ui/BaseSwitch";
import { BaseDataTable } from "@/components/ui/BaseDataTable";
import { BaseWorkspaceModal } from "@/components/ui/BaseWorkspaceModal";
import { BaseField, BaseForm } from "@/components/ui/BaseForm";
import { BaseTabs } from "@/components/ui/BaseTabs";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  blankBaseData,
  saveBaseData,
  deleteBaseData,
  toggleBaseData,
} from "@/store/baseData";
import type { BaseDataKind, BaseDataRecord } from "@/types/base-data";
import { useWorkspaceDirty } from "@/features/workspace/useWorkspaceDirty";
import "@/features/items/items.css";
import "@/features/purchases/purchases.css";
import "./base-data.css";

export function BaseDataPage() {
  const masterData = useAppSelector((state) => state.baseData);
  const inventory = useAppSelector((state) => state.items);
  const purchases = useAppSelector((state) => state.purchases.orders);
  const sales = useAppSelector((state) => state.pos.sales);
  const stocktakes = useAppSelector((state) => state.stocktakes.orders);
  const records = {
    warehouses: masterData.warehouses.map((row) => ({
      ...row,
      used:
        row.used ||
        inventory.batches.some((batch) => batch.warehouse === row.name) ||
        purchases.some((order) => order.warehouse === row.name) ||
        sales.some((order) => order.warehouse === row.name) ||
        stocktakes.some((order) => order.warehouse === row.name),
    })),
    suppliers: masterData.suppliers.map((row) => ({
      ...row,
      used:
        row.used ||
        inventory.items.some((item) => item.supplier === row.name) ||
        purchases.some((order) => order.supplier === row.name),
    })),
  };
  const dispatch = useAppDispatch();
  const [kind, setKind] = useState<BaseDataKind>("warehouses");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [draft, setDraft] = useState<BaseDataRecord | null>(null);
  const [deleting, setDeleting] = useState<BaseDataRecord | null>(null);
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [notice, setNotice] = useState("");
  const noun = kind === "warehouses" ? "倉別" : "供應商";
  useWorkspaceDirty(dirty);
  const rows = records[kind].filter(
    (row) =>
      (status === "all" || row.active === (status === "active")) &&
      [
        row.code,
        row.name,
        row.location,
        row.taxId,
        row.contact,
        row.phone,
        row.email,
        row.address,
        row.remark,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  function close(force = false) {
    if (dirty && !force) {
      setDiscard(true);
      return;
    }
    setDraft(null);
    setDirty(false);
    setDiscard(false);
  }
  function field(
    name: keyof BaseDataRecord,
    label: string,
    required = false,
    type = "text",
  ) {
    return (
      <BaseField
        key={name}
        name={`base-${name}`}
        label={label}
        required={required}
      >
        <BaseInput
          type={type}
          value={String(draft?.[name] ?? "")}
          maxLength={name === "taxId" ? 8 : 200}
          readOnly={name === "code" && Boolean(draft?.id)}
          onChange={(event) =>
            setDraft((row) => row && { ...row, [name]: event.target.value })
          }
        />
      </BaseField>
    );
  }
  const activeCount = records[kind].filter((row) => row.active).length;
  return (
    <div className="items-page base-data-page">
      <header className="items-heading">
        <div className="items-title">
          <Building2 aria-hidden="true" />
          <div>
            <h1>基礎資料管理</h1>
            <p>維護倉別與供應商，建立共用資料的展示畫面</p>
          </div>
        </div>
        <BaseButton
          onClick={() => {
            setDraft(blankBaseData());
            setNotice("");
          }}
        >
          <Plus aria-hidden="true" />
          新增{noun}
        </BaseButton>
      </header>
      <BaseTabs
        id="base-data"
        label="基礎資料類型"
        value={kind}
        options={[
          { value: "warehouses", label: "倉別管理" },
          { value: "suppliers", label: "供應商管理" },
        ]}
        onChange={(value) => {
          setKind(value);
          setSearch("");
          setStatus("all");
        }}
      />
      <div
        role="tabpanel"
        id="base-data-panel"
        aria-labelledby={`base-data-${kind}`}
        tabIndex={0}
      >
        <p className="base-data-summary">
          共 {records[kind].length} 筆{noun}　使用中 {activeCount} 筆　停用{" "}
          {records[kind].length - activeCount} 筆
        </p>
        <div className="base-data-filters">
          <BaseLabel>
            搜尋{noun}
            <BaseInput
              value={search}
              placeholder={
                kind === "warehouses"
                  ? "代碼、名稱、位置或備註"
                  : "名稱、統編、聯絡人或聯絡方式"
              }
              onChange={(event) => setSearch(event.target.value)}
            />
          </BaseLabel>
          <BaseLabel>
            啟用狀態
            <Select
              aria-label="啟用狀態"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <Option value="all">全部</Option>
              <Option value="active">使用中</Option>
              <Option value="inactive">停用</Option>
            </Select>
          </BaseLabel>
          <BaseButton
            variant="outline"
            onClick={() => {
              setSearch("");
              setStatus("all");
            }}
          >
            清除
          </BaseButton>
        </div>
        <p role="status" aria-live="polite">
          {notice}
        </p>
        <BaseDataTable
          tableKey={`base-data-${kind}`}
          headers={
            kind === "warehouses"
              ? ["倉別代碼", "倉別名稱", "位置", "備註", "啟用", "操作"]
              : [
                  "供應商名稱",
                  "統一編號",
                  "聯絡人",
                  "電話",
                  "Email",
                  "地址",
                  "備註",
                  "啟用",
                  "操作",
                ]
          }
          rows={rows.map((row) => [
            ...(kind === "warehouses"
              ? [row.code, row.name, row.location || "—", row.remark || "—"]
              : [
                  row.name,
                  row.taxId || "—",
                  row.contact || "—",
                  row.phone || "—",
                  row.email || "—",
                  row.address || "—",
                  row.remark || "—",
                ]),
            <BaseSwitch
              checked={row.active}
              aria-label={`${row.active ? "停用" : "啟用"}${row.name}`}
              onClick={() => {
                dispatch(toggleBaseData({ kind, id: row.id }));
                setNotice(
                  `${row.name}已${row.active ? "停用" : "啟用"}；歷史紀錄保留。`,
                );
              }}
            />,
            <div className="base-data-actions">
              <BaseButton
                variant="outline"
                onClick={() => {
                  setDraft({ ...row });
                  setNotice("");
                }}
                aria-label={`編輯${row.name}`}
              >
                編輯
              </BaseButton>
              <BaseButton
                variant="outline"
                onClick={() => setDeleting(row)}
                aria-label={`刪除${row.name}`}
              >
                刪除
              </BaseButton>
            </div>,
          ])}
        />
      </div>
      <p className="base-data-footnote">
        展示模式：資料儲存於本次工作階段，重新整理即重置。已引用的資料保留歷史，請以停用取代刪除；既有單據快照不隨主檔變更。
      </p>
      <BaseWorkspaceModal
        open={Boolean(draft)}
        title={`${draft?.id ? "編輯" : "新增"}${noun}`}
        description="請填寫基本資料；＊ 為必填，取消不會更新資料。"
        onClose={() => close()}
      >
        {discard ? (
          <div className="items-modal-scroll">
            <h3>尚有未儲存變更</h3>
            <p>確定放棄目前的修改？</p>
            <div className="base-data-actions">
              <BaseButton
                autoFocus
                variant="outline"
                onClick={() => setDiscard(false)}
              >
                繼續編輯
              </BaseButton>
              <BaseButton onClick={() => close(true)}>放棄變更</BaseButton>
            </div>
          </div>
        ) : (
          draft && (
            <BaseForm
              submitText="儲存"
              onDirty={() => setDirty(true)}
              onCancel={() => close()}
              submit={() => {
                const normalized = {
                  ...draft,
                  name: draft.name.trim(),
                  code: draft.code.trim().toUpperCase(),
                  taxId: draft.taxId.trim(),
                  email: draft.email.trim(),
                };
                if (!normalized.name)
                  return { field: "base-name", message: `請輸入${noun}名稱。` };
                if (kind === "warehouses" && !normalized.code)
                  return { field: "base-code", message: "請輸入倉別代碼。" };
                if (
                  records[kind].some(
                    (row) =>
                      row.id !== draft.id &&
                      (kind === "warehouses"
                        ? row.code.toLowerCase() ===
                          normalized.code.toLowerCase()
                        : row.name === normalized.name),
                  )
                )
                  return {
                    field: kind === "warehouses" ? "base-code" : "base-name",
                    message: `${noun}${kind === "warehouses" ? "代碼" : "名稱"}已存在。`,
                  };
                if (normalized.taxId && !/^\d{8}$/.test(normalized.taxId))
                  return {
                    field: "base-taxId",
                    message: "統一編號須為 8 位數字。",
                  };
                dispatch(
                  saveBaseData({
                    kind,
                    record: {
                      ...normalized,
                      id: draft.id || crypto.randomUUID(),
                    },
                  }),
                );
                setNotice(`${normalized.name}已儲存。`);
                close(true);
              }}
            >
              <section>
                <h3>基本資料</h3>
                <div className="base-data-form-grid">
                  {kind === "warehouses" ? (
                    <>
                      {field("code", "倉別代碼", true)}
                      {field("name", "倉別名稱", true)}
                      {field("location", "位置")}
                    </>
                  ) : (
                    <>
                      {field("name", "供應商名稱", true)}
                      {field("taxId", "統一編號")}
                      {field("contact", "聯絡人")}
                      {field("phone", "電話", false, "tel")}
                      {field("email", "Email", false, "email")}
                      {field("address", "地址")}
                    </>
                  )}
                  <BaseField name="base-remark" label="備註">
                    <BaseTextarea
                      value={draft.remark}
                      maxLength={1000}
                      onChange={(event) =>
                        setDraft({ ...draft, remark: event.target.value })
                      }
                    />
                  </BaseField>
                </div>
              </section>
              <BaseLabel className="base-data-actions">
                啟用狀態
                <BaseSwitch
                  checked={draft.active}
                  aria-label="啟用狀態"
                  onClick={() => {
                    setDraft({ ...draft, active: !draft.active });
                    setDirty(true);
                  }}
                />
                {draft.active ? "使用中" : "停用"}
              </BaseLabel>
              {draft.used && (
                <p>此資料已被引用，可編輯與停用；歷史單據維持原快照。</p>
              )}
            </BaseForm>
          )
        )}
      </BaseWorkspaceModal>
      <BaseWorkspaceModal
        open={Boolean(deleting)}
        title={`刪除${noun}`}
        description="刪除前檢查資料引用狀態。"
        onClose={() => setDeleting(null)}
      >
        <div className="items-modal-scroll">
          {deleting?.used ? (
            <p>
              「{deleting.name}
              」已有庫存或單據引用，無法刪除。請回到列表停用，以保留歷史追溯。
            </p>
          ) : (
            <p>確定刪除「{deleting?.name}」？</p>
          )}
        </div>
        <footer className="items-modal-footer">
          <BaseButton variant="outline" onClick={() => setDeleting(null)}>
            {deleting?.used ? "關閉" : "取消"}
          </BaseButton>
          {!deleting?.used && (
            <BaseButton
              onClick={() => {
                if (deleting)
                  dispatch(deleteBaseData({ kind, id: deleting.id }));
                setNotice(`${deleting?.name}已刪除。`);
                setDeleting(null);
              }}
            >
              確認刪除
            </BaseButton>
          )}
        </footer>
      </BaseWorkspaceModal>
    </div>
  );
}
