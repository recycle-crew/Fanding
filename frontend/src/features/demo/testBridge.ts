import { produce } from "immer";
import { flushSync } from "react-dom";
import type { Dispatch } from "react";
import type { DemoState } from "./types";
import type { Command } from "./store";
import * as domain from "./domain";
let currentState: DemoState;
let currentDispatch: Dispatch<Command>;
// This module is included only in Vite test mode, never in a production build.
export function installTestBridge(
  state: DemoState,
  dispatch: Dispatch<Command>,
) {
  if (import.meta.env.MODE !== "test") return;
  currentState = state;
  currentDispatch = dispatch;
  Object.assign(window, {
    __demoTest: {
      async run<T>(
        operation: (state: DemoState, domain: typeof import("./domain")) => T,
      ): Promise<T> {
        // Native dialog close events and React commits may finish after a click resolves.
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        const snapshot = currentState;
        let result: T;
        const next = produce(snapshot, (draft) => {
          result = operation(draft, domain);
        });
        if (next !== snapshot) {
          currentState = next;
          flushSync(() =>
            currentDispatch({
              type: "update",
              update: (draft) => {
                Object.assign(draft, next);
              },
            }),
          );
        }
        return result;
      },
    },
  });
}
