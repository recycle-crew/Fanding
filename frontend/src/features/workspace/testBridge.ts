import { produceWithPatches } from "immer";
import { flushSync } from "react-dom";
import type { WorkspaceState } from "@/types/workspace";
import type { AppStore } from "@/store";
import { statePatched } from "@/store/workspace";
import * as domain from "@/features/inventory/domain";
// This module is included only in Vite test mode, never in a production build.
export function installTestBridge(store: AppStore) {
  if (import.meta.env.MODE !== "test") return;
  Object.assign(window, {
    __workspaceTest: {
      async run<T>(
        operation: (
          state: WorkspaceState,
          domain: typeof import("@/features/inventory/domain"),
        ) => T,
      ): Promise<T> {
        // Native dialog close events and React commits may finish after a click resolves.
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        const snapshot = store.getState().workspace;
        let result: T;
        const [, patches] = produceWithPatches(snapshot, (draft) => {
          result = operation(draft, domain);
        });
        if (patches.length)
          flushSync(() => store.dispatch(statePatched(patches)));
        return result;
      },
    },
  });
}
