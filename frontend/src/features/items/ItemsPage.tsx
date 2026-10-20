import { useWorkspaceDirty } from "@/features/workspace/useWorkspaceDirty";
import { BaseSwitch } from "@/components/ui/BaseSwitch";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { itemGroupPaths } from "@/constants/demoRoutes";
import {
  Box,
  Package,
  Database,
  TriangleAlert,
  Clock3,
  CalendarX2,
  Search,
  Plus,
  Download,
  Eye,
  Pencil,
  Pill,
  ShoppingCart,
  ArrowDownUp,
  X,
} from "lucide-react";
import { BaseButton } from "@/components/ui/BaseButton";
import { BaseInput } from "@/components/ui/BaseInput";
import { BaseLabel } from "@/components/ui/BaseLabel";
import {
  BaseNativeSelect,
  BaseNativeSelectOption,
} from "@/components/ui/BaseNativeSelect";
import {
  BaseTable,
  BaseTableHeader,
  BaseTableBody,
  BaseTableRow,
  BaseTableHead,
  BaseTableCell,
} from "@/components/ui/BaseTable";
import {
  BaseDialog,
  BaseDialogContent,
  BaseDialogTitle,
  BaseDialogDescription,
} from "@/components/ui/BaseDialog";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { saveItem, setItemActive } from "@/store/items";
import { downloadTable } from "@/helpers/excel";
import { ItemEditor } from "./ItemEditor";
import { ItemDetails } from "./ItemDetails";
import {
  available,
  blankItem,
  categories,
  expiryStatus,
  stockStatus,
  taipeiToday,
  usageStatus,
  warehouses,
  type Item,
  type ItemGroup,
} from "./model";
import "./items.css";
import { moveTabFocus } from "./tabKeyboard";

const defaults = {
  search: "",
  warehouse: "",
  category: "",
  stock: "",
  expiry: "",
  active: "active",
};
type Modal = { kind: "new" | "edit" | "view" | "status"; item: Item };
const number = (value: number) =>
  value.toLocaleString("zh-TW", { maximumFractionDigits: 3 });

export function ItemsPage() {
  const state = useAppSelector((s) => s.items);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname.replace(/\/+$/, "");
  const group: ItemGroup =
    pathname === itemGroupPaths.GENERAL ? "GENERAL" : "HIS_MEDICINE";
  function setGroup(nextGroup: ItemGroup) {
    if (nextGroup !== group) {
      navigate(
        `${itemGroupPaths[nextGroup]}${location.search}${location.hash}`,
      );
    }
  }
  useEffect(() => {
    if (pathname === "/demo/items") {
      navigate(
        `${itemGroupPaths.HIS_MEDICINE}${location.search}${location.hash}`,
        {
          replace: true,
        },
      );
    }
  }, [pathname, location.search, location.hash, navigate]);
  const [filter, setFilter] = useState(defaults);
  const [sort, setSort] = useState<{
    key: "code" | "name" | "quantity" | "expiry";
    direction: number;
  }>({ key: "code", direction: 1 });
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [modal, setModal] = useState<Modal | null>(null);
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [notice, setNotice] = useState("");
  const [exporting, setExporting] = useState(false);
  const exportTable = useRef<HTMLTableElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const editorFocus = useRef<HTMLElement | null>(null);
  const today = taipeiToday();
  const rows = useMemo(
    () =>
      state.items
        .map((item) => {
          const allBatches = state.batches.filter((b) => b.itemId === item.id);
          const batches = allBatches.filter(
            (b) => !filter.warehouse || b.warehouse === filter.warehouse,
          );
          const quantity = batches.reduce(
            (sum, b) => sum + available(b, today),
            0,
          );
          const dates = batches
            .filter((b) => b.quantity > 0 && b.expiryDate)
            .map((b) => b.expiryDate)
            .sort();
          return {
            item,
            batches,
            quantity,
            expiry: dates[0] || "",
            stock: stockStatus(item, state.batches, today),
            usage: usageStatus(item, today),
          };
        })
        .filter((row) => {
          const { item, batches, stock, usage } = row;
          return (
            item.group === group &&
            [
              item.code,
              item.name,
              item.englishName,
              item.barcode,
              item.nhiCode,
            ].some((v) =>
              v.toLowerCase().includes(filter.search.trim().toLowerCase()),
            ) &&
            (!filter.category || item.category === filter.category) &&
            (!filter.stock || stock === filter.stock) &&
            (!filter.expiry ||
              (filter.expiry === "不適用"
                ? !item.trackExpiry
                : batches.some(
                    (b) =>
                      b.quantity > 0 &&
                      expiryStatus(b, today) === filter.expiry,
                  ))) &&
            (filter.active === "all" ||
              (filter.active === "active"
                ? usage === "使用中"
                : usage !== "使用中"))
          );
        })
        .sort((a, b) => {
          const result =
            sort.key === "quantity"
              ? a.quantity - b.quantity
              : sort.key === "expiry"
                ? (a.expiry || "9999").localeCompare(b.expiry || "9999")
                : a.item[sort.key].localeCompare(b.item[sort.key], "zh-TW");
          return result * sort.direction;
        }),
    [state, group, filter, sort, today],
  );
  const unitTotals = rows.reduce<Record<string, number>>(
    (s, r) => ({ ...s, [r.item.unit]: (s[r.item.unit] || 0) + r.quantity }),
    {},
  );
  const low = rows.filter(
    (r) =>
      r.stock === "低庫存" || (r.stock === "無庫存" && r.item.safetyStock > 0),
  ).length;
  const expiring = rows.filter((r) =>
    r.batches.some(
      (b) => b.quantity > 0 && expiryStatus(b, today) === "即將到期",
    ),
  ).length;
  const expired = rows.filter((r) =>
    r.batches.some(
      (b) => b.quantity > 0 && expiryStatus(b, today) === "已過期",
    ),
  ).length;
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const currentPage = Math.min(page, pages);
  const visible = rows.slice((currentPage - 1) * size, currentPage * size);
  useEffect(() => {
    setPage(1);
  }, [filter, group, size]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  useWorkspaceDirty(dirty);
  useEffect(() => {
    if (discard) continueRef.current?.focus();
  }, [discard]);
  function open(kind: Modal["kind"], item: Item) {
    trigger.current = document.activeElement as HTMLElement;
    setDirty(false);
    setDiscard(false);
    setModal({ kind, item });
  }
  function close(force = false) {
    if (dirty && !force) {
      editorFocus.current = document.activeElement as HTMLElement;
      setDiscard(true);
      return;
    }
    setModal(null);
    setDirty(false);
    setDiscard(false);
  }
  function changeFilter(key: keyof typeof defaults, value: string) {
    setFilter((f) => ({ ...f, [key]: value }));
  }
  function sorting(key: typeof sort.key) {
    setSort((s) => ({ key, direction: s.key === key ? -s.direction : 1 }));
  }
  async function exportExcel() {
    if (!exportTable.current || exporting) return;
    setExporting(true);
    try {
      const count = await downloadTable(exportTable.current);
      setNotice(`已匯出 ${count} 筆符合條件的品項。`);
    } catch (error) {
      setNotice(
        `匯出失敗：${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setExporting(false);
    }
  }
  const cards = [
    {
      title: "品項數",
      value: number(rows.length),
      note: `使用中 ${rows.filter((r) => r.usage === "使用中").length} ｜ 其他狀態 ${rows.filter((r) => r.usage !== "使用中").length}`,
      icon: Package,
      color: "blue",
    },
    {
      title: "可用庫存數量",
      value:
        Object.entries(unitTotals)
          .map(([unit, total]) => `${number(total)} ${unit}`)
          .join("／") || "0",
      note: "依基本單位分列，不混合加總",
      icon: Database,
      color: "cyan",
    },
    {
      title: "安全庫存不足",
      value: number(low),
      note: "依全倉可用庫存判斷",
      icon: TriangleAlert,
      color: "red",
    },
    {
      title: "即將到期品項",
      value: number(expiring),
      note: "90 天內有到期庫存批次",
      icon: Clock3,
      color: "orange",
    },
    {
      title: "已過期品項",
      value: number(expired),
      note: "仍有庫存的過期批次",
      icon: CalendarX2,
      color: "red",
    },
  ];
  const modalTitle =
    modal?.kind === "new"
      ? "新增品項"
      : modal?.kind === "edit"
        ? "編輯品項"
        : modal?.kind === "view"
          ? "庫存批號明細"
          : `${modal?.item.active ? "停用" : "啟用"}品項`;
  return (
    <section
      className="items-page"
      aria-label="新版品項與庫存管理"
      onSubmit={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <header className="items-heading">
        <div className="items-title">
          <Box aria-hidden="true" />
          <div>
            <h2>品項與庫存管理</h2>
            <p>統一管理品項資料、庫存數量及批號效期</p>
          </div>
        </div>
        <div className="items-heading-tools">
          <div className="items-search">
            <Search size={17} aria-hidden="true" />
            <BaseInput
              aria-label="搜尋品項"
              placeholder="搜尋料號、品名、健保碼、國際條碼…"
              value={filter.search}
              onChange={(e) => changeFilter("search", e.target.value)}
            />
          </div>
          <BaseButton
            onClick={() => open("new", blankItem(group, state.items))}
          >
            <Plus size={17} />
            新增品項
          </BaseButton>
        </div>
      </header>
      <div
        className="items-tabs"
        role="tablist"
        aria-label="品項群組"
        onKeyDown={(event) => {
          moveTabFocus(event);
          if (event.defaultPrevented) {
            (document.activeElement as HTMLButtonElement)?.click();
          }
        }}
      >
        {(
          [
            ["HIS_MEDICINE", "HIS 藥品", Pill],
            ["GENERAL", "自費／OTC／其他商品", ShoppingCart],
          ] as const
        ).map(([key, text, Icon]) => (
          <BaseButton
            key={key}
            id={`items-tab-${key}`}
            role="tab"
            aria-selected={group === key}
            tabIndex={group === key ? 0 : -1}
            aria-controls="items-panel"
            variant="ghost"
            onClick={() => setGroup(key)}
          >
            <Icon size={18} />
            {text}
          </BaseButton>
        ))}
      </div>
      <div
        id="items-panel"
        role="tabpanel"
        tabIndex={0}
        aria-labelledby={`items-tab-${group}`}
      >
        <div className="items-stats">
          {cards.map((c) => (
            <article key={c.title} className={`items-stat ${c.color}`}>
              <span className="items-stat-icon" aria-hidden="true">
                <c.icon size={23} />
              </span>
              <div>
                <h3>{c.title}</h3>
                <strong>{c.value}</strong>
                <p>{c.note}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="items-filter-bar">
          {(
            [
              ["warehouse", "倉別", ["全部倉別", ...warehouses]],
              ["category", "品項分類", ["全部分類", ...categories]],
              ["stock", "庫存狀態", ["全部", "正常", "低庫存", "無庫存"]],
              [
                "expiry",
                "效期狀態",
                ["全部", "正常", "即將到期", "已過期", "不適用"],
              ],
            ] as const
          ).map(([key, title, values]) => (
            <BaseLabel key={key} htmlFor={`items-filter-${key}`}>
              {title}
              <BaseNativeSelect
                id={`items-filter-${key}`}
                value={filter[key]}
                onChange={(e) => changeFilter(key, e.target.value)}
              >
                {values.map((value, i) => (
                  <BaseNativeSelectOption key={value} value={i ? value : ""}>
                    {value}
                  </BaseNativeSelectOption>
                ))}
              </BaseNativeSelect>
            </BaseLabel>
          ))}
          <BaseLabel htmlFor="items-filter-active">
            啟用狀態
            <BaseNativeSelect
              id="items-filter-active"
              value={filter.active}
              onChange={(e) => changeFilter("active", e.target.value)}
            >
              <BaseNativeSelectOption value="active">
                使用中
              </BaseNativeSelectOption>
              <BaseNativeSelectOption value="inactive">
                非使用中
              </BaseNativeSelectOption>
              <BaseNativeSelectOption value="all">全部</BaseNativeSelectOption>
            </BaseNativeSelect>
          </BaseLabel>
          <BaseButton variant="ghost" onClick={() => setFilter(defaults)}>
            清除
          </BaseButton>
          <BaseButton
            variant="outline"
            disabled={exporting || !rows.length}
            onClick={exportExcel}
          >
            <Download size={15} />
            {exporting ? "匯出中…" : "匯出 Excel"}
          </BaseButton>
        </div>
        <div className="items-table-card">
          <div
            className="items-table-scroll"
            role="region"
            aria-label="品項庫存列表，可左右捲動"
            tabIndex={0}
          >
            <BaseTable
              className="items-main-table"
              aria-label="品項與庫存查詢結果"
            >
              <BaseTableHeader>
                <BaseTableRow>
                  {[
                    "料號",
                    "健保碼",
                    "品名",
                    "規格",
                    "分類",
                    "倉別",
                    "庫存量",
                    "單位",
                    "最近效期",
                    "安全庫存",
                    "庫存狀態",
                    "建議售價",
                    "啟用",
                    "操作",
                  ].map((head, index) => {
                    const key = (
                      {
                        0: "code",
                        2: "name",
                        6: "quantity",
                        8: "expiry",
                      } as const
                    )[index];
                    return (
                      <BaseTableHead
                        key={head}
                        aria-sort={
                          key && sort.key === key
                            ? sort.direction === 1
                              ? "ascending"
                              : "descending"
                            : undefined
                        }
                      >
                        {key ? (
                          <BaseButton
                            variant="ghost"
                            size="sm"
                            type="button"
                            className="items-sort"
                            onClick={() => sorting(key)}
                          >
                            {head}
                            <ArrowDownUp size={12} />
                          </BaseButton>
                        ) : (
                          head
                        )}
                      </BaseTableHead>
                    );
                  })}
                </BaseTableRow>
              </BaseTableHeader>
              <BaseTableBody>
                {visible.map((r) => (
                  <BaseTableRow key={r.item.id}>
                    <BaseTableCell className="items-code">
                      {r.item.code}
                    </BaseTableCell>
                    <BaseTableCell>{r.item.nhiCode || "—"}</BaseTableCell>
                    <BaseTableCell className="items-name">
                      {r.item.name}
                    </BaseTableCell>
                    <BaseTableCell>{r.item.specification || "—"}</BaseTableCell>
                    <BaseTableCell>{r.item.category}</BaseTableCell>
                    <BaseTableCell>
                      {filter.warehouse || "全部倉別"}
                    </BaseTableCell>
                    <BaseTableCell className="items-number">
                      {number(r.quantity)}
                    </BaseTableCell>
                    <BaseTableCell>{r.item.unit}</BaseTableCell>
                    <BaseTableCell
                      className={
                        r.expiry && r.expiry < today ? "items-expired" : ""
                      }
                    >
                      {r.expiry || "—"}
                    </BaseTableCell>
                    <BaseTableCell>{number(r.item.safetyStock)}</BaseTableCell>
                    <BaseTableCell>
                      <span
                        className={`items-status ${r.stock === "正常" ? "" : "danger"}`}
                      >
                        {r.stock}
                      </span>
                    </BaseTableCell>
                    <BaseTableCell>
                      {r.item.suggestedPrice === ""
                        ? "—"
                        : `${number(Number(r.item.suggestedPrice))} 元`}
                    </BaseTableCell>
                    <BaseTableCell>
                      <BaseSwitch
                        className={`items-toggle ${r.item.active ? "on" : ""}`}
                        type="button"
                        checked={r.item.active}
                        aria-label={`啟用品項：${r.item.name}`}
                        aria-haspopup="dialog"
                        title={r.usage}
                        onClick={() => open("status", r.item)}
                      />
                      {r.usage !== "使用中" && (
                        <small className="items-usage">{r.usage}</small>
                      )}
                    </BaseTableCell>
                    <BaseTableCell>
                      <div className="items-row-actions">
                        <BaseButton
                          variant="outline"
                          size="icon"
                          aria-label={`查看${r.item.name}`}
                          onClick={() => open("view", r.item)}
                        >
                          <Eye size={15} />
                        </BaseButton>
                        <BaseButton
                          variant="outline"
                          size="icon"
                          aria-label={`編輯${r.item.name}`}
                          onClick={() => open("edit", r.item)}
                        >
                          <Pencil size={14} />
                        </BaseButton>
                      </div>
                    </BaseTableCell>
                  </BaseTableRow>
                ))}
                {!visible.length && (
                  <BaseTableRow>
                    <BaseTableCell colSpan={14}>
                      <div className="items-empty">
                        <Search size={30} />
                        <strong>找不到符合條件的品項</strong>
                        <p>試試其他關鍵字，或清除篩選條件。</p>
                        <BaseButton
                          variant="outline"
                          onClick={() => setFilter(defaults)}
                        >
                          清除條件
                        </BaseButton>
                      </div>
                    </BaseTableCell>
                  </BaseTableRow>
                )}
              </BaseTableBody>
            </BaseTable>
          </div>
          <footer className="items-pagination">
            <span role="status" aria-live="polite" aria-atomic="true">
              共 {rows.length} 筆
              {rows.length > 0 &&
                `，顯示 ${(currentPage - 1) * size + 1}–${Math.min(currentPage * size, rows.length)} 筆`}
            </span>
            <div>
              <BaseLabel className="items-page-size" htmlFor="items-page-size">
                每頁
                <BaseNativeSelect
                  id="items-page-size"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                >
                  {[5, 10, 20, 50].map((n) => (
                    <BaseNativeSelectOption key={n} value={n}>
                      {n} 筆
                    </BaseNativeSelectOption>
                  ))}
                </BaseNativeSelect>
              </BaseLabel>
              <BaseButton
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                上一頁
              </BaseButton>
              <span>
                {currentPage} / {pages}
              </span>
              <BaseButton
                variant="outline"
                disabled={currentPage === pages}
                onClick={() => setPage(currentPage + 1)}
              >
                下一頁
              </BaseButton>
            </div>
          </footer>
        </div>
        <p className="items-demo-note">
          展示模式・所有資料為虛構，重新整理即重置。庫存量為選定倉別可用數量；安全庫存狀態依全倉判斷。
        </p>
      </div>
      {notice && (
        <div className="items-toast" role="status">
          {notice}
          <BaseButton
            variant="ghost"
            size="icon"
            aria-label="關閉提示"
            onClick={() => setNotice("")}
          >
            <X size={15} />
          </BaseButton>
        </div>
      )}
      <div hidden>
        <BaseTable ref={exportTable}>
          <caption>品項與庫存管理</caption>
          <BaseTableHeader>
            <BaseTableRow>
              {[
                "品項料號",
                "健保代碼",
                "國際條碼",
                "品項名稱",
                "英文名稱",
                "分類",
                "規格",
                "基本單位",
                "倉別",
                "庫存數量",
                "安全庫存",
                "最近效期",
                "建議售價",
                "啟用狀態",
              ].map((h) => (
                <BaseTableHead key={h}>{h}</BaseTableHead>
              ))}
            </BaseTableRow>
          </BaseTableHeader>
          <BaseTableBody>
            {rows.map((r) => (
              <BaseTableRow key={r.item.id}>
                {[
                  r.item.code,
                  r.item.nhiCode,
                  r.item.barcode,
                  r.item.name,
                  r.item.englishName,
                  r.item.category,
                  r.item.specification,
                  r.item.unit,
                  filter.warehouse || "全部倉別",
                  String(r.quantity),
                  String(r.item.safetyStock),
                  r.expiry,
                  r.item.suggestedPrice,
                  r.usage,
                ].map((v, i) => (
                  <BaseTableCell key={i}>{v}</BaseTableCell>
                ))}
              </BaseTableRow>
            ))}
          </BaseTableBody>
        </BaseTable>
      </div>
      <BaseDialog
        open={!!modal}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <BaseDialogContent
          aria-modal="true"
          className={`items-modal ${modal?.kind === "view" ? "items-modal-wide" : ""}`}
          showCloseButton={false}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            titleRef.current?.focus();
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            if (trigger.current?.isConnected) trigger.current.focus();
            else
              document
                .querySelector<HTMLInputElement>(".items-search input")
                ?.focus();
          }}
        >
          <div className="items-modal-heading">
            <BaseDialogTitle ref={titleRef} tabIndex={-1}>
              <Box size={23} aria-hidden="true" />
              {modalTitle}
            </BaseDialogTitle>
            <BaseButton
              variant="ghost"
              size="icon"
              aria-label="關閉視窗"
              onClick={() => close()}
            >
              <X size={19} />
            </BaseButton>
          </div>
          <BaseDialogDescription className="items-modal-description">
            {modal?.kind === "view"
              ? "查閱品項資料、各倉批次庫存與歷史紀錄。"
              : "本次操作僅更新展示假資料。"}
          </BaseDialogDescription>
          {discard && (
            <div className="items-discard" role="alert">
              <strong>有尚未儲存的修改，要放棄嗎？</strong>
              <div>
                <BaseButton
                  ref={continueRef}
                  variant="outline"
                  onClick={() => {
                    setDiscard(false);
                    if (editorFocus.current?.isConnected)
                      editorFocus.current.focus();
                  }}
                >
                  繼續編輯
                </BaseButton>
                <BaseButton variant="destructive" onClick={() => close(true)}>
                  放棄修改
                </BaseButton>
              </div>
            </div>
          )}
          {modal && (modal.kind === "new" || modal.kind === "edit") && (
            <ItemEditor
              initial={modal.item}
              onDirty={setDirty}
              onCancel={() => close()}
              onSave={(item) => {
                dispatch(saveItem(item));
                setGroup(item.group);
                setNotice(
                  `${item.name}已${item.id ? "更新" : "新增"}。${item.id ? "" : "初始庫存為 0。"}`,
                );
                close(true);
              }}
            />
          )}
          {modal?.kind === "view" && (
            <>
              <ItemDetails item={modal.item} />
              <footer className="items-modal-footer">
                <BaseButton variant="outline" onClick={() => close()}>
                  關閉
                </BaseButton>
              </footer>
            </>
          )}
          {modal?.kind === "status" && (
            <>
              <div className="items-status-confirm">
                <p>
                  確定要{modal.item.active ? "停用" : "啟用"}「{modal.item.name}
                  」嗎？
                </p>
                {modal.item.active &&
                  state.batches.some(
                    (b) => b.itemId === modal.item.id && b.quantity > 0,
                  ) && (
                    <p className="items-error">
                      此品項仍有庫存。停用不會清空庫存或刪除歷史紀錄。
                    </p>
                  )}
              </div>
              <footer className="items-modal-footer">
                <BaseButton variant="outline" onClick={() => close()}>
                  取消
                </BaseButton>
                <BaseButton
                  onClick={() => {
                    dispatch(
                      setItemActive({
                        id: modal.item.id,
                        active: !modal.item.active,
                      }),
                    );
                    setNotice(
                      `${modal.item.name}已${modal.item.active ? "停用" : "啟用"}。`,
                    );
                    close(true);
                  }}
                >
                  確認{modal.item.active ? "停用" : "啟用"}
                </BaseButton>
              </footer>
            </>
          )}
        </BaseDialogContent>
      </BaseDialog>
    </section>
  );
}
