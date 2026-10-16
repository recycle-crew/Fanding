import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useEffect, useRef } from "react";
import { editorFields, executeDemoCommand } from "@/store/demo";
export function EditorPage() {
  const s = useAppSelector((root) => root.demo);
  const dispatch = useAppDispatch();
  const editor = s.editor;
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (editor && !document.body.classList.contains("preview-mode")) {
      root.current?.focus();
      root.current
        ?.querySelector<HTMLElement>(
          "input:not([readonly]),select:not([disabled])",
        )
        ?.focus();
    }
  }, [editor?.kind, editor?.id]);
  if (!editor)
    return <main id="editor" className="editor-page" hidden tabIndex={-1} />;
  const { kind, id, values, lockedFields } = editor;
  const correction = kind === "stocktake-correction";
  const count =
    kind === "stocktake" || correction
      ? s.stocktakes.find((c) => c.id === id)
      : null;
  const requisition =
    kind === "requisitions" ? s.requisitions.find((r) => r.id === id) : null;
  const existing =
    kind === "vendors"
      ? s.vendors.find((v) => v.id === id)
      : kind === "his"
        ? s.hisMedicines.find((p) => p.id === id)
        : s.otcProducts.find((p) => p.id === id);
  const relatedProduct = count
    ? (count.workspace === "HIS" ? s.hisMedicines : s.otcProducts).find(
        (p) => p.id === count.productId,
      )
    : s.otcProducts.find((p) => p.id === requisition?.productId);
  const enabled =
    (existing?.status ?? relatedProduct?.status ?? "啟用") === "啟用";
  const title = correction
    ? "高權限歷史盤點更正"
    : kind === "stocktake"
      ? "編輯盤點實盤數量"
      : kind === "new-receipt"
        ? "條碼未建檔：新增品項並加入傳票"
        : `${id !== null ? "編輯" : "新增"}${kind === "vendors" ? "廠商" : kind === "his" ? "HIS 藥品" : kind === "requisitions" ? "領用資料" : "OTC 品項"}`;
  // 提示僅說明目前限制；料號啟用與修改權限的正式規則仍待使用者確認。
  const readonly = (activation = false) =>
    dispatch(
      executeDemoCommand({
        type: "update",
        update: (d) => {
          d.readonlyReason = activation
            ? "啟用狀態目前不開放修改。"
            : "此欄位已有值，目前不可編輯；只能補填空白欄位。";
        },
      }),
    );
  const close = () => dispatch(executeDemoCommand({ type: "close-editor" }));
  return (
    <main ref={root} id="editor" className="editor-page" tabIndex={-1}>
      <button type="button" data-close className="back-to-list" onClick={close}>
        ← 返回列表
      </button>
      <div className="page-heading">
        <div>
          <p className="eyebrow">資料維護</p>
          <h2 id="editor-title">{title}</h2>
          <p id="editor-description">
            {correction
              ? "高權限更正已送出的歷史資料，必須填寫原因並保留原值。"
              : kind === "stocktake"
                ? "手動填寫實盤數量；送出前可修改草稿，確認送出後鎖定。"
                : s.canEditExistingData
                  ? "高權限展示模式，可修改既有資料；料號與狀態仍由各自規則管理。"
                  : "補填空白欄位後按儲存；已有值的欄位無法修改。"}
          </p>
        </div>
        <button
          type="button"
          id="editor-status"
          className={`activation-status ${enabled ? "enabled" : "inactive"}`}
          title="點擊查看啟用規則說明"
          aria-label="查看啟用狀態的修改限制"
          onClick={() => readonly(true)}
        >
          {enabled ? "啟用" : "未啟用"}
        </button>
      </div>
      <form
        id="editor-form"
        className="panel editor-panel"
        onSubmit={(event) => {
          event.preventDefault();
          dispatch(executeDemoCommand({ type: "save-editor" }));
        }}
      >
        <p id="editor-field-hint" className="field-hint">
          {correction
            ? "更正以追加歷程保存，不重開批次或覆寫原送出紀錄。"
            : kind === "stocktake"
              ? "帳面數量僅供核對；實盤數量需人工填寫，儲存草稿不會調整庫存。"
              : s.canEditExistingData
                ? "修改既有資料會保留欄位原值、新值、修改人員與時間。"
                : "已有值的欄位自動帶入且為唯讀；空白欄位可補填。狀態僅供查看。"}
        </p>
        <p className="field-hint">
          填寫人員：<strong id="editor-filled-by">{s.currentAccount}</strong>
          （登入帳號，自動記錄）
        </p>
        <div
          id="editor-fields"
          className="form-grid tw:grid tw:grid-cols-2 tw:gap-[18px] tw:phone:grid-cols-1"
        >
          {count && (
            <div className="selection full">
              <strong>
                {relatedProduct?.name} · {count.workspace}
              </strong>
              <p>
                料號 {count.productId} · 帳面數量 {count.book}{" "}
                {relatedProduct?.unit}（唯讀）
              </p>
            </div>
          )}
          {kind === "requisitions" && (
            <div className="full field-hint">
              領用時間（唯讀）：
              {requisition?.requisitionedAt
                ? new Date(requisition.requisitionedAt).toLocaleString("zh-TW")
                : requisition
                  ? "未記錄"
                  : "儲存時自動記錄"}
            </div>
          )}
          {editorFields(s, kind, id).map((field) => {
            const locked = field.name in lockedFields;
            const control = {
              name: field.name,
              required: field.required,
              value: values[field.name] ?? "",
              onChange: (
                event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
              ) => {
                const value = event.target.value;
                dispatch(
                  executeDemoCommand({
                    type: "update",
                    update: (d) => {
                      if (d.editor) d.editor.values[field.name] = value;
                    },
                  }),
                );
              },
            };
            return (
              <label key={field.name}>
                <span className="field-label">
                  <span>{field.label}</span>
                  {field.required && (
                    <>
                      {" "}
                      <span className="muted small">必填</span>
                    </>
                  )}
                  <span
                    className={`field-access ${locked ? "readonly" : "editable"}`}
                    onClick={() => {
                      if (locked) readonly();
                    }}
                  >
                    {locked ? "唯讀" : "可補填"}
                  </span>
                </span>
                {field.options ? (
                  locked ? (
                    <div className="locked-select-control">
                      <select {...control} disabled>
                        <option value="">請選擇</option>
                        {field.options.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="readonly-select-trigger"
                        data-locked-field
                        aria-label={`${field.label}為唯讀，查看說明`}
                        onClick={() => readonly()}
                      />
                    </div>
                  ) : (
                    <select {...control}>
                      <option value="">請選擇</option>
                      {field.options.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  )
                ) : (
                  <input
                    {...control}
                    type={field.type ?? "text"}
                    readOnly={locked}
                    onClick={() => {
                      if (locked) readonly();
                    }}
                    onKeyDown={(event) => {
                      if (locked && event.key === "Enter") {
                        event.preventDefault();
                        readonly();
                      }
                    }}
                    list={
                      field.name === "person" && !locked
                        ? "requisition-people"
                        : undefined
                    }
                    autoComplete={field.name === "person" ? "off" : undefined}
                    placeholder={
                      field.name === "person" && !locked
                        ? "輸入或選擇領用人"
                        : undefined
                    }
                    min={
                      field.type === "number"
                        ? kind === "stocktake" ||
                          correction ||
                          ["minStock", "costPrice", "salePrice"].includes(
                            field.name,
                          )
                          ? 0
                          : 1
                        : undefined
                    }
                    max={field.type === "number" ? 1000000 : undefined}
                    step={
                      field.type === "number"
                        ? ["costPrice", "salePrice"].includes(field.name)
                          ? "0.01"
                          : "1"
                        : undefined
                    }
                  />
                )}
              </label>
            );
          })}
          {kind === "requisitions" && (
            <datalist id="requisition-people">
              {[
                ...new Set([
                  ...s.requisitions.map((r) => r.person),
                  "展示護理師",
                  "展示藥師",
                  "展示醫師",
                  "展示行政人員",
                  "展示技術人員",
                ]),
              ].map((person) => (
                <option key={person} value={person} />
              ))}
            </datalist>
          )}
          {["products", "new-receipt"].includes(kind) && (
            <p className="field-hint full">
              啟用／停用日期為固定紀錄，不會隨狀態變更重新取當下時間。
            </p>
          )}
          {correction && (
            <p className="field-hint full">
              原送出數量：{count.actual}
              ；更正會另留歷程，原批次仍鎖定，不會回溯調整目前庫存。
            </p>
          )}
        </div>
        <p id="editor-error" className="error" role="alert">
          {s.errors.editor}
        </p>
        <div className="dialog-actions">
          <button type="button" data-close onClick={close}>
            取消
          </button>
          <button type="submit" className="primary">
            {correction
              ? "儲存歷史更正"
              : kind === "stocktake"
                ? "儲存草稿並返回"
                : "儲存並返回"}
          </button>
        </div>
      </form>
    </main>
  );
}
