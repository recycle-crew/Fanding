import { BaseButton } from "@/components/ui/BaseButton";

import { BaseModal } from "@/components/ui/BaseModal";

import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { executeWorkspaceCommand } from "@/store/workspace";

export function WorkspaceConfirmation() {
  const s = useAppSelector((root) => root.workspace);
  const dispatch = useAppDispatch();
  const preview = new URLSearchParams(location.search).get("preview") === "1";
  return (
    <>
      <BaseModal
        id="confirmation"
        title="確認操作"
        open={Boolean(s.confirmation)}
        preview={preview}
        onClose={(value) => {
          if (value === "confirm")
            dispatch(executeWorkspaceCommand({ type: "confirm" }));
          else
            dispatch(
              executeWorkspaceCommand({
                type: "update",
                update: (d) => {
                  d.confirmation = null;
                },
              }),
            );
        }}

        dialogContent={
          <>
            <form method="dialog">
              <h2>確認操作</h2>
              <p id="confirmation-text">{s.confirmation?.message}</p>
              <div className="dialog-actions">
                <BaseButton variant="outline" value="cancel">
                  取消
                </BaseButton>
                <BaseButton variant="primary" value="confirm">
                  確認
                </BaseButton>
              </div>
            </form>
          </>
        }
      />
    </>
  );
}
