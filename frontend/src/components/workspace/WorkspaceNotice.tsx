import { BaseAlert } from "@/components/ui/BaseAlert";

import { useEffect } from "react";

import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { executeWorkspaceCommand } from "@/store/workspace";

export function WorkspaceNotice() {
  const s = useAppSelector((root) => root.workspace);
  const dispatch = useAppDispatch();
  const preview = new URLSearchParams(location.search).get("preview") === "1";
  useEffect(() => {
    if (!s.notice) return;
    const timer = setTimeout(
      () =>
        dispatch(
          executeWorkspaceCommand({
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
  return (
    <>
      <BaseAlert
        variant="notification"
        id="notice"
        role="status"
        aria-live="polite"
        hidden={!s.notice}
        className="pointer-events-none fixed right-6 bottom-6 z-[5] w-auto max-w-[calc(100%_-_48px)]"
      >
        {s.notice}
      </BaseAlert>
    </>
  );
}
