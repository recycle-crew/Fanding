import { produceWithPatches } from "immer";
import { flushSync } from "react-dom";
import type { DemoState } from "@/types/demo";
import type { AppStore } from "@/store";
import { statePatched } from "@/store/demo";
import * as domain from "@/features/demo/domain";
// This module is included only in Vite test mode, never in a production build.
export function installTestBridge(store: AppStore) {
  if (import.meta.env.MODE !== "test") return;
  Object.assign(window, {
    __demoTest: {
      async run<T>(
        operation: (
          state: DemoState,
          domain: typeof import("@/features/demo/domain"),
        ) => T,
      ): Promise<T> {
        // Native dialog close events and React commits may finish after a click resolves.
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        const snapshot = store.getState().demo;
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
