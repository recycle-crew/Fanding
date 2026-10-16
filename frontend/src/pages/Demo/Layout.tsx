import { demoModulePaths } from "@/constants/demoRoutes";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { executeDemoCommand } from "@/store/demo";
import { Sidebar } from "@/components/layout/Sidebar";
import { Modal } from "@/components/ui/Modal";
import { PaginationContext } from "@/components/ui/DataTable";
import type { ModuleKey } from "@/types/demo";
import { usePresentation } from "@/features/demo/presentation";
export interface DemoLayoutContext {
  navigate: (module: ModuleKey) => void;
}

export function DemoLayout() {
  const s = useAppSelector((root) => root.demo);
  const dispatch = useAppDispatch();
  const routeLocation = useLocation();
  const navigateRoute = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebar, setSidebar] = useState({
    width: new URLSearchParams(location.search).has("embed") ? 195 : 228,
    floating: false,
  });
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
      (pathname === "/demo" ? "overview" : pathname.slice("/demo/".length));
    const module = s.modules.find((module) => module.key === requested);
    if (module && module.key !== s.activeModule)
      dispatch(executeDemoCommand({ type: "navigate", module: module.key }));
  }, [routeLocation.pathname]);

  function navigate(module: ModuleKey) {
    if (s.editor || s.confirmation) {
      dispatch(executeDemoCommand({ type: "navigate", module }));
      return;
    }
    navigateRoute(`${demoModulePaths[module]}${routeLocation.search}`);
    setMenuOpen(false);
  }
  return (
    <PaginationContext.Provider
      value={{ revision: s.pageRevision, states: pageStates }}
    >
      <div className="demo-banner">
        展示模式・假資料 <span>重新整理即重置</span>
      </div>
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
                    d.stocktakeRoutes[routeLocation.pathname] ?? d.activeModule;
                  d.notice = "已登入展示工作區（未連線 NAS LDAP）";
                },
              }),
            );
          }}
        >
          <p className="eyebrow">歡迎使用庫存管理系統</p>
          <h2>登入工作區</h2>
          <p className="muted">LDAP 帳號登入 · 群組權限管理（展示）</p>
          <label>
            帳號
            <input
              name="account"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              autoComplete="off"
              required
            />
          </label>
          <label>
            密碼
            <input
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
              required
            />
          </label>
          <label>
            展示權限
            <select
              id="demo-permission"
              value={permission}
              onChange={(e) => setPermission(e.target.value)}
            >
              <option value="standard">一般人員</option>
              <option value="privileged">高權限人員</option>
            </select>
          </label>
          <p className="muted small">
            此選單僅模擬權限；正式權限由 NAS LDAP 群組提供。
          </p>
          <button className="primary" type="submit">
            使用展示帳號登入 →
          </button>
          <p className="muted small">
            此處僅驗證必填，不驗證真實帳密。請使用展示帳號。
          </p>
          <div className="login-links">
            <button
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
            </button>
            <Link to="/">← 返回系統規劃</Link>
          </div>
        </form>
        <div id="password-recovery" className="login-card" hidden={!s.recovery}>
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
            <label>
              LDAP 帳號
              <input
                name="account"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                autoComplete="username"
                required
              />
            </label>
            <label>
              登記信箱
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@hospital.example"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <p className="muted small">
              此為介面展示，請使用假資料；尚未串接院內 LDAP 或寄信服務。
            </p>
            <button type="submit" className="primary">
              模擬申請重設
            </button>
          </form>
          <p
            id="recovery-result"
            role="status"
            tabIndex={-1}
            hidden={!s.recoverySent}
          >
            展示申請流程已完成。正式服務會在資料符合院內規則時提供重設指引；本次未查詢帳號、寄送郵件或變更密碼。
          </p>
          <button
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
          </button>
        </div>
      </section>
      <div
        id="workspace"
        className={`workspace tw:grid tw:compact:grid-cols-[minmax(0,1fr)] ${sidebar.floating ? "sidebar-detached tw:grid-cols-[minmax(0,1fr)]" : "tw:grid-cols-[var(--sidebar-width,228px)_minmax(0,1fr)]"}`}
        hidden={!s.loggedIn}
        style={{ "--sidebar-width": `${sidebar.width}px` } as CSSProperties}
      >
        <Sidebar
          open={menuOpen}
          embedded={embedded}
          onNavigate={navigate}
          onLogout={() => {
            if (s.editor) {
              dispatch(
                executeDemoCommand({
                  type: "update",
                  update: (d) => {
                    d.notice = "請先儲存或取消編輯，再登出。";
                  },
                }),
              );
              return;
            }
            dispatch(
              executeDemoCommand({
                type: "update",
                update: (d) => {
                  d.loggedIn = false;
                  d.notice = "已登出，重新整理可重置假資料";
                },
              }),
            );
          }}
          onWidth={(width, floating) =>
            setSidebar((previous) =>
              previous.width === width && previous.floating === floating
                ? previous
                : { width, floating },
            )
          }
        />
        <div className="main-shell tw:min-w-0">
          <header className="topbar">
            <button
              id="menu-toggle"
              className="mobile-menu tw:hidden tw:compact:block"
              aria-controls="sidebar"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              ☰ 功能選單
            </button>
            <span id="workspace-label" className="workspace-label">
              {s.activeModule === "his"
                ? "HIS 工作區"
                : ["stocktake", "stocktake-history"].includes(s.activeModule)
                  ? `${s.stocktakeWorkspace} ${s.activeModule === "stocktake-history" ? "歷史查詢" : "現有週期"}工作區`
                  : [
                        "products",
                        "historical-cost",
                        "receipt",
                        "issue",
                        "requisitions",
                      ].includes(s.activeModule)
                    ? "OTC 工作區"
                    : "共同工作區"}
            </span>
          </header>
          <Outlet context={{ navigate } satisfies DemoLayoutContext} />
        </div>
      </div>
      <div id="notice" role="status" aria-live="polite" hidden={!s.notice}>
        {s.notice}
      </div>
      <Modal
        id="confirmation"
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
      >
        <form method="dialog">
          <h2>確認操作</h2>
          <p id="confirmation-text">{s.confirmation?.message}</p>
          <div className="dialog-actions">
            <button value="cancel">取消</button>
            <button value="confirm" className="primary">
              確認
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        id="readonly-notice"
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
      >
        <form method="dialog">
          <h2 id="readonly-title">目前不可編輯</h2>
          <p id="readonly-reason">{s.readonlyReason}</p>
          <p id="readonly-policy">
            權限採 LDAP
            群組對應系統角色的方向。需與使用者確認各群組可修改的欄位、料號啟用／停用權限，以及對入庫、出庫與領用的限制；目前
            Demo 尚未串接 LDAP。
          </p>
          <div className="dialog-actions">
            <button className="primary" value="close">
              了解
            </button>
          </div>
        </form>
      </Modal>
    </PaginationContext.Provider>
  );
}
