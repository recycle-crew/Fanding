import { useAppSelector } from "@/store/hooks";
import { Link } from "react-router";
import { Fragment, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

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
export function Sidebar({
  open,
  onNavigate,
  onLogout,
  embedded,
  onWidth,
}: {
  open: boolean;
  onNavigate: (module: import("@/types/demo").ModuleKey) => void;
  onLogout: () => void;
  embedded: boolean;
  onWidth: (width: number, floating: boolean) => void;
}) {
  const s = useAppSelector((root) => root.demo);
  const defaultWidth = embedded ? 195 : 228;
  const [layout, setLayout] = useState({
    floating: false,
    width: defaultWidth,
    x: 8,
    y: 48,
  });
  const [viewport, setViewport] = useState({
    width: innerWidth,
    height: innerHeight,
  });
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
  useEffect(() => {
    const resize = () =>
      setViewport({ width: innerWidth, height: innerHeight });
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
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
      className={`sidebar${open ? " open" : ""}${layout.floating ? " floating" : ""}${adjusting ? " adjusting" : ""}`}
      id="sidebar"
      style={
        layout.floating
          ? { left: x, top: y, height: Math.max(100, viewport.height - y - 8) }
          : undefined
      }
    >
      <div className="sidebar-controls">
        <button
          type="button"
          id="sidebar-drag"
          aria-label="拖動導覽區塊，也可使用方向鍵"
          title="拖曳移動；方向鍵也可調整位置"
          {...pointerHandlers}
          onPointerDown={(e) => start(e, "move")}
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
        </button>
        <button
          type="button"
          id="sidebar-reset"
          title="恢復左側預設位置與寬度"
          onClick={() => {
            setLayout({ floating: false, width: defaultWidth, x: 8, y: 48 });
            setStatus("導覽區塊已恢復左側預設位置與寬度。");
          }}
        >
          恢復位置
        </button>
      </div>
      <div className="sidebar-body">
        <Link className="brand" to="/demo">
          庫存管理系統
        </Link>
        <p className="sidebar-caption">庫存管理工作區</p>
        <nav id="module-nav" aria-label="功能選單">
          {s.modules.map((module) => (
            <Fragment key={module.key}>
              {module.group && (
                <div className="nav-group">
                  <svg
                    className="navigation-icon"
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
              <button
                data-module={module.key}
                className={s.activeModule === module.key ? "active" : ""}
                aria-current={
                  s.activeModule === module.key ? "page" : undefined
                }
                onClick={() => onNavigate(module.key)}
              >
                <span>{module.label}</span>
              </button>
            </Fragment>
          ))}
        </nav>
        <Link className="planning-link" to="/board">
          畫面規劃與流程示範 ↗
        </Link>
        <Link className="planning-link" to="/">
          ← 返回系統規劃
        </Link>
        <p className="small muted">所有操作僅影響當次假資料</p>
      </div>
      <div className="account sidebar-account" aria-label="登入帳號">
        <span id="account-label">
          {s.currentAccount} ·{" "}
          {s.canEditExistingData ? "高權限（展示）" : "一般權限"}
        </span>
        <button id="logout" onClick={onLogout}>
          登出
        </button>
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
