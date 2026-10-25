import { BaseButton } from "@/components/ui/BaseButton";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Link, useLocation, useNavigate } from "react-router";
import { workspaceModulePaths } from "@/constants/workspaceRoutes";
import { WORKSPACE_LOGIN_ENABLED } from "@/constants/workspaceAccess";
import { executeWorkspaceCommand } from "@/store/workspace";
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useWindowScroll, useWindowSize } from "react-use";

// 導覽圖示使用本機 SVG 線條，沿用按鈕文字及作用中顏色。
const icons: Record<string, React.ReactNode> = {
  overview: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  his: <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" />,
  products: (
    <path d="m3 7 9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10M7.5 5l9 4" />
  ),
  stocktake: (
    <>
      <rect x="5" y="5" width="14" height="16" rx="2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="m8 14 3 3 5-6" />
    </>
  ),
};
// 導覽區塊的寬度只影響目前頁面，不改動模組資料或登入權限。
export type BaseSidebarProps = {
  open: boolean;
  hidden: boolean;
  embedded: boolean;
  onWidth: (width: number) => void;
};

export function BaseSidebar(props: BaseSidebarProps) {
  const { open, hidden, embedded, onWidth } = props;
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const s = useAppSelector((root) => root.workspace);
  const defaultWidth = embedded ? 195 : 228;
  const [preferredWidth, setPreferredWidth] = useState(defaultWidth);
  const viewport = useWindowSize();
  const { y: scrollY } = useWindowScroll();
  const [availableHeight, setAvailableHeight] = useState(viewport.height);
  const [adjusting, setAdjusting] = useState(false);
  const [status, setStatus] = useState("");
  const [legacyPagesExpanded, setLegacyPagesExpanded] = useState(true);
  const root = useRef<HTMLElement>(null);
  const gesture = useRef<{
    pointerId: number;
    startX: number;
    width: number;
  } | null>(null);
  const maximum = Math.min(480, Math.max(80, viewport.width - 16)),
    minimum = Math.min(180, maximum);
  // 視窗／截圖暫時縮窄時只限制顯示寬度，不覆寫使用者的偏好寬度。
  const width = Math.max(minimum, Math.min(maximum, preferredWidth));
  const sidebarClassName = `sidebar min-w-0 flex-col border-r border-[var(--line)] bg-white p-0${open ? " open flex h-[min(65dvh,_620px)] md:h-[var(--sidebar-height)]" : " hidden md:flex h-[var(--sidebar-height)]"} sticky top-0 z-[3]${adjusting ? " adjusting select-none" : ""}`;
  // 依側欄實際頂端計算剩餘高度，頁面捲動後不再預留已離開畫面的橫幅空間。
  useLayoutEffect(() => {
    if (!hidden && root.current) {
      setAvailableHeight(
        Math.max(
          0,
          viewport.height -
            Math.max(0, root.current.getBoundingClientRect().top),
        ),
      );
    }
  }, [viewport.height, viewport.width, scrollY, hidden, open]);
  useEffect(() => onWidth(width), [width]);
  function startResize(event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    const bounds = root.current.getBoundingClientRect();
    gesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      width: bounds.width,
    };
    setPreferredWidth(bounds.width);
    event.currentTarget.setPointerCapture(event.pointerId);
    setAdjusting(true);
    event.preventDefault();
  }
  const pointerHandlers = {
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
      const g = gesture.current;
      if (!g || g.pointerId !== event.pointerId) return;
      setPreferredWidth(g.width + event.clientX - g.startX);
    },
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => {
      if (!gesture.current) return;
      gesture.current = null;
      setAdjusting(false);
      if (event.currentTarget.hasPointerCapture(event.pointerId))
        event.currentTarget.releasePointerCapture(event.pointerId);
      setStatus(`導覽區塊位於左側，寬度 ${Math.round(width)} 像素。`);
    },
    onPointerCancel: () => {
      gesture.current = null;
      setAdjusting(false);
    },
    onLostPointerCapture: () => {
      gesture.current = null;
      setAdjusting(false);
    },
  };
  return (
    <aside
      ref={root}
      hidden={hidden}
      className={sidebarClassName}
      id="sidebar"
      style={
        { "--sidebar-height": `${availableHeight}px` } as React.CSSProperties
      }
    >
      <div
        className={`sidebar-body min-h-0 flex-1 overflow-x-hidden overflow-y-auto ${embedded ? "p-[18px_12px]" : "p-[24px_16px]"}`}
      >
        <Link className="brand mx-[10px]" to="/">
          庫存管理系統
        </Link>
        <p
          className={`sidebar-caption ${embedded ? "m-[8px_10px_18px]" : "m-[8px_10px_30px]"} text-[12px] text-[var(--muted)]`}
        >
          庫存管理工作區
        </p>
        <BaseButton
          variant={s.activeModule === "items" ? "module-active" : "module"}
          className="mb-4 h-auto w-full whitespace-normal py-3 text-left"
          aria-current={s.activeModule === "items" ? "page" : undefined}
          onClick={() => navigate(`/items${location.search}`)}
        >
          品項與庫存管理（新版）
        </BaseButton>
        <BaseButton
          variant={s.activeModule === "purchases" ? "module-active" : "module"}
          className="mb-4 h-auto w-full whitespace-normal py-3 text-left"
          aria-current={s.activeModule === "purchases" ? "page" : undefined}
          onClick={() => navigate(`/purchases${location.search}`)}
        >
          進貨管理（新版）
        </BaseButton>
        <BaseButton
          variant={s.activeModule === "base-data" ? "module-active" : "module"}
          className="mb-4 h-auto w-full whitespace-normal py-3 text-left"
          aria-current={s.activeModule === "base-data" ? "page" : undefined}
          onClick={() => navigate(`/base-data${location.search}`)}
        >
          基礎資料管理（新版）
        </BaseButton>
        <BaseButton
          variant={
            s.activeModule === "consumptions" ? "module-active" : "module"
          }
          className="mb-4 h-auto w-full whitespace-normal py-3 text-left"
          aria-current={s.activeModule === "consumptions" ? "page" : undefined}
          onClick={() => navigate(`/consumptions${location.search}`)}
        >
          耗用查詢（新版）
        </BaseButton>
        {(["pos", "stocktakes"] as const).map((key) => (
          <BaseButton
            key={key}
            variant={
              s.activeModule === key ||
              (key === "pos" && s.activeModule === "sales")
                ? "module-active"
                : "module"
            }
            className="mb-4 h-auto w-full whitespace-normal py-3 text-left"
            aria-current={
              s.activeModule === key ||
              (key === "pos" && s.activeModule === "sales")
                ? "page"
                : undefined
            }
            onClick={() =>
              navigate(`${workspaceModulePaths[key]}${location.search}`)
            }
          >
            {key === "pos" ? "銷售管理（新版）" : "盤點管理（新版）"}
          </BaseButton>
        ))}
        <BaseButton
          variant="disclosure"
          id="legacy-pages-toggle"
          className="h-auto min-h-11 w-full justify-between gap-2 whitespace-normal px-3 py-2 text-left"
          aria-expanded={legacyPagesExpanded}
          aria-controls="module-nav"
          aria-describedby="legacy-pages-description"
          onClick={() => setLegacyPagesExpanded(!legacyPagesExpanded)}
        >
          <span>舊頁面區</span>
          <svg
            className={`size-4 shrink-0 transition-transform motion-reduce:transition-none${legacyPagesExpanded ? " rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </BaseButton>
        <p
          id="legacy-pages-description"
          className="mx-3 mb-2 mt-1 text-[12px] leading-5 text-[var(--muted)]"
        >
          舊版頁面，保留供參考；後續依新規格開發。
        </p>
        <nav
          id="module-nav"
          hidden={!legacyPagesExpanded}
          className={legacyPagesExpanded ? "grid gap-[5px]" : "hidden"}
          aria-label="舊頁面功能選單"
        >
          {s.modules
            .filter(
              (module) =>
                ![
                  "items",
                  "purchases",
                  "base-data",
                  "consumptions",
                  "pos",
                  "sales",
                  "stocktakes",
                ].includes(module.key),
            )
            .map((module) => (
              <Fragment key={module.key}>
                {module.group && (
                  <div className="nav-group m-[20px_12px_5px] flex items-center gap-2 text-[11px] tracking-[1px] text-[var(--muted)]">
                    <svg
                      className="navigation-icon block flex-[0_0_18px]"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      focusable="false"
                    >
                      {icons[module.key]}
                    </svg>
                    <span>{module.group}</span>
                  </div>
                )}
                <BaseButton
                  variant={
                    s.activeModule === module.key
                      ? "navigation-active"
                      : "navigation"
                  }
                  data-module={module.key}
                  aria-current={
                    s.activeModule === module.key ? "page" : undefined
                  }
                  onClick={() =>
                    navigate(
                      `${workspaceModulePaths[module.key]}${location.search}`,
                    )
                  }
                >
                  <span>{module.label}</span>
                </BaseButton>
              </Fragment>
            ))}
        </nav>
        <p className="small muted mx-3 mb-[14px]">所有操作僅影響當次假資料</p>
      </div>
      <div
        className="account sidebar-account flex flex-[0_0_auto] items-center gap-3 rounded-[0_0_10px_10px] border-t border-[var(--line)] bg-white px-4 py-3 text-[12px]"
        aria-label="登入帳號"
      >
        <span
          id="account-label"
          className="flex min-w-0 flex-1 flex-col gap-0.5 [overflow-wrap:anywhere]"
        >
          <span className="text-[12px] font-medium leading-5">
            {s.currentAccount}
          </span>
          <span className="text-[11px] leading-4 text-[var(--muted)]">
            {s.canEditExistingData ? "高權限（展示）" : "一般權限"}
          </span>
        </span>
        <BaseButton
          variant="logout"
          id="logout"
          hidden={!WORKSPACE_LOGIN_ENABLED}
          onClick={() => {
            if (s.editor) {
              dispatch(
                executeWorkspaceCommand({
                  type: "update",
                  update: (d) => {
                    d.notice = "請先儲存或取消編輯，再登出。";
                  },
                }),
              );
              return;
            }
            dispatch(
              executeWorkspaceCommand({
                type: "update",
                update: (d) => {
                  d.loggedIn = false;
                  d.notice = "已登出，重新整理可重置假資料";
                },
              }),
            );
          }}
        >
          登出
        </BaseButton>
      </div>
      <div
        id="sidebar-resize"
        className="sidebar-resize"
        role="separator"
        aria-label="調整導覽區塊寬度，使用左右方向鍵"
        aria-orientation="vertical"
        aria-controls="sidebar"
        tabIndex={0}
        aria-valuemin={minimum}
        aria-valuemax={maximum}
        aria-valuenow={Math.round(width)}
        {...pointerHandlers}
        onPointerDown={(e) => startResize(e)}
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
            return;
          event.preventDefault();
          setPreferredWidth(
            event.key === "Home"
              ? 180
              : event.key === "End"
                ? 480
                : width + (event.key === "ArrowLeft" ? -20 : 20),
          );
        }}
      />
      <span
        id="sidebar-layout-status"
        className="sr-only"
        role="status"
        aria-live="polite"
      >
        {status}
      </span>
    </aside>
  );
}
