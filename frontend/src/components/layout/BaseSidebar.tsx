import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Link, useLocation, useNavigate } from "react-router";
import { demoModulePaths } from "@/constants/demoRoutes";
import { executeDemoCommand } from "@/store/demo";
import { Fragment, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useWindowSize } from "react-use";

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
// 導覽區塊的移動與尺寸只影響目前頁面，不改動模組資料或登入權限。
export type BaseSidebarProps = {
  open: boolean;
  hidden: boolean;
  embedded: boolean;
  onWidth: (width: number, floating: boolean) => void;
};

export function BaseSidebar(props: BaseSidebarProps) {
  const { open, hidden, embedded, onWidth } = props;
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const s = useAppSelector((root) => root.demo);
  const defaultWidth = embedded ? 195 : 228;
  const [layout, setLayout] = useState({
    floating: false,
    width: defaultWidth,
    x: 8,
    y: 48,
  });
  const viewport = useWindowSize();
  const [adjusting, setAdjusting] = useState(false);
  const [status, setStatus] = useState("");
  const root = useRef<HTMLElement>(null);
  const gesture = useRef<{
    kind: string;
    pointerId: number;
    startX: number;
    startY: number;
    x: number;
    y: number;
    width: number;
  } | null>(null);
  const maximum = Math.min(480, Math.max(80, viewport.width - 16)),
    minimum = Math.min(180, maximum);
  // 視窗／截圖暫時縮窄時只限制顯示寬度，不覆寫使用者的偏好寬度。
  const width = Math.max(minimum, Math.min(maximum, layout.width));
  const x = Math.max(
      8,
      Math.min(Math.max(8, viewport.width - width - 8), layout.x),
    ),
    y = Math.max(8, Math.min(Math.max(8, viewport.height - 120), layout.y));
  const sidebarClassName = `sidebar min-w-0 flex-col border-r border-[var(--line)] bg-white p-0${open ? " open flex h-[min(65dvh,_620px)] md:h-[calc(100dvh_-_35px)]" : " hidden md:flex h-[calc(100dvh_-_35px)]"}${layout.floating ? " floating fixed z-[6] w-[var(--sidebar-width)] rounded-[10px] border shadow-[0_8px_28px_#24384725]" : " sticky top-0 z-[3]"}${adjusting ? " adjusting select-none" : ""}`;
  useEffect(() => onWidth(width, layout.floating), [width, layout.floating]);
  function start(event: ReactPointerEvent<HTMLElement>, kind: string) {
    if (event.button !== 0) return;
    const bounds = root.current.getBoundingClientRect();
    gesture.current = {
      kind,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: bounds.left,
      y: bounds.top,
      width: bounds.width,
    };
    setLayout((l) => ({
      ...l,
      width: bounds.width,
      ...(kind === "move"
        ? { floating: true, x: bounds.left, y: bounds.top }
        : {}),
    }));
    event.currentTarget.setPointerCapture(event.pointerId);
    setAdjusting(true);
    event.preventDefault();
  }
  const pointerHandlers = {
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
      const g = gesture.current;
      if (!g || g.pointerId !== event.pointerId) return;
      if (g.kind === "move")
        setLayout((l) => ({
          ...l,
          x: g.x + event.clientX - g.startX,
          y: g.y + event.clientY - g.startY,
        }));
      else
        setLayout((l) => ({ ...l, width: g.width + event.clientX - g.startX }));
    },
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => {
      if (!gesture.current) return;
      gesture.current = null;
      setAdjusting(false);
      if (event.currentTarget.hasPointerCapture(event.pointerId))
        event.currentTarget.releasePointerCapture(event.pointerId);
      setStatus(
        `導覽區塊${layout.floating ? "已移動" : "位於左側"}，寬度 ${Math.round(width)} 像素。`,
      );
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
        layout.floating
          ? { left: x, top: y, height: Math.max(100, viewport.height - y - 8) }
          : undefined
      }
    >
      <div
        className={`sidebar-controls flex shrink-0 items-center gap-1 border-b border-[var(--line)] bg-[#f8fafc] p-[10px_8px]${layout.floating ? " rounded-t-[10px]" : ""}`}
      >
        <Button
          variant="outline"
          type="button"
          id="sidebar-drag"
          aria-label="拖動導覽區塊，也可使用方向鍵"
          title="拖曳移動；方向鍵也可調整位置"
          {...pointerHandlers}
          onPointerDown={(e) => start(e, "move")}
          className={`flex-1 touch-none border-transparent bg-transparent p-[6px] text-left text-[11px] whitespace-nowrap${adjusting ? " cursor-grabbing" : " cursor-grab"}`}
          onKeyDown={(event) => {
            if (
              !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                event.key,
              )
            )
              return;
            event.preventDefault();
            const bounds = root.current.getBoundingClientRect(),
              step = event.shiftKey ? 40 : 10;
            setLayout((l) => ({
              ...l,
              floating: true,
              x:
                (l.floating ? x : bounds.left) +
                (event.key === "ArrowRight"
                  ? step
                  : event.key === "ArrowLeft"
                    ? -step
                    : 0),
              y:
                (l.floating ? y : bounds.top) +
                (event.key === "ArrowDown"
                  ? step
                  : event.key === "ArrowUp"
                    ? -step
                    : 0),
            }));
          }}
        >
          ⠿ 功能導覽
        </Button>
        <Button
          variant="outline"
          type="button"
          id="sidebar-reset"
          className="p-[6px] text-[11px] whitespace-nowrap"
          title="恢復左側預設位置與寬度"
          onClick={() => {
            setLayout({ floating: false, width: defaultWidth, x: 8, y: 48 });
            setStatus("導覽區塊已恢復左側預設位置與寬度。");
          }}
        >
          恢復位置
        </Button>
      </div>
      <div
        className={`sidebar-body min-h-0 flex-1 overflow-x-hidden overflow-y-auto ${embedded ? "p-[18px_12px]" : "p-[24px_16px]"}`}
      >
        <Link className="brand mx-[10px]" to="/demo">
          庫存管理系統
        </Link>
        <p
          className={`sidebar-caption ${embedded ? "m-[8px_10px_18px]" : "m-[8px_10px_30px]"} text-[12px] text-[var(--muted)]`}
        >
          庫存管理工作區
        </p>
        <nav id="module-nav" className="grid gap-[5px]" aria-label="功能選單">
          {s.modules.map((module) => (
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
              <Button
                variant="outline"
                data-module={module.key}
                className={`flex w-full min-w-0 items-center gap-[10px] rounded-[7px] border-transparent bg-transparent p-3 text-left font-semibold${s.activeModule === module.key ? " active border-[#d3e0e9] bg-[#eaf1f6] text-[#245e7d] shadow-[inset_3px_0_var(--primary)]" : ""}`}
                aria-current={
                  s.activeModule === module.key ? "page" : undefined
                }
                onClick={() =>
                  navigate(`${demoModulePaths[module.key]}${location.search}`)
                }
              >
                <span>{module.label}</span>
              </Button>
            </Fragment>
          ))}
        </nav>
        <Link
          className={`planning-link m-[36px_12px_12px] block text-[13px]${embedded ? " hidden" : ""}`}
          to="/board"
        >
          畫面規劃與流程示範 ↗
        </Link>
        <Link
          className={`planning-link m-[36px_12px_12px] block text-[13px]${embedded ? " hidden" : ""}`}
          to="/"
        >
          ← 返回系統規劃
        </Link>
        <p className="small muted mx-3 mb-[14px]">所有操作僅影響當次假資料</p>
      </div>
      <div
        className="account sidebar-account flex flex-[0_0_auto] flex-col items-start gap-[10px] rounded-[0_0_10px_10px] border-t border-[var(--line)] bg-[#f8fafc] p-[14px_20px] text-[12px]"
        aria-label="登入帳號"
      >
        <span
          id="account-label"
          className="max-w-full [overflow-wrap:anywhere]"
        >
          {s.currentAccount} ·{" "}
          {s.canEditExistingData ? "高權限（展示）" : "一般權限"}
        </span>
        <Button
          variant="outline"
          id="logout"
          className="p-[6px_12px] text-[12px]"
          onClick={() => {
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
        >
          登出
        </Button>
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
        onPointerDown={(e) => start(e, "resize")}
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
            return;
          event.preventDefault();
          setLayout((l) => ({
            ...l,
            width:
              event.key === "Home"
                ? 180
                : event.key === "End"
                  ? 480
                  : width + (event.key === "ArrowLeft" ? -20 : 20),
          }));
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
