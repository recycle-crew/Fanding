import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { workspaceModulePaths } from "@/constants/workspaceRoutes";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { executeWorkspaceCommand } from "@/store/workspace";
import { planningPages } from "./scenes";
import type { WorkspaceState, ModuleKey } from "@/types/workspace";
import type { SceneRequest, SceneResponse } from "./scenes";

const scenes = new Set(
  planningPages.flatMap((page) => page.frames.map((frame) => frame.scene)),
);
export function sceneModule(scene: string): ModuleKey {
  if (scene.startsWith("base-data")) return "base-data";
  if (scene.startsWith("purchases")) return "purchases";
  if (scene.startsWith("consumptions")) return "consumptions";
  if (scene.startsWith("stocktakes")) return "stocktakes";
  if (scene.startsWith("sales")) return "sales";
  if (scene.startsWith("pos")) return "pos";
  return "items";
}
export function scenePath(scene: string) {
  return scene === "stocktakes-review"
    ? "/stocktakes/ST5/review"
    : workspaceModulePaths[sceneModule(scene)];
}
export function presentScene(
  s: WorkspaceState,
  scene: string,
  _preview: boolean,
) {
  if (!scenes.has(scene)) return;
  s.editor = null;
  s.confirmation = null;
  s.readonlyReason = "";
  s.notice = "";
  s.activeModule = sceneModule(scene);
}
export function usePresentation() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const dirty = useAppSelector((root) => root.moduleUi.dirty);
  const currentDirty = useRef(dirty);
  currentDirty.current = dirty;
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("embed") !== "1") return;
    const initial = params.get("scene");
    function show(scene: string) {
      navigate(scenePath(scene) + location.search, { replace: true });
      dispatch(
        executeWorkspaceCommand({
          type: "update",
          update: (s) => presentScene(s, scene, params.get("preview") === "1"),
        }),
      );
    }
    if (initial && scenes.has(initial)) show(initial);
    if (params.get("preview") === "1") return;
    const respond = (message: SceneResponse) =>
      window.parent.postMessage(message, window.location.origin);
    const listener = (event: MessageEvent<SceneRequest>) => {
      if (
        event.source !== window.parent ||
        event.origin !== window.location.origin ||
        window.parent === window
      )
        return;
      const request = event.data;
      if (
        !request ||
        request.type !== "fangding-request-scene" ||
        !scenes.has(request.scene) ||
        typeof request.requestId !== "number"
      )
        return;
      if (currentDirty.current) {
        respond({
          type: "fangding-scene-result",
          requestId: request.requestId,
          accepted: false,
          reason: "請先儲存或取消目前表單，再切換畫面。",
        });
        return;
      }
      show(request.scene);
      respond({
        type: "fangding-scene-result",
        requestId: request.requestId,
        accepted: true,
      });
    };
    window.addEventListener("message", listener);
    respond({ type: "fangding-workspace-ready" });
    return () => window.removeEventListener("message", listener);
  }, []);
}
