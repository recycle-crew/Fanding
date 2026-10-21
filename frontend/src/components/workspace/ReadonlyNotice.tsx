import { BaseButton } from "@/components/ui/BaseButton";

import { BaseModal } from "@/components/ui/BaseModal";

import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { executeWorkspaceCommand } from "@/store/workspace";

export function ReadonlyNotice() {
  const s = useAppSelector((root) => root.workspace);
  const dispatch = useAppDispatch();
  const preview = new URLSearchParams(location.search).get("preview") === "1";
  return (
    <>
      <BaseModal
        id="readonly-notice"
        title="目前不可編輯"
        open={Boolean(s.readonlyReason)}
        preview={preview}
        labelledBy="readonly-title"
        describedBy="readonly-reason readonly-policy"
        onClose={() =>
          dispatch(
            executeWorkspaceCommand({
              type: "update",
              update: (d) => {
                d.readonlyReason = "";
              },
            }),
          )
        }

        dialogContent={
          <>
            <form method="dialog">
              <h2 id="readonly-title">目前不可編輯</h2>
              <p id="readonly-reason">{s.readonlyReason}</p>
              <p id="readonly-policy">
                權限採 LDAP
                群組對應系統角色的方向。需與使用者確認各群組可修改的欄位、料號啟用／停用權限，以及對入庫、出庫與領用的限制；目前
                系統尚未串接 LDAP。
              </p>
              <div className="dialog-actions">
                <BaseButton variant="primary" value="close">
                  了解
                </BaseButton>
              </div>
            </form>
          </>
        }
      />
    </>
  );
}
