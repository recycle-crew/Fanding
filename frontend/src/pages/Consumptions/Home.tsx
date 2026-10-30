import { useConsumptions } from "@/features/consumptions/ConsumptionsProvider";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Activity, RefreshCw, Plus } from "lucide-react";
import { BaseTabs } from "@/components/ui/BaseTabs";
import { BaseButton } from "@/components/ui/BaseButton";
import { BaseInput } from "@/components/ui/BaseInput";
import {
  BaseNativeSelect as Select,
  BaseNativeSelectOption as Option,
} from "@/components/ui/BaseNativeSelect";
import { BaseField as Field, BaseForm } from "@/components/ui/BaseForm";
import { BaseSwitch } from "@/components/ui/BaseSwitch";
import { BaseDataTable } from "@/components/ui/BaseDataTable";
import { BaseWorkspaceModal } from "@/components/ui/BaseWorkspaceModal";
import { useAppSelector } from "@/store/hooks";
import { useBaseDataOptions } from "@/features/base-data/useBaseDataOptions";
import {
  saveConsumptionMapping,
  reviewConsumptionException,
  retryConsumptionException,
  simulateConsumptionSync,
} from "@/features/consumptions/reducer";
import { useWorkspaceDirty } from "@/features/workspace/useWorkspaceDirty";
import { available, relativeDate, taipeiToday } from "@/features/items/model";
import { exceptionTypes, timestamp } from "@/features/consumptions/model";
import type {
  ConsumptionMapping,
  ConsumptionRecord,
} from "@/types/consumptions";
import "@/features/items/items.css";
import "@/features/purchases/purchases.css";
import "@/features/consumptions/consumptions.css";

const tabs = [
  { value: "summary", label: "藥品耗用查詢" },
  { value: "exceptions", label: "同步異常" },
  { value: "mappings", label: "HIS 藥品對照" },
  { value: "runs", label: "同步紀錄" },
];
const paths: Record<string, string> = {
  summary: "/consumptions",
  exceptions: "/consumptions/exceptions",
  mappings: "/consumptions/mappings",
  runs: "/consumptions/runs",
};
const emptyFilters = () => ({
  search: "",
  from: relativeDate(-30),
  to: taipeiToday(),
  warehouse: "",
  category: "",
  unit: "",
  type: "",
  status: "",
});
export function ConsumptionsPage() {
  const options = useBaseDataOptions();
  const { state, dispatch } = useConsumptions();
  const inventory = useAppSelector((root) => root.items);
  const location = useLocation(),
    navigate = useNavigate();
  const tab =
    tabs.find((entry) => paths[entry.value] === location.pathname)?.value ||
    "summary";
  const [filters, setFilters] = useState(emptyFilters);
  const [modal, setModal] = useState<{
    kind: "item" | "exception" | "mapping" | "sync";
    id?: string;
  } | null>(null);
  const [mapping, setMapping] = useState<ConsumptionMapping | null>(null);
  const [dirty, setDirty] = useState(false),
    [discard, setDiscard] = useState(false),
    [notice, setNotice] = useState("");
  const [scenario, setScenario] = useState<"success" | "partial" | "failure">(
    "success",
  );
  const [syncing, setSyncing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useWorkspaceDirty(dirty || syncing);
  function close(force = false) {
    if (syncing) return;
    if (dirty && !force) {
      setDiscard(true);
      return;
    }
    setModal(null);
    setMapping(null);
    setDirty(false);
    setDiscard(false);
  }
  function editMapping(value?: ConsumptionMapping) {
    setMapping(
      value
        ? { ...value }
        : {
            id: "",
            system: "FANDING_HIS",
            code: "",
            name: "",
            itemId: "",
            sourceUnit: "",
            factor: 1,
            active: true,
          },
    );
    setModal({ kind: "mapping" });
  }
  const invalidDates = filters.from > filters.to;
  const search = filters.search.trim().toLowerCase();
  const records = state.records.filter(
    (row) =>
      !invalidDates &&
      row.date.slice(0, 10) >= filters.from &&
      row.date.slice(0, 10) <= filters.to &&
      (!filters.warehouse || row.warehouse === filters.warehouse) &&
      (!filters.category || row.category === filters.category) &&
      (!filters.unit || row.unit === filters.unit) &&
      [row.itemCode, row.name, row.code, row.nhiCode, row.sourceId, row.lineId]
        .join(" ")
        .toLowerCase()
        .includes(search),
  );
  const summaries = useMemo(() => {
    const groups = new Map<
      string,
      { row: ConsumptionRecord; quantity: number; count: number }
    >();
    records.forEach((row) => {
      const entry = groups.get(row.itemId) || { row, quantity: 0, count: 0 };
      entry.quantity += row.applied;
      if (row.applied > 0) entry.count++;
      groups.set(row.itemId, entry);
    });
    return Array.from(groups.values());
  }, [records]);
  const totals = summaries.reduce<Record<string, number>>(
    (result, { row, quantity }) => {
      result[row.unit] = (result[row.unit] || 0) + quantity;
      return result;
    },
    {},
  );
  const pending = state.exceptions.filter(
    (row) => row.status !== "已解決",
  ).length;
  const selected = state.records.find((row) => row.itemId === modal?.id);
  const exception = state.exceptions.find((row) => row.id === modal?.id);
  const late =
    Date.now() -
      new Date(`${state.latestSuccess.replace(" ", "T")}+08:00`).getTime() >
    15 * 60 * 1000;
  const exceptions = state.exceptions.filter(
    (row) =>
      !invalidDates &&
      row.date.slice(0, 10) >= filters.from &&
      row.date.slice(0, 10) <= filters.to &&
      (!filters.type || row.type === filters.type) &&
      (!filters.status || row.status === filters.status) &&
      [row.sourceId, row.code, row.name]
        .join(" ")
        .toLowerCase()
        .includes(search),
  );
  const mappings = state.mappings.filter((row) =>
    [
      row.system,
      row.code,
      row.name,
      inventory.items.find((item) => item.id === row.itemId)?.code,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search),
  );
  const stock = (id: string, warehouse = "") =>
    inventory.batches
      .filter(
        (batch) =>
          batch.itemId === id && (!warehouse || batch.warehouse === warehouse),
      )
      .reduce((sum, batch) => sum + available(batch), 0);
  function retry() {
    if (!exception) return;
    const map = state.mappings.find(
      (entry) => entry.active && entry.code === exception.code,
    );
    const item = inventory.items.find((entry) => entry.id === map?.itemId);
    let record: ConsumptionRecord | undefined;
    if (
      exception.type === "ITEM_NOT_MAPPED" &&
      map &&
      map.system === "FANDING_HIS" &&
      map.sourceUnit === exception.sourceUnit &&
      item &&
      item.active &&
      stock(item.id, "主倉庫") >= exception.quantity * map.factor
    ) {
      const quantity = exception.quantity * map.factor,
        now = timestamp();
      record = {
        id: `RETRY-${exception.id}`,
        sourceId: exception.sourceId,
        lineId: exception.lineId,
        version: 1,
        code: map.code,
        itemId: item.id,
        itemCode: item.code,
        name: item.name,
        nhiCode: item.nhiCode,
        category: item.category,
        specification: item.specification,
        unit: item.unit,
        original: exception.quantity,
        sourceUnit: map.sourceUnit,
        factor: map.factor,
        converted: quantity,
        applied: quantity,
        date: exception.date,
        synced: now,
        warehouse: "主倉庫",
        status: "正常",
        allocations: [],
        history: [
          {
            time: now,
            action: "重新處理",
            delta: quantity,
            description: "來源、換算比例與主檔快照；僅作用於本模組展示資料。",
          },
        ],
      };
      let remaining = quantity;
      [...inventory.batches]
        .filter(
          (batch) =>
            batch.itemId === item.id &&
            batch.warehouse === "主倉庫" &&
            available(batch) > 0,
        )
        .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
        .forEach((batch) => {
          const taken = Math.min(remaining, available(batch));
          if (taken > 0)
            record!.allocations.push({
              batch: batch.batchNumber,
              quantity: taken,
              source: "FEFO 帳面推定",
            });
          remaining -= taken;
        });
    }
    dispatch(retryConsumptionException({ id: exception.id, record }));
    setNotice(
      record
        ? "展示重新處理成功；重試不會重複建立相同來源。"
        : "重試仍未通過：請檢查對照、單位、倉別、可用量或來源狀態；未新增耗用。",
    );
  }
  function filterSelect(
    key: keyof typeof filters,
    label: string,
    values: string[],
  ) {
    return (
      <Field name={`consumption-${key}`} label={label}>
        <Select
          value={filters[key]}
          onChange={(event) =>
            setFilters({ ...filters, [key]: event.target.value })
          }
        >
          <Option value="">全部</Option>
          {values.map((value) => (
            <Option key={value} value={value}>
              {value}
            </Option>
          ))}
        </Select>
      </Field>
    );
  }
  const title =
    modal?.kind === "item"
      ? "耗用明細"
      : modal?.kind === "exception"
        ? "同步異常詳情"
        : modal?.kind === "sync"
          ? "手動同步（展示）"
          : `${mapping?.id ? "編輯" : "新增"} HIS 藥品對照`;
  return (
    <div className="items-page consumption-page">
      <header className="items-heading">
        <div className="items-title">
          <Activity aria-hidden="true" />
          <div>
            <h2>藥品耗用查詢</h2>
            <p>HIS 來源耗用、換算快照與同步異常追蹤</p>
          </div>
        </div>
        <BaseButton onClick={() => setModal({ kind: "sync" })}>
          <RefreshCw aria-hidden="true" />
          手動同步
        </BaseButton>
      </header>
      <section className="consumption-monitor" aria-label="同步狀態">
        <div>
          <strong>最後成功同步</strong>
          <span>{state.latestSuccess}</span>
        </div>
        <div>
          <strong>上次同步狀態</strong>
          <span>{syncing ? "RUNNING" : state.runs[0].status}</span>
        </div>
        <div>
          <strong>待處理異常</strong>
          <BaseButton variant="link" onClick={() => navigate(paths.exceptions)}>
            {pending} 筆
          </BaseButton>
        </div>
      </section>
      {late && (
        <p className="consumption-warning" role="status">
          HIS 展示同步已延遲超過 15
          分鐘，庫存可能未包含最新耗用。手動同步僅模擬，不會連線 HIS。
        </p>
      )}
      <BaseTabs
        id="consumption"
        label="耗用管理"
        value={tab}
        options={tabs}
        onChange={(value) => {
          navigate(paths[value]);
          setFilters(emptyFilters());
          setNotice("");
        }}
      />
      <div
        id="consumption-panel"
        role="tabpanel"
        aria-labelledby={`consumption-${tab}`}
        tabIndex={0}
      >
        <div className="consumption-filters">
          <Field
            name="consumption-search"
            label={tab === "mappings" ? "搜尋 HIS 藥品對照" : "搜尋耗用資料"}
          >
            <BaseInput
              value={filters.search}
              placeholder="品名、料號、HIS／健保碼、來源單號"
              onChange={(event) =>
                setFilters({ ...filters, search: event.target.value })
              }
            />
          </Field>
          {tab !== "mappings" && (
            <>
              <Field name="consumption-from" label="開始日期">
                <BaseInput
                  type="date"
                  value={filters.from}
                  required
                  onChange={(event) =>
                    setFilters({ ...filters, from: event.target.value })
                  }
                />
              </Field>
              <Field name="consumption-to" label="結束日期">
                <BaseInput
                  type="date"
                  value={filters.to}
                  required
                  onChange={(event) =>
                    setFilters({ ...filters, to: event.target.value })
                  }
                />
              </Field>
            </>
          )}
          {tab === "summary" && (
            <>
              {filterSelect("warehouse", "倉別", [
                ...new Set(state.records.map((row) => row.warehouse)),
              ])}
              {filterSelect("category", "分類", [
                ...new Set(state.records.map((row) => row.category)),
              ])}
              {filterSelect("unit", "基本單位", [
                ...new Set([
                  ...options.units,
                  ...state.records.map((row) => row.unit),
                ]),
              ])}
            </>
          )}
          {tab === "exceptions" && (
            <>
              <Field name="consumption-type" label="異常類型">
                <Select
                  value={filters.type}
                  onChange={(event) =>
                    setFilters({ ...filters, type: event.target.value })
                  }
                >
                  <Option value="">全部</Option>
                  {Object.entries(exceptionTypes).map(([key, label]) => (
                    <Option key={key} value={key}>
                      {label}
                    </Option>
                  ))}
                </Select>
              </Field>
              {filterSelect("status", "處理狀態", [
                "待處理",
                "待人工核對",
                "已解決",
              ])}
            </>
          )}
          <BaseButton
            variant="outline"
            onClick={() => setFilters(emptyFilters())}
          >
            清除
          </BaseButton>
          {tab === "mappings" && (
            <BaseButton onClick={() => editMapping()}>
              <Plus aria-hidden="true" />
              新增對照
            </BaseButton>
          )}
        </div>
        {invalidDates && (
          <p role="alert" className="items-error">
            開始日期不可晚於結束日期。
          </p>
        )}
        <p className="consumption-feedback" role="status" aria-live="polite">
          {notice}
        </p>
        {tab === "summary" && (
          <>
            <p>
              查詢淨耗用：
              {Object.entries(totals)
                .map(([unit, quantity]) => `${quantity} ${unit}`)
                .join(" ／ ") || "0"}
              （依單位分列）
            </p>
            <BaseDataTable
              tableKey="consumption-summary"
              headers={[
                "商品代碼",
                "HIS 代碼",
                "商品名稱",
                "規格",
                "單位",
                "淨耗用量",
                "有效筆數",
                "目前可用庫存",
                "操作",
              ]}
              rows={summaries.map(({ row, quantity, count }) => [
                row.itemCode,
                row.code,
                row.name,
                row.specification,
                row.unit,
                quantity,
                count,
                stock(row.itemId, filters.warehouse),
                <BaseButton
                  variant="outline"
                  aria-label={`查看${row.name}耗用明細`}
                  onClick={() => setModal({ kind: "item", id: row.itemId })}
                >
                  查看明細
                </BaseButton>,
              ])}
            />
          </>
        )}
        {tab === "exceptions" && (
          <BaseDataTable
            tableKey="consumption-exceptions"
            headers={[
              "異常時間",
              "HIS 單號",
              "HIS 代碼",
              "藥品名稱",
              "原始數量",
              "異常原因",
              "處理狀態",
              "操作",
            ]}
            rows={exceptions.map((row) => [
              row.date,
              row.sourceId,
              row.code,
              row.name,
              row.quantity,
              exceptionTypes[row.type],
              row.status,
              <BaseButton
                variant="outline"
                aria-label={`查看異常 ${row.sourceId}`}
                onClick={() => setModal({ kind: "exception", id: row.id })}
              >
                查看詳情
              </BaseButton>,
            ])}
          />
        )}
        {tab === "mappings" && (
          <BaseDataTable
            tableKey="consumption-mappings"
            headers={[
              "來源系統",
              "HIS 代碼",
              "HIS 藥品名稱",
              "對應品項",
              "HIS 單位",
              "基本單位",
              "換算比例",
              "狀態",
              "操作",
            ]}
            rows={mappings.map((row) => {
              const item = inventory.items.find(
                (entry) => entry.id === row.itemId,
              );
              return [
                row.system,
                row.code,
                row.name,
                `${item?.code} ${item?.name}`,
                row.sourceUnit,
                item?.unit,
                row.factor,
                row.active ? "啟用" : "停用",
                <BaseButton
                  variant="outline"
                  aria-label={`編輯對照 ${row.code}`}
                  onClick={() => editMapping(row)}
                >
                  編輯
                </BaseButton>,
              ];
            })}
          />
        )}
        {tab === "runs" && (
          <BaseDataTable
            tableKey="consumption-runs"
            headers={[
              "執行編號",
              "開始時間",
              "結束時間",
              "狀態",
              "讀取",
              "新增套用",
              "略過重複",
              "失敗",
              "執行人員",
            ]}
            rows={state.runs
              .filter(
                (row) =>
                  !invalidDates &&
                  row.started.slice(0, 10) >= filters.from &&
                  row.started.slice(0, 10) <= filters.to &&
                  [row.id, row.status, row.actor]
                    .join(" ")
                    .toLowerCase()
                    .includes(search),
              )
              .map((row) => [
                row.id,
                row.started,
                row.finished,
                row.status,
                row.received,
                row.applied,
                row.skipped,
                row.failed,
                row.actor,
              ])}
          />
        )}
      </div>
      <p className="consumption-note">
        展示模式：HIS 耗用皆為假資料，不提供人工新增、修改或刪除。未連線
        HIS、未啟用排程，未更新模組一庫存；目前可用庫存僅參照模組一展示資料。歷史對照、名稱與換算比例保留快照。
      </p>
      <BaseWorkspaceModal
        open={Boolean(modal)}
        title={title}
        description={
          modal?.kind === "item"
            ? "唯讀來源紀錄；FEFO 為帳面推定，與實際交付批號分別標示。"
            : "僅供畫面與需求訪談展示，不執行正式 HIS 或庫存交易。"
        }
        onClose={() => close()}
      >
        {discard ? (
          <div className="items-modal-scroll">
            <h3>尚有未儲存變更</h3>
            <p>確定放棄目前修改？</p>
            <div className="consumption-actions">
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
          <>
            {modal?.kind === "mapping" && mapping && (
              <BaseForm
                submitText="儲存對照"
                onDirty={() => setDirty(true)}
                onCancel={() => close()}
                submit={() => {
                  const clean = {
                    ...mapping,
                    system: mapping.system.trim(),
                    code: mapping.code.trim(),
                    name: mapping.name.trim(),
                    sourceUnit: mapping.sourceUnit.trim(),
                  };
                  if (
                    !clean.system ||
                    !clean.code ||
                    !clean.name ||
                    !clean.sourceUnit ||
                    !clean.itemId
                  )
                    return { message: "請填寫所有必填資料。" };
                  if (!Number.isFinite(clean.factor) || clean.factor <= 0)
                    return {
                      field: "mapping-factor",
                      message: "換算比例須大於零。",
                    };
                  if (
                    state.mappings.some(
                      (row) =>
                        row.id !== clean.id &&
                        row.system.toLowerCase() ===
                          clean.system.toLowerCase() &&
                        row.code.toLowerCase() === clean.code.toLowerCase(),
                    )
                  )
                    return {
                      field: "mapping-code",
                      message: "同一來源系統的 HIS 代碼不可重複。",
                    };
                  dispatch(
                    saveConsumptionMapping({
                      ...clean,
                      id: clean.id || crypto.randomUUID(),
                    }),
                  );
                  setNotice(
                    "HIS 對照已儲存；歷史耗用快照不變。請至異常清單重新處理。",
                  );
                  close(true);
                }}
              >
                <section>
                  <h3>來源與品項對照</h3>
                  <div className="consumption-form-grid">
                    {(
                      [
                        ["system", "HIS 系統識別"],
                        ["code", "HIS 藥品代碼"],
                        ["name", "HIS 藥品名稱"],
                        ["sourceUnit", "HIS 單位"],
                      ] as const
                    ).map(([key, label]) => (
                      <Field
                        key={key}
                        name={`mapping-${key}`}
                        label={label}
                        required
                      >
                        {key === "sourceUnit" ? (
                          <Select
                            value={mapping.sourceUnit}
                            onChange={(event) =>
                              setMapping({
                                ...mapping,
                                sourceUnit: event.target.value,
                              })
                            }
                          >
                            <Option value="">請選擇</Option>
                            {Array.from(
                              new Set([
                                ...options.units,
                                ...(modal?.id && mapping.sourceUnit
                                  ? [mapping.sourceUnit]
                                  : []),
                              ]),
                            ).map((unit) => (
                              <Option key={unit} value={unit}>
                                {unit}
                              </Option>
                            ))}
                          </Select>
                        ) : (
                          <BaseInput
                            value={mapping[key]}
                            onChange={(event) =>
                              setMapping({
                                ...mapping,
                                [key]: event.target.value,
                              })
                            }
                          />
                        )}
                      </Field>
                    ))}
                    <Field name="mapping-item" label="本系統藥品" required>
                      <Select
                        value={mapping.itemId}
                        onChange={(event) =>
                          setMapping({ ...mapping, itemId: event.target.value })
                        }
                      >
                        <Option value="">請選擇</Option>
                        {inventory.items
                          .filter((item) => item.group === "HIS_MEDICINE")
                          .map((item) => (
                            <Option key={item.id} value={item.id}>
                              {item.code} {item.name}（{item.unit}）
                            </Option>
                          ))}
                      </Select>
                    </Field>
                    <Field
                      name="mapping-factor"
                      label="換算比例"
                      hint="1 HIS 單位相當於多少基本單位"
                      required
                    >
                      <BaseInput
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={mapping.factor}
                        onChange={(event) =>
                          setMapping({
                            ...mapping,
                            factor: Number(event.target.value),
                          })
                        }
                      />
                    </Field>
                  </div>
                  <p>
                    本系統基本單位：
                    {inventory.items.find((item) => item.id === mapping.itemId)
                      ?.unit || "請先選擇品項"}
                  </p>
                </section>
                <div className="consumption-actions">
                  <BaseSwitch
                    checked={mapping.active}
                    aria-label="啟用對照"
                    onClick={() => {
                      setMapping({ ...mapping, active: !mapping.active });
                      setDirty(true);
                    }}
                  />
                  <span>{mapping.active ? "啟用" : "停用"}</span>
                </div>
              </BaseForm>
            )}
            {modal?.kind === "item" && selected && (
              <>
                <div className="items-modal-scroll">
                  <h3>
                    {selected.itemCode} {selected.name}
                  </h3>
                  <p>
                    HIS：{selected.code} ／ {selected.specification} ／{" "}
                    {filters.from}～{filters.to}
                  </p>
                  <p>
                    查詢淨耗用{" "}
                    {records
                      .filter((row) => row.itemId === selected.itemId)
                      .reduce((sum, row) => sum + row.applied, 0)}{" "}
                    {selected.unit}
                  </p>
                  {records
                    .filter((row) => row.itemId === selected.itemId)
                    .map((row) => (
                      <article className="consumption-record" key={row.id}>
                        <h4>
                          {row.sourceId} ／ {row.lineId}
                        </h4>
                        <p>
                          耗用時間 {row.date} ／ 同步 {row.synced} ／{" "}
                          {row.warehouse} ／ {row.status}
                        </p>
                        <p>
                          來源版本 v{row.version}，原始 {row.original}{" "}
                          {row.sourceUnit} × 比例 {row.factor} = 首次換算{" "}
                          {row.converted} {row.unit}；淨耗用 {row.applied}{" "}
                          {row.unit}
                        </p>
                        <details>
                          <summary>批次分配與更正／取消歷史</summary>
                          <ul>
                            {row.allocations.map((allocation, index) => (
                              <li key={index}>
                                {allocation.batch}：{allocation.quantity}{" "}
                                {row.unit}（{allocation.source}）
                              </li>
                            ))}
                          </ul>
                          <ol>
                            {row.history.map((entry, index) => (
                              <li key={index}>
                                {entry.time}　{entry.action}　差額 {entry.delta}{" "}
                                {row.unit}　{entry.description}
                              </li>
                            ))}
                          </ol>
                          {row.status === "已取消" && (
                            <p>
                              上列為原出庫批次；取消反向異動已保留，淨耗用為零。
                            </p>
                          )}
                        </details>
                      </article>
                    ))}
                </div>
                <footer className="items-modal-footer">
                  <BaseButton variant="outline" onClick={() => close()}>
                    關閉
                  </BaseButton>
                </footer>
              </>
            )}
            {modal?.kind === "exception" && exception && (
              <>
                <div className="items-modal-scroll">
                  <h3>{exceptionTypes[exception.type]}</h3>
                  <p>
                    {exception.sourceId} ／ {exception.lineId} ／{" "}
                    {exception.code} ／ {exception.name}
                  </p>
                  <p>
                    原始數量 {exception.quantity} ／ {exception.status} ／{" "}
                    {exception.date}
                  </p>
                  <p>
                    未建立有效耗用；來源不明、數量減少或已交付取消，必須核對交付與回補條件。
                  </p>
                  <ul>
                    {exception.history.map((entry, index) => (
                      <li key={index}>{entry}</li>
                    ))}
                  </ul>
                  <p role="status">{notice}</p>
                </div>
                <footer className="items-modal-footer consumption-actions">
                  <BaseButton
                    variant="outline"
                    onClick={() => {
                      close(true);
                      navigate(paths.mappings);
                      setFilters({ ...emptyFilters(), search: exception.code });
                    }}
                  >
                    前往藥品對照
                  </BaseButton>
                  <BaseButton
                    variant="outline"
                    disabled={exception.status === "已解決"}
                    onClick={() =>
                      dispatch(reviewConsumptionException(exception.id))
                    }
                  >
                    待人工核對
                  </BaseButton>
                  <BaseButton
                    disabled={exception.status === "已解決"}
                    onClick={retry}
                  >
                    重新處理
                  </BaseButton>
                </footer>
              </>
            )}
            {modal?.kind === "sync" && (
              <>
                <div className="items-modal-scroll">
                  <Field name="sync-scenario" label="展示同步情境">
                    <Select
                      value={scenario}
                      disabled={syncing}
                      onChange={(event) =>
                        setScenario(event.target.value as typeof scenario)
                      }
                    >
                      <Option value="success">成功（固定來源事件）</Option>
                      <Option value="partial">
                        部分成功（另有來源狀態異常）
                      </Option>
                      <Option value="failure">連線失敗</Option>
                    </Select>
                  </Field>
                  <p>
                    固定來源 ID
                    重複同步會略過，不重複新增。這是前端情境模擬；正式排程與重試機制待
                    HIS 介接確認。
                  </p>
                  <p role="status">
                    {syncing
                      ? "RUNNING：展示同步處理中…"
                      : "準備執行展示同步。"}
                  </p>
                </div>
                <footer className="items-modal-footer">
                  <BaseButton
                    variant="outline"
                    disabled={syncing}
                    onClick={() => close()}
                  >
                    取消
                  </BaseButton>
                  <BaseButton
                    disabled={syncing}
                    onClick={() => {
                      if (timer.current) return;
                      setSyncing(true);
                      timer.current = setTimeout(() => {
                        dispatch(simulateConsumptionSync(scenario));
                        setSyncing(false);
                        setModal(null);
                        setNotice(
                          "展示同步已完成，請查看同步紀錄；原始資料及模組一庫存未改動。",
                        );
                        timer.current = null;
                      }, 400);
                    }}
                  >
                    開始展示同步
                  </BaseButton>
                </footer>
              </>
            )}
          </>
        )}
      </BaseWorkspaceModal>
    </div>
  );
}
