import { BaseButton } from "@/components/ui/BaseButton";
import { useEffect, useRef, useState } from "react";
import { planningPages } from "@/features/planning/scenes";
import { scenePath } from "@/features/planning/presentation";
import { workspaceHref } from "@/helpers/deployment";
import type { SceneRequest, SceneResponse } from "@/features/planning/scenes";
import { BaseModal } from "@/components/ui/BaseModal";
export function BoardPage() {
  const [pageId, setPageId] = useState(planningPages[0].id);
  const page = planningPages.find((page) => page.id === pageId);
  const [zoom, setZoom] = useState(0.7);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [guided, setGuided] = useState(true);
  const [status, setStatus] = useState("");
  const [boardStatus, setBoardStatus] = useState("");
  const frame = useRef<HTMLIFrameElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const ready = useRef(false);
  const sequence = useRef(0);
  const pending = useRef<{ index: number; requestId: number } | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const current = useRef({ page, open });
  current.current = { page, open };
  const drag = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  const width = page.frames.length * 820 + (page.frames.length - 1) * 76 + 96;
  const scene = page.frames[step] ?? page.frames[0];
  function request(index: number) {
    pending.current = { index, requestId: ++sequence.current };
    setStatus(ready.current ? "正在切換畫面…" : "正在準備互動示範…");
    if (!ready.current) return;
    const message: SceneRequest = {
      type: "fangding-request-scene",
      scene: current.current.page.frames[index].scene,
      requestId: pending.current.requestId,
    };
    frame.current?.contentWindow?.postMessage(message, "*");
    clearTimeout(timeout.current);
    timeout.current = setTimeout(
      () => setStatus("畫面尚未回應，請關閉後重試，或開啟庫存管理系統。"),
      8000,
    );
  }
  function close() {
    setOpen(false);
    pending.current = null;
    clearTimeout(timeout.current);
    if (ready.current)
      frame.current?.contentWindow?.postMessage(
        { type: "fangding-dismiss-form" } satisfies SceneRequest,
        "*",
      );
  }
  useEffect(() => {
    document.body.className = "board-page";
    const listener = (event: MessageEvent<SceneResponse>) => {
      if (
        event.source !== frame.current?.contentWindow ||
        !event.data ||
        typeof event.data !== "object"
      )
        return;
      const message = event.data;
      if (message.type === "fangding-workspace-ready") {
        ready.current = true;
        if (pending.current) request(pending.current.index);
      }
      if (
        message.type === "fangding-scene-result" &&
        pending.current?.requestId === message.requestId
      ) {
        clearTimeout(timeout.current);
        if (message.accepted) {
          setStep(pending.current.index);
          setStatus("");
        } else setStatus(message.reason ?? "無法切換畫面");
        pending.current = null;
      }
    };
    window.addEventListener("message", listener);
    return () => {
      window.removeEventListener("message", listener);
      clearTimeout(timeout.current);
    };
  }, []);
  const launch = (index: number, tour: boolean) => {
    setGuided(tour);
    setStep(index);
    setOpen(true);
    request(index);
  };
  return (
    <>
      <div className="board-layout grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] lg:grid-cols-[215px_minmax(0,1fr)]">
        <aside className="page-sidebar">
          <p className="eyebrow">PAGES / 分類</p>
          <nav id="page-nav" aria-label="畫面分類">
            {planningPages.map((p) => (
              <BaseButton
                variant={p.id === pageId ? "page-active" : "page"}
                key={p.id}
                data-page={p.id}
                className="h-auto justify-between whitespace-normal"
                aria-current={p.id === pageId ? "page" : undefined}
                onClick={() => {
                  setPageId(p.id);
                  setStep(0);
                  viewport.current?.scrollTo(0, 0);
                }}
              >
                {p.title}
                <small>{p.frames.length}</small>
              </BaseButton>
            ))}
          </nav>
          <div className="sidebar-note">
            <strong>先看規劃，再試操作</strong>
            <p>Frame 並排比較畫面；示範流程帶客戶逐步操作。</p>
            <p>縮圖為初始畫面參考。互動視窗共用當次假資料，重新整理即重置。</p>
          </div>
        </aside>
        <main className="board-main">
          <section className="board-intro">
            <div>
              <p className="eyebrow">SCREEN PLANNING / 展示假資料</p>
              <h1 id="page-title">{page.title}</h1>
              <p id="page-description">{page.description}</p>
            </div>
            <BaseButton
              variant="primary"
              id="start-tour"
              onClick={() => launch(0, true)}
            >
              ▶ 示範此流程
            </BaseButton>
          </section>
          <div className="canvas-toolbar">
            <span id="frame-count">
              {page.frames.length} 個 Frame · 縮圖為初始畫面參考
            </span>
            <div>
              <BaseButton
                variant="outline"
                id="zoom-out"
                aria-label="縮小畫布"
                disabled={zoom <= 0.1}
                onClick={() =>
                  setZoom((z) =>
                    Math.max(0.1, Math.round((z - 0.1) * 100) / 100),
                  )
                }
              >
                −
              </BaseButton>
              <output id="zoom-label">{Math.round(zoom * 100)}%</output>
              <BaseButton
                variant="outline"
                id="zoom-in"
                aria-label="放大畫布"
                disabled={zoom >= 1.2}
                onClick={() =>
                  setZoom((z) =>
                    Math.min(1.2, Math.round((z + 0.1) * 100) / 100),
                  )
                }
              >
                ＋
              </BaseButton>
              <BaseButton
                variant="outline"
                id="zoom-fit"
                onClick={() => {
                  setZoom(
                    Math.min(
                      1.2,
                      Math.max(
                        0.1,
                        Math.min(
                          (viewport.current.clientWidth - 24) / width,
                          (viewport.current.clientHeight - 24) / 930,
                        ),
                      ),
                    ),
                  );
                  viewport.current.scrollTo(0, 0);
                }}
              >
                適合畫面
              </BaseButton>
            </div>
          </div>
          <div
            ref={viewport}
            id="canvas-viewport"
            tabIndex={0}
            aria-label="畫面規劃畫布，可捲動；拖曳空白處移動畫布"
            onPointerDown={(event) => {
              if (
                event.button !== 0 ||
                (event.target as HTMLElement).closest(".screen-frame")
              )
                return;
              drag.current = {
                x: event.clientX,
                y: event.clientY,
                left: event.currentTarget.scrollLeft,
                top: event.currentTarget.scrollTop,
              };
              event.currentTarget.setPointerCapture(event.pointerId);
              event.currentTarget.classList.add("dragging");
            }}
            onPointerMove={(event) => {
              if (drag.current) {
                event.currentTarget.scrollLeft =
                  drag.current.left + drag.current.x - event.clientX;
                event.currentTarget.scrollTop =
                  drag.current.top + drag.current.y - event.clientY;
              }
            }}
            onPointerUp={(event) => {
              drag.current = null;
              event.currentTarget.classList.remove("dragging");
            }}
            onPointerCancel={(event) => {
              drag.current = null;
              event.currentTarget.classList.remove("dragging");
            }}
          >
            <div
              id="canvas-size"
              style={{ width: width * zoom, height: 930 * zoom }}
            >
              <div id="frame-canvas" style={{ transform: `scale(${zoom})` }}>
                {page.frames.map((f, index) => (
                  <article className="screen-frame" key={f.scene}>
                    <div className="frame-heading">
                      <div>
                        <span>FRAME {String(index + 1).padStart(2, "0")}</span>
                        <h2>{f.title}</h2>
                      </div>
                      <BaseButton
                        variant="outline"
                        data-open={index}
                        onClick={() => launch(index, false)}
                      >
                        操作此畫面 ↗
                      </BaseButton>
                    </div>
                    <div className="frame-preview" inert>
                      <iframe
                        src={workspaceHref(
                          `${scenePath(f.scene)}?embed=1&preview=1&scene=${f.scene}`,
                        )}
                        title={`${f.title}初始畫面`}
                        tabIndex={-1}
                        loading="lazy"
                      />
                    </div>
                    <div className="frame-notes">
                      <p>
                        <strong>用途：</strong>
                        {f.instruction}
                      </p>
                      <p>
                        <strong>待確認：</strong>
                        {f.question}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
          <p className="canvas-help">
            拖曳空白處或使用捲軸移動畫布 · 點「操作此畫面」進入互動 ·
            流程箭頭表示操作順序
          </p>
          <p id="board-status" role="status" aria-live="polite">
            {boardStatus}
          </p>
        </main>
      </div>
      <BaseModal
        id="player"
        title={scene.title}
        variant="player"
        open={open}
        onClose={close}
        dialogContent={
          <>
            <header className="player-header shrink-0">
              <div>
                <p className="eyebrow" id="player-mode">
                  {guided ? `${page.title} / 流程示範` : "Frame / 互動操作"}
                </p>
                <h2 id="step-title">{scene.title}</h2>
              </div>
              <BaseButton
                variant="outline"
                id="close-player"
                aria-label="關閉示範"
                onClick={close}
              >
                ✕ 關閉
              </BaseButton>
            </header>
            <div className="player-body h-auto min-h-0 flex-1">
              <section className="workspace-stage">
                <iframe
                  ref={frame}
                  id="interactive-workspace"
                  src={workspaceHref("/items?embed=1")}
                  title="可操作的庫存管理系統"
                />
              </section>
              <aside className="step-notes">
                <span id="step-counter" className="step-counter">
                  {step + 1} / {page.frames.length}
                </span>
                <h3>這一步怎麼操作</h3>
                <p id="step-instruction">{scene.instruction}</p>
                <h3>預期結果</h3>
                <p id="step-outcome">{scene.outcome}</p>
                <div className="question">
                  <h3>與客戶確認</h3>
                  <p id="step-question">{scene.question}</p>
                </div>
                <p className="player-hint">
                  可直接填資料、按按鈕。上／下一步只切換畫面，不自動送出操作。關閉示範會取消未儲存表單，已完成操作會保留。
                </p>
                <p id="player-status" role="status" aria-live="polite">
                  {status}
                </p>
              </aside>
            </div>
            <footer className="player-footer h-auto min-h-[70px] shrink-0 max-sm:grid max-sm:grid-cols-3 max-sm:gap-2 max-sm:px-2">
              <BaseButton
                variant="outline"
                id="previous-step"
                className="max-sm:h-auto max-sm:min-w-0 max-sm:whitespace-normal max-sm:px-2"
                disabled={step === 0}
                onClick={() => {
                  if (!pending.current) request(step - 1);
                }}
              >
                ← 上一步
              </BaseButton>
              <BaseButton
                variant="outline"
                id="return-board"
                onClick={close}
                className="max-sm:h-auto max-sm:min-w-0 max-sm:whitespace-normal max-sm:px-2"
              >
                返回全部 Frame
              </BaseButton>
              <BaseButton
                variant="primary"
                id="next-step"
                className="max-sm:h-auto max-sm:min-w-0 max-sm:whitespace-normal max-sm:px-2"
                onClick={() => {
                  if (pending.current) return;
                  if (step < page.frames.length - 1) request(step + 1);
                  else {
                    close();
                    setBoardStatus(
                      "流程展示完成。可選擇其他分類，互動假資料會在當次規劃板繼續保留。",
                    );
                  }
                }}
              >
                {step === page.frames.length - 1 ? "完成流程 ✓" : "下一步 →"}
              </BaseButton>
            </footer>
          </>
        }
      />
    </>
  );
}
