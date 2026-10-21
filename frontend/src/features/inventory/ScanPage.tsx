import { BaseCheckbox } from "@/components/ui/BaseCheckbox";
import { BaseLabel } from "@/components/ui/BaseLabel";
import { BaseInput } from "@/components/ui/BaseInput";
import { BaseCard } from "@/components/ui/BaseCard";
import { BaseButton } from "@/components/ui/BaseButton";
import {
  BaseNativeSelect,
  BaseNativeSelectOption,
} from "@/components/ui/BaseNativeSelect";
import { BaseBadge } from "@/components/ui/BaseBadge";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { MovementForm } from "@/features/inventory/MovementForm";
import { BaseFilterForm } from "@/components/ui/BaseFilterForm";
import { useEffect, useRef } from "react";
import { executeWorkspaceCommand } from "@/store/workspace";
import { BaseDataTable } from "@/components/ui/BaseDataTable";
import { MovementsTable, MovementVoucher } from "@/features/inventory/render";
import { useCamera } from "@/features/camera/useCamera";
import type { Workspace } from "@/types/workspace";
export function ScanPage() {
  const s = useAppSelector((root) => root.workspace);
  const dispatch = useAppDispatch();
  const { activeModule: module, stocktakeWorkspace: workspace } = s;
  const history = module === "stocktake-history";
  const stocktake = module === "stocktake" || history;
  const products =
    stocktake && workspace === "HIS" ? s.hisMedicines : s.otcProducts;
  const batches = s.stocktakeBatches
    .filter(
      (batch) =>
        batch.workspace === workspace &&
        (history ? Boolean(batch.endedAt) : !batch.endedAt),
    )
    .slice()
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const selectedBatch = (
    history ? s.selectedHistoricalBatchIds : s.selectedStocktakeBatchIds
  )[workspace];
  const batch =
    batches.find((batch) => batch.id === selectedBatch) ?? batches[0];
  const product = products.find(
    (product) => product.id === s.selectedProductId,
  );
  const voucher = s.movementVouchers.find(
    (voucher) => voucher.id === s.selectedMovementVoucherIds[module],
  );
  const counts = s.stocktakes.filter((count) => count.batchId === batch?.id);
  const barcode = useRef<HTMLInputElement>(null);
  const camera = useCamera(
    (code) =>
      dispatch(
        executeWorkspaceCommand({
          type: "lookup",
          barcode: code,
        }),
      ),
    `${module}:${s.loggedIn}:${Boolean(s.editor)}`,
  );

  const action = (action: string, id?: string) =>
    dispatch(
      executeWorkspaceCommand({
        type: "action",
        action,
        id,
      }),
    );
  useEffect(() => {
    if (
      !stocktake &&
      !product &&
      !s.editor &&
      !s.confirmation &&
      !matchMedia("(pointer: coarse)").matches
    )
      barcode.current?.focus();
  }, [
    module,
    product,
    s.editor,
    s.scanBarcode,
    s.confirmation,
    voucher?.lines.length,
  ]);
  useEffect(() => {
    if (
      product &&
      stocktake &&
      !s.editor &&
      !document.body.classList.contains("preview-mode")
    )
      document
        .querySelector<HTMLButtonElement>('[data-action="edit-count"]')
        ?.focus();
    if (product && !stocktake) {
      barcode.current?.blur();
      document.querySelector<HTMLInputElement>("#movement-form input")?.focus();
    }
  }, [product?.id]);
  const identity = (list: string, people: string[], voucherIds?: string[]) => (
    <>
      <BaseLabel>
        批次／傳票編號
        <BaseInput
          name="voucherId"
          list={`${list}-batches`}
          placeholder="所有批次，可輸入日期或傳票編號"
          defaultValue={
            (module === "receipt"
              ? s.receiptMovementFilter
              : s.issueMovementTimeFilter
            ).voucherId
          }
          autoComplete="off"
          inputMode="numeric"
        />
      </BaseLabel>
      <datalist id={`${list}-batches`}>
        {[...new Set(voucherIds ?? [])]
          .filter(Boolean)
          .sort()
          .reverse()
          .map((id) => (
            <BaseNativeSelectOption key={id} value={id} />
          ))}
      </datalist>
      <BaseLabel>
        料號
        <BaseInput
          name="materialNumber"
          placeholder="所有料號"
          defaultValue={
            (module === "receipt"
              ? s.receiptMovementFilter
              : s.issueMovementTimeFilter
            ).materialNumber
          }
        />
      </BaseLabel>
      <BaseLabel>
        人員
        <BaseInput
          name="person"
          list={list}
          placeholder="所有人員"
          autoComplete="off"
          defaultValue={
            (module === "receipt"
              ? s.receiptMovementFilter
              : s.issueMovementTimeFilter
            ).person
          }
        />
      </BaseLabel>
      <datalist id={list}>
        {[...new Set(people)].map((person) => (
          <BaseNativeSelectOption key={person} value={person} />
        ))}
      </datalist>
    </>
  );
  return (
    <>
      {stocktake && (
        <BaseCard variant="panel">
          <div className="toolbar">
            <h3>{history ? "已結束歷史批次" : "進行中的盤點週期"}</h3>
            {!history && (
              <BaseButton
                variant="outline"
                type="button"
                data-action="start-batch"
                disabled={s.stocktakeBatches.some(
                  (b) => b.workspace === workspace && !b.endedAt,
                )}
                onClick={() => action("start-batch")}
              >
                開始新批次
              </BaseButton>
            )}
          </div>
          <BaseLabel>
            查看 {workspace} 批次
            <BaseNativeSelect
              id="stocktake-batch"
              value={batch?.id ?? ""}
              onChange={(e) =>
                dispatch(
                  executeWorkspaceCommand({
                    type: "update",
                    update: (d) => {
                      (history
                        ? d.selectedHistoricalBatchIds
                        : d.selectedStocktakeBatchIds)[workspace] =
                        e.target.value || null;
                      d.selectedProductId = null;
                      d.scanBarcode = "";
                    },
                  }),
                )
              }
            >
              <BaseNativeSelectOption value="">
                請選擇批次
              </BaseNativeSelectOption>
              {batches.map((b) => (
                <BaseNativeSelectOption key={b.id} value={b.id}>
                  {b.name} · {b.id} · {b.endedAt ? "已結束" : "進行中"}
                </BaseNativeSelectOption>
              ))}
            </BaseNativeSelect>
          </BaseLabel>
          {batch ? (
            <div className="batch-summary">
              <p>
                <strong>
                  {batch.name} · {batch.id} ·{" "}
                  {batch.endedAt ? "已結束" : "進行中"}
                </strong>
              </p>
              <p>
                開始：{new Date(batch.startedAt).toLocaleString("zh-TW")} ·{" "}
                {batch.startedBy}
              </p>
              <p>
                結束：
                {batch.endedAt
                  ? new Date(batch.endedAt).toLocaleString("zh-TW")
                  : "尚未結束"}
                {batch.endedBy ? ` · ${batch.endedBy}` : ""}
              </p>
              {!batch.endedAt && (
                <BaseButton
                  variant="outline"
                  type="button"
                  data-action="end-batch"
                  onClick={() => action("end-batch")}
                >
                  結束此批次
                </BaseButton>
              )}
            </div>
          ) : (
            <p className="field-hint">
              {history
                ? "此工作區尚無已結束的歷史盤點紀錄。"
                : "目前沒有進行中的盤點週期，請開始新批次，或從左側「歷史盤點紀錄」查閱已結束紀錄。"}
            </p>
          )}
        </BaseCard>
      )}
      <BaseCard variant="panel">
        {!stocktake && <MovementVoucher />}
        {stocktake && (
          <>
            <BaseLabel className={`max-w-[220px] ${history ? "" : "mb-5"}`}>
              {history ? "查閱工作區" : "盤點工作區"}
              <BaseNativeSelect
                id="stocktake-workspace"
                value={workspace}
                onChange={(e) => {
                  const value = e.target.value as Workspace;
                  dispatch(
                    executeWorkspaceCommand({
                      type: "update",
                      update: (d) => {
                        d.stocktakeWorkspace = value;
                        d.selectedProductId = null;
                        d.scanBarcode = "";
                      },
                    }),
                  );
                }}
              >
                <BaseNativeSelectOption>OTC</BaseNativeSelectOption>
                <BaseNativeSelectOption>HIS</BaseNativeSelectOption>
              </BaseNativeSelect>
            </BaseLabel>
            {history && (
              <p className="field-hint">
                歷史頁僅查詢已結束批次；高權限可追加歷史更正，不能開始或操作現有週期。
              </p>
            )}
          </>
        )}
        {!history && (
          <>
            <form id="scan-form" className="scan-form">
              <BaseLabel>
                國際條碼
                <BaseInput
                  ref={barcode}
                  id="barcode"
                  name="barcode"
                  disabled={stocktake && (!batch || Boolean(batch.endedAt))}
                  value={s.scanBarcode}
                  onChange={(e) => {
                    const value = e.target.value;
                    dispatch(
                      executeWorkspaceCommand({
                        type: "update",
                        update: (d) => {
                          d.scanBarcode = value;
                        },
                      }),
                    );
                  }}
                  placeholder="掃描或輸入條碼後按 Enter"
                  required
                  autoComplete="off"
                  inputMode="numeric"
                  spellCheck={false}
                />
              </BaseLabel>
              {!stocktake ? (
                <BaseButton
                  variant="outline"
                  type="button"
                  data-action="open-barcode-camera"
                  onClick={() => void camera.start()}
                >
                  開啟相機掃碼
                </BaseButton>
              ) : (
                <BaseButton
                  variant="primary"
                  type="submit"
                  disabled={!batch || Boolean(batch.endedAt)}
                >
                  查找品項
                </BaseButton>
              )}
            </form>
            {!stocktake ? (
              <>
                <p className="field-hint scan-hint">
                  電腦：條碼欄已準備接收掃碼槍輸入，請設定掃描後送出
                  Enter。手機：點「開啟相機掃碼」，辨識後自動查詢。
                </p>
                <div
                  id="barcode-camera-panel"
                  className="barcode-camera-panel"
                  hidden={!camera.visible}
                >
                  <video
                    ref={camera.video}
                    autoPlay
                    muted
                    playsInline
                    aria-label="條碼掃描相機預覽"
                  />
                  <p data-camera-status role="status" aria-live="polite">
                    {camera.status}
                  </p>
                  <BaseButton
                    variant="outline"
                    type="button"
                    data-action="close-barcode-camera"
                    onClick={() => {
                      camera.stop();
                      if (!matchMedia("(pointer: coarse)").matches)
                        barcode.current?.focus();
                    }}
                  >
                    關閉相機
                  </BaseButton>
                </div>
              </>
            ) : (
              <div className="samples">
                <BaseButton
                  variant="outline"
                  data-action="sample"
                  disabled={!batch || Boolean(batch.endedAt)}
                  onClick={() => action("sample")}
                >
                  代入已存在條碼
                </BaseButton>
              </div>
            )}
            <p id="scan-error" className="error" role="alert">
              {s.errors.scan}
            </p>
            {s.errors.scan && module === "receipt" && (
              <BaseButton
                variant="outline"
                type="button"
                data-action="add-unknown-barcode"
                onClick={() =>
                  dispatch(
                    executeWorkspaceCommand({
                      type: "open-editor",
                      kind: "new-receipt",
                      barcode: s.scanBarcode,
                    }),
                  )
                }
              >
                新增品項並加入傳票
              </BaseButton>
            )}
            {product && (
              <>
                <div className="selection">
                  <strong>
                    {product.name}{" "}
                    <BaseBadge variant="secondary">{product.id}</BaseBadge>
                  </strong>
                  <p>
                    {product.spec} · 帳面庫存 {product.stock} {product.unit} ·{" "}
                    {product.status}
                  </p>
                </div>
                {!stocktake &&
                (voucher?.submittedAt || voucher?.cancelledAt) ? (
                  <p className="field-hint">
                    本傳票已鎖定，請按「建立傳票」開始下一個批次。
                  </p>
                ) : !stocktake && product.status === "啟用" ? (
                  <MovementForm product={product} />
                ) : !stocktake ? (
                  <p className="error">停用品項不可新增入出庫或領用。</p>
                ) : null}
              </>
            )}
          </>
        )}
      </BaseCard>
      {stocktake ? (
        <>
          <BaseCard variant="panel" className="list-panel">
            <h3>盤點明細</h3>
            <p className="field-hint">
              手動填寫實盤數量並核對盤差，每筆勾選確認後，整個批次一次確認送出；送出後一般人員不能修改；高權限人員可另行更正並留歷程。
            </p>
            <BaseDataTable
              tableKey={`stocktake-${batch?.id ?? workspace}`}
              headers={[
                "品項",
                "帳面數量",
                "實盤數量",
                "盤差",
                "確認盤點",
                "狀態",
                "填寫人員",
                "操作",
              ]}
              editableColumns={["實盤數量", "確認盤點"]}
              privileged={s.canEditExistingData}
              rows={counts.map((count) => {
                const p = products.find((p) => p.id === count.productId);
                const actual = count.correctedActual ?? count.actual;
                const difference = actual === null ? null : actual - count.book;
                return [
                  p?.name,
                  String(count.book),
                  actual === null ? "待填寫" : String(actual),
                  <span
                    id={`difference-${count.id}`}
                    className={difference < 0 ? "negative" : "positive"}
                  >
                    {difference === null
                      ? "—"
                      : `${difference > 0 ? "+" : ""}${difference}`}
                  </span>,
                  <BaseLabel variant="confirmation">
                    <BaseCheckbox
                      data-confirm-count={count.id}
                      aria-label={`確認${p?.name}盤點`}
                      checked={Boolean(count.confirmed)}
                      disabled={
                        count.completed ||
                        Boolean(batch?.endedAt) ||
                        !Number.isSafeInteger(count.actual)
                      }
                      onCheckedChange={(selection) => {
                        const checked = selection === true;
                        dispatch(
                          executeWorkspaceCommand({
                            type: "update",
                            update: (d) => {
                              const c = d.stocktakes.find(
                                (c) => c.id === count.id,
                              );
                              if (
                                c.completed ||
                                d.activeModule !== "stocktake" ||
                                batch.endedAt
                              )
                                return;
                              appendConfirmation(d, c.id, checked);
                            },
                          }),
                        );
                      }}
                    />
                    <span>{count.confirmed ? "已確認" : "未確認"}</span>
                  </BaseLabel>,
                  count.completed ? (
                    <BaseBadge variant="secondary">
                      {count.correctedActual !== undefined
                        ? "已更正"
                        : "已送出"}
                      ・鎖定
                    </BaseBadge>
                  ) : (
                    <BaseBadge variant="warning">草稿</BaseBadge>
                  ),
                  count.filledBy ?? "未記錄",
                  count.completed ? (
                    s.canEditExistingData ? (
                      <BaseButton
                        variant="outline"
                        data-action="correct-count"
                        data-id={count.id}
                        onClick={() =>
                          dispatch(
                            executeWorkspaceCommand({
                              type: "open-editor",
                              kind: "stocktake-correction",
                              id: count.id,
                            }),
                          )
                        }
                      >
                        歷史更正
                      </BaseButton>
                    ) : (
                      <BaseButton variant="outline" disabled>
                        已送出・鎖定
                      </BaseButton>
                    )
                  ) : (
                    <>
                      <BaseButton
                        variant="outline"
                        data-action="edit-count"
                        data-id={count.id}
                        onClick={() =>
                          dispatch(
                            executeWorkspaceCommand({
                              type: "open-editor",
                              kind: "stocktake",
                              id: count.id,
                            }),
                          )
                        }
                      >
                        {count.actual === null ? "填寫" : "修改草稿"}
                      </BaseButton>{" "}
                      <BaseButton
                        variant="outline"
                        data-action="remove-count"
                        data-id={count.id}
                        onClick={() => action("remove-count", String(count.id))}
                      >
                        移除
                      </BaseButton>
                    </>
                  ),
                ];
              })}
            />
            {batch && !batch.endedAt && (
              <div className="dialog-actions">
                <BaseButton
                  variant="primary"
                  type="button"
                  data-action="submit-batch"
                  disabled={
                    !counts.length ||
                    counts.some(
                      (c) => !c.confirmed || !Number.isSafeInteger(c.actual),
                    )
                  }
                  onClick={() => action("submit-batch")}
                >
                  確認送出本批次
                </BaseButton>
              </div>
            )}
          </BaseCard>
          <BaseCard variant="panel">
            <h3>批次期間操作紀錄</h3>
            <p className="field-hint">
              保留新增、填寫、移除、調整，以及同工作區在批次進行期間的庫存異動。
            </p>
            <BaseDataTable
              tableKey={`batch-operations-${batch?.id ?? workspace}`}
              headers={[
                "時間",
                "操作",
                "料號",
                "原值",
                "新值",
                "說明",
                "結果",
                "填寫人員",
              ]}
              rows={s.stocktakeOperations
                .filter((o) => o.batchId === batch?.id)
                .slice()
                .reverse()
                .map((o) => [
                  new Date(o.time).toLocaleString("zh-TW"),
                  o.operation,
                  o.productId || "—",
                  o.before || "—",
                  o.after || "—",
                  o.detail,
                  o.outcome,
                  o.filledBy,
                ])}
            />
          </BaseCard>
          {history && (
            <BaseCard variant="panel">
              <h3>歷史更正紀錄</h3>
              <p className="field-hint">
                更正獨立記錄於原批次期間之外，原送出數量與起迄時間保留。
              </p>
              <BaseDataTable
                tableKey={`batch-corrections-${batch?.id ?? workspace}`}
                headers={[
                  "更正時間",
                  "料號",
                  "原送出數量",
                  "更正前",
                  "更正後",
                  "更正原因",
                  "更正人員",
                ]}
                rows={s.stocktakeCorrections
                  .filter((c) => c.batchId === batch?.id)
                  .slice()
                  .reverse()
                  .map((c) => [
                    new Date(c.time).toLocaleString("zh-TW"),
                    c.productId,
                    String(c.original),
                    String(c.before),
                    String(c.after),
                    c.reason,
                    c.filledBy,
                  ])}
              />
            </BaseCard>
          )}
        </>
      ) : (
        <BaseCard variant="panel">
          <h3>最近 OTC 異動</h3>
          {module === "issue" && (
            <div
              className="movement-view-tabs"
              role="group"
              aria-label="異動紀錄分類"
            >
              {[
                ["outbound", "出庫"],
                ["inbound", "入庫"],
                ["all", "總覽"],
              ].map(([view, label]) => (
                <BaseButton
                  variant={s.issueMovementView === view ? "default" : "outline"}
                  key={view}
                  type="button"
                  data-movement-view={view}
                  aria-pressed={s.issueMovementView === view}
                  aria-controls="issue-movements-table"
                  onClick={() =>
                    dispatch(
                      executeWorkspaceCommand({
                        type: "update",
                        update: (d) => {
                          d.issueMovementView = view;
                          d.pageRevision++;
                        },
                      }),
                    )
                  }
                >
                  {label}
                </BaseButton>
              ))}
            </div>
          )}
          <BaseFilterForm
            initial={
              module === "issue"
                ? s.issueMovementTimeFilter
                : s.receiptMovementFilter
            }
            id={
              module === "issue"
                ? "issue-movement-time-filter"
                : "receipt-movement-filter"
            }
            className={
              module === "issue"
                ? "movement-time-filter"
                : "overview-movement-filter"
            }

            filterFields={
              <>
                {identity(
                  `${module}-filter-people`,
                  s.movements
                    .filter((m) => m.workspace === "OTC")
                    .map((m) => m.filledBy ?? "未記錄"),
                  s.movements.map((m) => m.voucherId),
                )}
                {module === "issue" && (
                  <div
                    className="time-filter-shortcuts full"
                    role="group"
                    aria-label="快速搜尋期間"
                  >
                    {[
                      ["month-current", "本月"],
                      ["month-previous", "上個月"],
                      ["month-next", "下個月"],
                      ["week-current", "本週"],
                      ["week-next", "下週"],
                      ["week-previous", "上週"],
                    ].map(([period, label]) => (
                      <BaseButton
                        variant="outline"
                        key={period}
                        type="button"
                        data-movement-period={period}
                      >
                        {label}
                      </BaseButton>
                    ))}
                  </div>
                )}
                <BaseLabel>
                  開始時間
                  <BaseInput
                    type="datetime-local"
                    name="start"
                    step="60"
                    defaultValue={
                      (module === "issue"
                        ? s.issueMovementTimeFilter
                        : s.receiptMovementFilter
                      ).start
                    }
                  />
                </BaseLabel>
                <BaseLabel>
                  結束時間
                  <BaseInput
                    type="datetime-local"
                    name="end"
                    step="60"
                    defaultValue={
                      (module === "issue"
                        ? s.issueMovementTimeFilter
                        : s.receiptMovementFilter
                      ).end
                    }
                  />
                </BaseLabel>
                <div className="time-filter-actions">
                  <BaseButton variant="primary" type="submit">
                    搜尋
                  </BaseButton>
                  <BaseButton
                    variant="outline"
                    type="button"
                    data-action={
                      module === "issue"
                        ? "clear-movement-time"
                        : "clear-receipt-filter"
                    }
                  >
                    清除條件
                  </BaseButton>
                </div>
                {module === "issue" && (
                  <p className="small full">
                    優先依批次查詢同票全部明細；料號、人員及異動時間為交集條件，每週為週一至週日。
                  </p>
                )}
                <p
                  id={
                    module === "issue"
                      ? "movement-time-error"
                      : "receipt-filter-error"
                  }
                  className="error full"
                  role="alert"
                >
                  {s.errors.filter}
                </p>
              </>
            }
          />
          {module === "receipt" && (
            <p className="field-hint">
              優先依批次查詢同票全部明細，可再加料號、人員及時間條件。
            </p>
          )}
          <div id={`${module}-movements-table`}>{<MovementsTable />}</div>
        </BaseCard>
      )}
    </>
  );
}
import { appendBatchOperation } from "@/features/inventory/domain";
import type { WorkspaceState } from "@/types/workspace";
function appendConfirmation(s: WorkspaceState, id: number, confirmed: boolean) {
  const count = s.stocktakes.find((c) => c.id === id);
  const batch = s.stocktakeBatches.find((b) => b.id === count.batchId);
  appendBatchOperation(
    s,
    batch,
    confirmed ? "確認盤點" : "取消盤點確認",
    count.productId,
    count.confirmed ? "已確認" : "未確認",
    confirmed ? "已確認" : "未確認",
    "確認實盤數量與盤差",
  );
  count.confirmed = confirmed;
  count.filledBy = s.currentAccount;
}
