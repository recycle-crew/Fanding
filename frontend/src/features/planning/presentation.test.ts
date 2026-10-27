import { describe, expect, it } from "vitest";
import { sceneModule, presentScene } from "./presentation";
import { createWorkspaceState } from "@/store/workspaceSeed";
import { workspaceModulePaths } from "@/constants/workspaceRoutes";
import { planningPages } from "./scenes";

describe("規劃板場景路由", () => {
  it.each([
    ["items-list", "items"],
    ["base-data-list", "base-data"],
    ["purchases-list", "purchases"],
    ["consumptions-list", "consumptions"],
    ["pos-list", "pos"],
    ["sales-list", "sales"],
    ["stocktakes-review", "stocktakes"],
  ])("%s 使用 %s 的實際路由", (scene, module) => {
    expect(sceneModule(scene)).toBe(module);
  });

  it("每個已登錄場景都能取得網址，場景資料與路由模組一致", () => {
    for (const scene of planningPages.flatMap((page) =>
      page.frames.map((frame) => frame.scene),
    )) {
      expect(workspaceModulePaths[sceneModule(scene)]).toMatch(/^\//);
      const state = createWorkspaceState();
      presentScene(state, scene, true);
      if (state.loggedIn) expect(state.activeModule).toBe(sceneModule(scene));
    }
  });
});
