import { BaseCard } from "@/components/ui/BaseCard";
import { BaseLabel } from "@/components/ui/BaseLabel";
import { BaseInput } from "@/components/ui/BaseInput";
import {
  BaseNativeSelect,
  BaseNativeSelectOption,
} from "@/components/ui/BaseNativeSelect";
import { BaseButton } from "@/components/ui/BaseButton";
import { BaseBadge } from "@/components/ui/BaseBadge";
import { BaseAlert } from "@/components/ui/BaseAlert";
import { Link, useLocation, useNavigate } from "react-router";
import { demoModulePaths } from "@/constants/demoRoutes";
import { DEMO_LOGIN_ENABLED } from "@/constants/demoAccess";
import { BaseModal } from "@/components/ui/BaseModal";
import {
  BaseDataTable,
  BasePaginationContext,
} from "@/components/ui/BaseDataTable";
import { usePresentation } from "@/features/demo/presentation";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, MouseEvent } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { executeDemoCommand } from "@/store/demo";
import {
  OverviewMovements,
  ListPage,
  HistoricalCostsPage,
} from "@/features/demo/render";
import { ScanPage } from "@/features/demo/ScanPage";
import { EditorPage } from "@/features/demo/EditorPage";
import { ItemsPage } from "@/features/items/ItemsPage";
import { PurchasesPage } from "@/features/purchases/PurchasesPage";
import { BaseDataPage } from "@/features/base-data/BaseDataPage";
import { ConsumptionsPage } from "@/features/consumptions/ConsumptionsPage";
import { PosPage } from "@/features/pos/PosPage";
import { StocktakesPage } from "@/features/stocktakes/StocktakesPage";
import { compileInventoryFilter } from "@/helpers/inventoryFilter";
import { createMovementVoucher } from "@/features/demo/domain";
import type {
  Editor,
  EditorKind,
  InventoryFilter,
  ModuleKey,
} from "@/features/demo/types";
const subtitles: Record<ModuleKey, string> = {
  "base-data": "維護倉別與供應商基本資料。",
  consumptions: "查閱 HIS 來源耗用與同步異常。",
  pos: "商品搜尋與前端收銀展示。",
  sales: "銷售歷史、退貨與退款展示。",
  stocktakes: "盲盤輸入、主管核對與複盤展示。",
  purchases: "管理進貨單據、核對結帳與進貨明細。",
  items: "統一管理品項資料、庫存數量及批號效期。",
  "historical-cost": "依已送出的入庫傳票，查閱各料號歷史成本與當次單價。",
  overview: "從資料維護到庫存作業，掌握今天的工作。",
  vendors: "以表格管理廠商基本資料。",
  his: "查詢藥品檔，模擬修改並回寫 HIS。",
  products: "維護 OTC 品項與條碼，庫存透過作業異動更新。",
  receipt: "建立入庫傳票，掃碼加入明細後整批送出。",
  issue: "建立出庫傳票，掃碼加入明細後整批送出。",
  requisitions: "維護領用資料與展示扣庫紀錄。",
  stocktake: "只處理進行中的週期：開始、填寫、確認送出。",
  "stocktake-history": "只查已結束批次：月份紀錄、盤差、操作與更正歷程。",
};
export function DemoPage() {
  const s = useAppSelector((root) => root.demo);
  const dispatch = useAppDispatch();
  const routeLocation = useLocation();
  const navigate = useNavigate();
  const [vendorOptions, setVendorOptions] = useState(false);
  const [highlightedVendor, setHighlightedVendor] = useState<string | null>(
    null,
  );
  const content = useRef<HTMLElement>(null);
  const wasLoggedIn = useRef(false);
  const previousEditor = useRef<Editor | null>(null);
  const [account, setAccount] = useState("demo.pharmacy");
  const [password, setPassword] = useState("demo-only");
  const [permission, setPermission] = useState("standard");
  const [email, setEmail] = useState("");
  const previousRecovery = useRef(false);
  const pageStates = useMemo(() => new Map(), []);
  const embedded = new URLSearchParams(location.search).get("embed") === "1",
    preview = new URLSearchParams(location.search).get("preview") === "1";
  usePresentation();
  // 密碼由院內身分服務管理；展示申請不寄信、不查帳號、不修改密碼。
  useEffect(() => {
    if (!preview) {
      if (s.recovery)
        document
          .querySelector<HTMLElement>(
            s.recoverySent
              ? "#recovery-result"
              : "#recovery-form [name=account]",
          )
          ?.focus();
      else if (previousRecovery.current)
        document
          .querySelector<HTMLInputElement>("#login-form [name=account]")
          ?.focus();
    }
    previousRecovery.current = s.recovery;
  }, [s.recovery, s.recoverySent, preview]);
  useEffect(() => {
    document.body.className = `demo-page${embedded ? " embedded" : ""}${preview ? " preview-mode" : ""}`;
    document.body.inert = preview;
    return () => {
      document.body.inert = false;
    };
  }, []);
  useEffect(() => {
    if (!s.notice) return;
    const timer = setTimeout(
      () =>
        dispatch(
          executeDemoCommand({
            type: "update",
            update: (d) => {
              d.notice = "";
            },
          }),
        ),
      5000,
    );
    return () => clearTimeout(timer);
  }, [s.notice]);
  // 盤點與各模組路由支援直接連結與瀏覽器上一頁／下一頁，未完成表單由 App 保護。
  useEffect(() => {
    const pathname = routeLocation.pathname.replace(/\/+$/, "");
    const requested =
      s.stocktakeRoutes[pathname] ??
      (pathname.startsWith("/demo/stocktakes/") ? "stocktakes" : pathname.startsWith("/demo/consumptions/") ? "consumptions" : pathname.startsWith("/demo/items/")
        ? "items"
        : pathname === "/demo"
          ? "overview"
          : pathname.slice("/demo/".length));
    const module = s.modules.find((module) => module.key === requested);
    if (module && module.key !== s.activeModule)
      dispatch(executeDemoCommand({ type: "navigate", module: module.key }));
  }, [routeLocation.pathname]);
  useEffect(() => {
    setHighlightedVendor(null);
  }, [s.searchTerm]);
  useEffect(() => {
    if (
      DEMO_LOGIN_ENABLED &&
      !wasLoggedIn.current &&
      s.loggedIn &&
      !preview &&
      !embedded
    )
      content.current?.focus();
    if (wasLoggedIn.current && !s.loggedIn)
      document
        .querySelector<HTMLInputElement>("#login-form [name=account]")
        ?.focus();
    wasLoggedIn.current = s.loggedIn;
  }, [s.loggedIn]);
  useEffect(() => {
    const previous = previousEditor.current;
    previousEditor.current = s.editor;
    if (!previous || s.editor || preview) return;
    const action =
      previous.kind === "stocktake-correction"
        ? "correct-count"
        : previous.kind === "stocktake"
          ? "edit-count"
          : "edit";
    const button = Array.from(
      content.current?.querySelectorAll<HTMLButtonElement>("[data-action]") ??
        [],
    ).find(
      (button) =>
        previous.id !== null &&
        button.dataset.id === String(previous.id) &&
        button.dataset.action === action,
    );
    (
      button ||
      (s.activeModule === "receipt"
        ? document.querySelector<HTMLInputElement>("#barcode")
        : null) ||
      content.current
    )?.focus();
  }, [s.editor, preview, s.activeModule]);
  const module = s.modules.find((module) => module.key === s.activeModule);
  const low = s.otcProducts.filter(
    (product) => product.status === "啟用" && product.stock < product.minStock,
  );

  function onSubmit(event: FormEvent<HTMLElement>) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    event.preventDefault();
    const values = Object.fromEntries(
      Array.from(new FormData(form)).map(([key, value]) => [
        key,
        String(value),
      ]),
    );
    if (form.id === "scan-form") {
      dispatch(executeDemoCommand({ type: "lookup", barcode: values.barcode }));
      return;
    }
    if (form.id === "movement-form") {
      dispatch(
        executeDemoCommand({
          type: "update",
          update: (d) => {
            d.errors.movement = "";
            try {
              const quantity = Number(values.quantity),
                product = d.otcProducts.find(
                  (p) => p.id === d.selectedProductId,
                );
              if (!product || product.status !== "啟用")
                throw new Error("請選擇啟用品項。");
              if (
                !Number.isSafeInteger(quantity) ||
                quantity <= 0 ||
                quantity > 1000000
              )
                throw new Error("請輸入 1 至 1,000,000 的整數數量。");
              if (d.activeModule === "issue" && !values.note.trim())
                throw new Error("請輸入耗用用途。");
              let voucher = d.movementVouchers.find(
                (v) => v.id === d.selectedMovementVoucherIds[d.activeModule],
              );
              if (voucher?.submittedAt || voucher?.cancelledAt)
                throw new Error("此傳票已鎖定，請建立新傳票。");
              const reserved =
                voucher?.lines
                  .filter((l) => l.productId === product.id)
                  .reduce((sum, l) => sum + l.quantity, 0) ?? 0;
              if (
                d.activeModule === "issue" &&
                quantity + reserved > product.stock
              )
                throw new Error(
                  `庫存不足，目前僅有 ${product.stock}，本傳票已填 ${reserved}。`,
                );
              const unitCost =
                d.activeModule === "receipt"
                  ? values.unitCost.trim() === ""
                    ? (product.costPrice ?? null)
                    : Number(values.unitCost)
                  : null;
              if (
                unitCost != null &&
                (!Number.isFinite(unitCost) ||
                  unitCost < 0 ||
                  unitCost > 1000000 ||
                  Math.abs(unitCost * 100 - Math.round(unitCost * 100)) >
                    0.000001)
              )
                throw new Error("入庫單價須為 0 至 1,000,000，最多兩位小數。");
              voucher ??= createMovementVoucher(d, d.activeModule);
              voucher.lines.push({
                productId: product.id,
                quantity,
                note: values.note.trim(),
                unitCost,
                filledBy: d.currentAccount,
              });
              d.selectedProductId = null;
              d.scanBarcode = "";
              d.notice = "已加入傳票明細，庫存尚未異動。";
            } catch (error) {
              d.errors.movement =
                error instanceof Error ? error.message : String(error);
            }
          },
        }),
      );
      return;
    }
    const filters: InventoryFilter = {
      materialNumber: values.materialNumber ?? "",
      person: values.person ?? "",
      ...values,
    };
    try {
      compileInventoryFilter(filters);
    } catch (error) {
      dispatch(
        executeDemoCommand({
          type: "update",
          update: (d) => {
            d.errors.filter =
              error instanceof Error ? error.message : String(error);
          },
        }),
      );
      return;
    }
    dispatch(
      executeDemoCommand({
        type: "update",
        update: (d) => {
          d.errors.filter = "";
          if (form.id === "overview-movement-filter")
            d.overviewMovementFilter = filters;
          if (form.id === "receipt-movement-filter")
            d.receiptMovementFilter = filters;
          if (form.id === "issue-movement-time-filter")
            d.issueMovementTimeFilter = filters;
          if (form.id === "historical-cost-filter")
            d.historicalCostFilter = filters;
          if (form.id === "requisition-filter") d.requisitionFilter = filters;
          d.pageRevision++;
        },
      }),
    );
  }
  function onClick(event: MouseEvent<HTMLElement>) {
    const button = (event.target as HTMLElement).closest("button");
    if (!button) return;
    const action = button.dataset.action;
    if (button.dataset.module) {
      const targetModule = s.modules.find(
        (module) => module.key === button.dataset.module,
      );
      if (targetModule)
        navigate(`${demoModulePaths[targetModule.key]}${routeLocation.search}`);
      return;
    }
    if (button.dataset.vendorOption) {
      dispatch(
        executeDemoCommand({
          type: "update",
          update: (d) => {
            d.searchTerm = button.dataset.vendorOption;
            d.pageRevision++;
          },
        }),
      );
      setVendorOptions(false);
      return;
    }
    if (action === "add" || action === "edit") {
      dispatch(
        executeDemoCommand({
          type: "open-editor",
          kind: s.activeModule as EditorKind,
          ...(action === "edit" ? { id: button.dataset.id } : {}),
        }),
      );
      return;
    }
    if (
      ["delete", "create-voucher", "submit-voucher", "cancel-voucher"].includes(
        action,
      )
    ) {
      dispatch(
        executeDemoCommand({ type: "action", action, id: button.dataset.id }),
      );
      return;
    }
    if (button.hasAttribute("data-remove-voucher-line")) {
      dispatch(
        executeDemoCommand({
          type: "update",
          update: (d) => {
            const voucher = d.movementVouchers.find(
              (v) => v.id === d.selectedMovementVoucherIds[d.activeModule],
            );
            if (voucher && !voucher.submittedAt && !voucher.cancelledAt)
              voucher.lines.splice(Number(button.dataset.removeVoucherLine), 1);
          },
        }),
      );
      return;
    }
    if (action === "show-low-stock") {
      const panel = document.getElementById("low-stock-panel");
      panel?.focus({ preventScroll: true });
      panel?.scrollIntoView({ block: "start" });
      return;
    }
    if (action?.startsWith("clear-") || action === "reset-overview-filter") {
      dispatch(
        executeDemoCommand({
          type: "update",
          update: (d) => {
            const empty = {
              voucherId: "",
              materialNumber: "",
              person: "",
              start: "",
              end: "",
            };
            if (action === "clear-historical-cost-filter")
              d.historicalCostFilter = empty;
            if (action === "clear-requisition-filter") {
              d.requisitionFilter = empty;
              d.searchTerm = "";
            }
            if (action === "clear-receipt-filter")
              d.receiptMovementFilter = empty;
            if (action === "clear-movement-time")
              d.issueMovementTimeFilter = empty;
            if (action === "reset-overview-filter")
              d.overviewMovementFilter = {
                ...empty,
                date: new Date().toLocaleDateString("sv-SE"),
                product: "",
                action: "",
                workspace: "",
              };
            d.errors.filter = "";
            d.pageRevision++;
          },
        }),
      );
      return;
    }
    if (button.dataset.movementPeriod) {
      // 使用本地日曆推算，跨月、跨年與夏令時間仍維持週一至週日。
      const [unit, relative] = button.dataset.movementPeriod.split("-"),
        offset = relative === "previous" ? -1 : relative === "next" ? 1 : 0;
      const now = new Date();
      const start =
        unit === "month"
          ? new Date(now.getFullYear(), now.getMonth() + offset, 1)
          : new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() - ((now.getDay() + 6) % 7) + offset * 7,
            );
      const end =
        unit === "month"
          ? new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59)
          : new Date(
              start.getFullYear(),
              start.getMonth(),
              start.getDate() + 6,
              23,
              59,
            );
      const local = (date: Date) =>
        `${date.toLocaleDateString("sv-SE")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
      dispatch(
        executeDemoCommand({
          type: "update",
          update: (d) => {
            d.issueMovementTimeFilter = {
              ...d.issueMovementTimeFilter,
              start: local(start),
              end: local(end),
            };
            d.errors.filter = "";
            d.pageRevision++;
          },
        }),
      );
    }
  }
  return (
    <BasePaginationContext.Provider
      value={{ revision: s.pageRevision, states: pageStates }}
    >
      <div className="demo-banner">
        展示模式・假資料 <span>重新整理即重置</span>
      </div>
      {/* 登入頁暫時停用；開啟 DEMO_LOGIN_ENABLED 後恢復原表單。 */}
      {DEMO_LOGIN_ENABLED && (
        <section id="login" className="login-layout" hidden={s.loggedIn}>
          <div className="login-story">
            <div className="brand">庫存管理系統</div>
            <p className="eyebrow">INVENTORY WORKSPACE</p>
            <h1>
              讓庫存作業
              <br />
              清楚、有序。
            </h1>
            <p>
              HIS 藥品查詢與維護、OTC 入出庫與領用，
              <br />
              在同一個工作平台掌握。
            </p>
            <div className="login-tags">
              <span>HIS 藥品</span>
              <span>OTC 庫存</span>
              <span>掃碼盤點</span>
            </div>
          </div>
          <BaseCard asChild>
            <form
              id="login-form"
              className="login-card"
              hidden={s.recovery}
              onSubmit={(event) => {
                event.preventDefault();
                if (!account.trim() || !password.trim()) return;
                dispatch(
                  executeDemoCommand({
                    type: "update",
                    update: (d) => {
                      d.currentAccount = account.trim();
                      d.canEditExistingData = permission === "privileged";
                      d.loggedIn = true;
                      d.activeModule =
                        d.stocktakeRoutes[routeLocation.pathname] ??
                        d.activeModule;
                      d.notice = "已登入展示工作區（未連線 NAS LDAP）";
                    },
                  }),
                );
              }}
            >
              <p className="eyebrow">歡迎使用庫存管理系統</p>
              <h2>登入工作區</h2>
              <p className="muted">LDAP 帳號登入 · 群組權限管理（展示）</p>
              <BaseLabel>
                帳號
                <BaseInput
                  name="account"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  autoComplete="off"
                  required
                />
              </BaseLabel>
              <BaseLabel>
                密碼
                <BaseInput
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                  required
                />
              </BaseLabel>
              <BaseLabel>
                展示權限
                <BaseNativeSelect
                  id="demo-permission"
                  value={permission}
                  onChange={(e) => setPermission(e.target.value)}
                >
                  <BaseNativeSelectOption value="standard">
                    一般人員
                  </BaseNativeSelectOption>
                  <BaseNativeSelectOption value="privileged">
                    高權限人員
                  </BaseNativeSelectOption>
                </BaseNativeSelect>
              </BaseLabel>
              <p className="muted small">
                此選單僅模擬權限；正式權限由 NAS LDAP 群組提供。
              </p>
              <BaseButton variant="default" className="primary" type="submit">
                使用展示帳號登入 →
              </BaseButton>
              <p className="muted small">
                此處僅驗證必填，不驗證真實帳密。請使用展示帳號。
              </p>
              <div className="login-links">
                <BaseButton
                  variant="outline"
                  id="forgot-password"
                  type="button"
                  className="text-button"
                  onClick={() =>
                    dispatch(
                      executeDemoCommand({
                        type: "update",
                        update: (d) => {
                          d.recovery = true;
                          d.recoverySent = false;
                        },
                      }),
                    )
                  }
                >
                  忘記密碼？
                </BaseButton>
                <Link to="/">← 返回系統規劃</Link>
              </div>
            </form>
          </BaseCard>
          <BaseCard
            id="password-recovery"
            className="login-card"
            hidden={!s.recovery}
          >
            <p className="eyebrow">LDAP 帳號服務</p>
            <h2>忘記密碼</h2>
            <p className="muted">填寫 LDAP 帳號與登記信箱，申請密碼重設。</p>
            <form
              id="recovery-form"
              hidden={s.recoverySent}
              onSubmit={(event) => {
                event.preventDefault();
                if (account.trim())
                  dispatch(
                    executeDemoCommand({
                      type: "update",
                      update: (d) => {
                        d.recoverySent = true;
                      },
                    }),
                  );
              }}
            >
              <BaseLabel>
                LDAP 帳號
                <BaseInput
                  name="account"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  autoComplete="username"
                  required
                />
              </BaseLabel>
              <BaseLabel>
                登記信箱
                <BaseInput
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@hospital.example"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </BaseLabel>
              <p className="muted small">
                此為介面展示，請使用假資料；尚未串接院內 LDAP 或寄信服務。
              </p>
              <BaseButton variant="default" type="submit" className="primary">
                模擬申請重設
              </BaseButton>
            </form>
            <BaseAlert
              id="recovery-result"
              className="mb-4 bg-secondary p-4 text-sm leading-[1.8]"
              role="status"
              tabIndex={-1}
              hidden={!s.recoverySent}
            >
              展示申請流程已完成。正式服務會在資料符合院內規則時提供重設指引；本次未查詢帳號、寄送郵件或變更密碼。
            </BaseAlert>
            <BaseButton
              variant="outline"
              id="back-to-login"
              type="button"
              className="text-button"
              onClick={() => {
                setEmail("");
                dispatch(
                  executeDemoCommand({
                    type: "update",
                    update: (d) => {
                      d.recovery = false;
                      d.recoverySent = false;
                    },
                  }),
                );
              }}
            >
              ← 返回登入
            </BaseButton>
          </BaseCard>
        </section>
      )}
      <div className="workspace-content min-w-0" hidden={!s.loggedIn}>
        <main
          ref={content}
          id="content"
          tabIndex={-1}
          hidden={Boolean(s.editor)}
          onSubmit={onSubmit}
          onClick={onClick}
          onChange={(event) => {
            const target = event.target;
            if (!(
              target instanceof HTMLInputElement ||
              target instanceof HTMLSelectElement
            ))
              return;
            const value = target.value;
            if (target.id === "movement-voucher")
              dispatch(
                executeDemoCommand({
                  type: "update",
                  update: (d) => {
                    d.selectedMovementVoucherIds[d.activeModule] =
                      value || null;
                    d.selectedProductId = null;
                    d.scanBarcode = "";
                  },
                }),
              );
            if (target.id === "vendor-status-filter")
              dispatch(
                executeDemoCommand({
                  type: "update",
                  update: (d) => {
                    d.vendorStatusFilter = value;
                    d.pageRevision++;
                  },
                }),
              );
            if (target.id === "search")
              dispatch(
                executeDemoCommand({
                  type: "update",
                  update: (d) => {
                    d.searchTerm = value;
                    d.pageRevision++;
                  },
                }),
              );
          }}
          onKeyDown={(event) => {
            const target = event.target as HTMLElement;
            const search = target.closest(".vendor-search");
            if (!search) return;
            const options = Array.from(
              search.querySelectorAll<HTMLButtonElement>(
                "[data-vendor-option]",
              ),
            );
            if (event.key === "Escape") {
              event.preventDefault();
              search.querySelector<HTMLInputElement>("#search")?.focus();
              setVendorOptions(false);
            }
            if (
              (event.key === "ArrowDown" || event.key === "ArrowUp") &&
              options.length
            ) {
              event.preventDefault();
              setVendorOptions(true);
              const index = options.indexOf(target as HTMLButtonElement);
              const next =
                index < 0
                  ? event.key === "ArrowDown"
                    ? 0
                    : options.length - 1
                  : (index +
                      (event.key === "ArrowDown" ? 1 : -1) +
                      options.length) %
                    options.length;
              setHighlightedVendor(options[next].dataset.vendorOption ?? null);
              options[next].focus();
            }
          }}
          onFocus={(event) => {
            if ((event.target as HTMLElement).id === "search")
              setVendorOptions(true);
          }}
          onBlur={(event) => {
            if (
              !(event.relatedTarget as HTMLElement)?.closest(".vendor-search")
            )
              setVendorOptions(false);
          }}
        >
          {!["items", "purchases", "base-data", "consumptions", "pos", "sales", "stocktakes"].includes(s.activeModule) && (
            <div className="page-heading">
              <div>
                <p className="eyebrow">
                  庫存管理系統 / {s.activeModule === "his" ? "HIS" : "DEMO"}
                </p>
                <h2>{module.label}</h2>
                <p>{subtitles[s.activeModule]}</p>
              </div>
              {["vendors", "products", "requisitions"].includes(
                s.activeModule,
              ) ? (
                <BaseButton variant="default" className="primary" data-action="add">
                  ＋ 新增資料
                </BaseButton>
              ) : (
                <div className="page-heading-actions">
                  {s.activeModule === "overview" && (
                    <BaseButton
                      variant="outline"
                      type="button"
                      className="low-stock-bell"
                      data-action="show-low-stock"
                      aria-controls="low-stock-panel"
                      aria-label={`低庫存提醒，共 ${low.length} 個品項，點擊查看`}
                      title="查看低庫存提醒"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="22"
                        height="22"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                        <path d="M10 21h4M12 2V1" />
                      </svg>
                      <span className="low-stock-count">{low.length}</span>
                      <span>低庫存提醒</span>
                    </BaseButton>
                  )}
                  <BaseBadge variant="secondary" className="tag">
                    展示模式・假資料
                  </BaseBadge>
                </div>
              )}
            </div>
          )}
          {s.activeModule === "his" && (
            <BaseAlert role="note" className="callout">
              日常扣庫由 HIS
              執行。本頁僅模擬藥品檔維護與回寫；藥品編輯不修改庫存。
            </BaseAlert>
          )}
          {s.activeModule === "requisitions" && (
            <BaseAlert role="note" className="callout assumption">
              展示假設，正式規則待確認：領用立即扣庫，修改依差額調整，刪除回復庫存；不重複產生耗用扣庫。
            </BaseAlert>
          )}
          {["stocktake", "stocktake-history"].includes(s.activeModule) && (
            <BaseAlert role="note" className="callout assumption">
              展示假設，正式規則待確認：HIS 與 OTC
              盤點確認後直接調整假庫存。此操作不會連線或修改 HIS 資料庫。
            </BaseAlert>
          )}
          <Fragment key={s.activeModule}>
            {s.activeModule === "stocktakes" ? (
              <StocktakesPage />
            ) : ["pos", "sales"].includes(s.activeModule) ? (
              <PosPage />
            ) : s.activeModule === "consumptions" ? (
              <ConsumptionsPage />
            ) : s.activeModule === "base-data" ? (
              <BaseDataPage />
            ) : s.activeModule === "purchases" ? (
              <PurchasesPage />
            ) : s.activeModule === "items" ? (
              <ItemsPage />
            ) : s.activeModule === "overview" ? (
              <>
                {<OverviewMovements />}
                <BaseCard id="low-stock-panel" className="panel" tabIndex={-1}>
                  <h3>OTC 低庫存提醒</h3>
                  <BaseDataTable
                    tableKey="overview-low-stock"
                    headers={["品項", "庫存", "最低庫存", "單位", "填寫人員"]}
                    rows={low.map((product) => [
                      product.name,
                      String(product.stock),
                      String(product.minStock),
                      product.unit,
                      product.filledBy ?? "未記錄",
                    ])}
                  />
                  <BaseButton
                    variant="outline"
                    data-module="receipt"
                    className="mt-4"
                  >
                    前往掃碼入庫 →
                  </BaseButton>
                </BaseCard>
              </>
            ) : s.activeModule === "historical-cost" ? (
              <HistoricalCostsPage />
            ) : ["vendors", "his", "products", "requisitions"].includes(
                s.activeModule,
              ) ? (
              <ListPage
                vendorOptions={vendorOptions}
                highlightedVendor={highlightedVendor}
              />
            ) : (
              <ScanPage />
            )}
          </Fragment>
          {["vendors", "his", "products", "requisitions"].includes(
            s.activeModule,
          ) && (
            <BaseCard className="panel">
              <h3>資料修改歷程</h3>
              <BaseDataTable
                tableKey={`data-changes-${s.activeModule}`}
                headers={[
                  "時間",
                  "識別",
                  "欄位",
                  "原值",
                  "新值",
                  "操作",
                  "修改人員",
                ]}
                rows={s.dataChangeRecords
                  .filter((c) => c.kind === s.activeModule)
                  .slice()
                  .reverse()
                  .map((c) => [
                    new Date(c.time).toLocaleString("zh-TW"),
                    String(c.recordId),
                    (
                      {
                        code: "廠商代碼",
                        name: "名稱",
                        shortName: "簡稱",
                        contact: "聯絡人",
                        phone: "電話",
                        email: "Email",
                        barcode: "國際條碼",
                        spec: "規格",
                        unit: "單位",
                        vendorId: "廠商",
                        costPrice: "成本價",
                        salePrice: "售價",
                        minStock: "最低庫存",
                        activationDate: "啟用日期",
                        deactivationDate: "停用日期",
                        person: "領用人",
                        productId: "品項",
                        quantity: "數量",
                        note: "備註",
                      } as Record<string, string>
                    )[c.field] ?? c.field,
                    c.before,
                    c.after,
                    c.permission,
                    c.filledBy,
                  ])}
              />
            </BaseCard>
          )}
          {s.errors.page && (
            <p className="error" role="alert">
              {s.errors.page}
            </p>
          )}
        </main>
        <EditorPage />
      </div>
      <BaseAlert
        id="notice"
        role="status"
        aria-live="polite"
        hidden={!s.notice}
        className="pointer-events-none fixed right-6 bottom-6 z-[5] w-auto max-w-[calc(100%_-_48px)] rounded-[10px] border-0 bg-[#17364a] px-[22px] py-[14px] text-base leading-[1.6] text-white shadow-[0_8px_30px_#17364a33]"
      >
        {s.notice}
      </BaseAlert>
      <BaseModal
        id="confirmation"
        title="確認操作"
        open={Boolean(s.confirmation)}
        preview={preview}
        onClose={(value) => {
          if (value === "confirm")
            dispatch(executeDemoCommand({ type: "confirm" }));
          else
            dispatch(
              executeDemoCommand({
                type: "update",
                update: (d) => {
                  d.confirmation = null;
                },
              }),
            );
        }}

        dialogContent={
          <>
            <form method="dialog">
              <h2>確認操作</h2>
              <p id="confirmation-text">{s.confirmation?.message}</p>
              <div className="dialog-actions">
                <BaseButton variant="outline" value="cancel">
                  取消
                </BaseButton>
                <BaseButton variant="default" value="confirm" className="primary">
                  確認
                </BaseButton>
              </div>
            </form>
          </>
        }
      />
      <BaseModal
        id="readonly-notice"
        title="目前不可編輯"
        open={Boolean(s.readonlyReason)}
        preview={preview}
        labelledBy="readonly-title"
        describedBy="readonly-reason readonly-policy"
        onClose={() =>
          dispatch(
            executeDemoCommand({
              type: "update",
              update: (d) => {
                d.readonlyReason = "";
              },
            }),
          )
        }

        dialogContent={
          <>
            <form method="dialog">
              <h2 id="readonly-title">目前不可編輯</h2>
              <p id="readonly-reason">{s.readonlyReason}</p>
              <p id="readonly-policy">
                權限採 LDAP
                群組對應系統角色的方向。需與使用者確認各群組可修改的欄位、料號啟用／停用權限，以及對入庫、出庫與領用的限制；目前
                Demo 尚未串接 LDAP。
              </p>
              <div className="dialog-actions">
                <BaseButton variant="default" className="primary" value="close">
                  了解
                </BaseButton>
              </div>
            </form>
          </>
        }
      />
    </BasePaginationContext.Provider>
  );
}
