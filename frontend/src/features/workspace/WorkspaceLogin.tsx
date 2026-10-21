import { BaseCard } from "@/components/ui/BaseCard";
import { BaseLabel } from "@/components/ui/BaseLabel";
import { BaseInput } from "@/components/ui/BaseInput";
import {
  BaseNativeSelect,
  BaseNativeSelectOption,
} from "@/components/ui/BaseNativeSelect";
import { BaseButton } from "@/components/ui/BaseButton";

import { BaseAlert } from "@/components/ui/BaseAlert";
import { Link, useLocation } from "react-router";

import { WORKSPACE_LOGIN_ENABLED } from "@/constants/workspaceAccess";

import { useEffect, useRef, useState } from "react";

import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { executeWorkspaceCommand } from "@/store/workspace";

export function WorkspaceLogin() {
  const s = useAppSelector((root) => root.workspace);
  const dispatch = useAppDispatch();
  const routeLocation = useLocation();
  const [account, setAccount] = useState("demo.pharmacy");
  const [password, setPassword] = useState("demo-only");
  const [permission, setPermission] = useState("standard");
  const [email, setEmail] = useState("");
  const previousRecovery = useRef(false);
  const embedded = new URLSearchParams(location.search).get("embed") === "1";
  const preview = new URLSearchParams(location.search).get("preview") === "1";
  // 密碼由院內身分服務管理；展示申請不寄信、不查帳號、不修改密碼。
  useEffect(() => {
    if (!preview) {
      if (s.recovery)
        document
          .querySelector<HTMLElement>(
            s.recoverySent
              ? "#recovery-result"
              : "#recovery-form [name=account]",
          )
          ?.focus();
      else if (previousRecovery.current)
        document
          .querySelector<HTMLInputElement>("#login-form [name=account]")
          ?.focus();
    }
    previousRecovery.current = s.recovery;
  }, [s.recovery, s.recoverySent, preview]);
  return (
    <>
      {/* 系統首頁略過登入；規劃板嵌入畫面仍展示登入及密碼重設流程。 */}
      {(WORKSPACE_LOGIN_ENABLED || embedded) && (
        <section id="login" className="login-layout" hidden={s.loggedIn}>
          <div className="login-story">
            <div className="brand">庫存管理系統</div>
            <p className="eyebrow">INVENTORY WORKSPACE</p>
            <h1>
              讓庫存作業
              <br />
              清楚、有序。
            </h1>
            <p>
              HIS 藥品查詢與維護、OTC 入出庫與領用，
              <br />
              在同一個工作平台掌握。
            </p>
            <div className="login-tags">
              <span>HIS 藥品</span>
              <span>OTC 庫存</span>
              <span>掃碼盤點</span>
            </div>
          </div>
          <BaseCard variant="login" asChild>
            <form
              id="login-form"
              hidden={s.recovery}
              onSubmit={(event) => {
                event.preventDefault();
                if (!account.trim() || !password.trim()) return;
                dispatch(
                  executeWorkspaceCommand({
                    type: "update",
                    update: (d) => {
                      d.currentAccount = account.trim();
                      d.canEditExistingData = permission === "privileged";
                      d.loggedIn = true;
                      d.activeModule =
                        d.stocktakeRoutes[routeLocation.pathname] ??
                        d.activeModule;
                      d.notice = "已登入展示工作區（未連線 NAS LDAP）";
                    },
                  }),
                );
              }}
            >
              <p className="eyebrow">歡迎使用庫存管理系統</p>
              <h2>登入工作區</h2>
              <p className="muted">LDAP 帳號登入 · 群組權限管理（展示）</p>
              <BaseLabel>
                帳號
                <BaseInput
                  name="account"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  autoComplete="off"
                  required
                />
              </BaseLabel>
              <BaseLabel>
                密碼
                <BaseInput
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                  required
                />
              </BaseLabel>
              <BaseLabel>
                展示權限
                <BaseNativeSelect
                  id="workspace-permission"
                  value={permission}
                  onChange={(e) => setPermission(e.target.value)}
                >
                  <BaseNativeSelectOption value="standard">
                    一般人員
                  </BaseNativeSelectOption>
                  <BaseNativeSelectOption value="privileged">
                    高權限人員
                  </BaseNativeSelectOption>
                </BaseNativeSelect>
              </BaseLabel>
              <p className="muted small">
                此選單僅模擬權限；正式權限由 NAS LDAP 群組提供。
              </p>
              <BaseButton variant="primary" type="submit">
                使用展示帳號登入 →
              </BaseButton>
              <p className="muted small">
                此處僅驗證必填，不驗證真實帳密。請使用展示帳號。
              </p>
              <div className="login-links">
                <BaseButton
                  variant="text"
                  id="forgot-password"
                  type="button"
                  onClick={() =>
                    dispatch(
                      executeWorkspaceCommand({
                        type: "update",
                        update: (d) => {
                          d.recovery = true;
                          d.recoverySent = false;
                        },
                      }),
                    )
                  }
                >
                  忘記密碼？
                </BaseButton>
                <Link to="/">← 返回庫存管理系統</Link>
              </div>
            </form>
          </BaseCard>
          <BaseCard variant="login" id="password-recovery" hidden={!s.recovery}>
            <p className="eyebrow">LDAP 帳號服務</p>
            <h2>忘記密碼</h2>
            <p className="muted">填寫 LDAP 帳號與登記信箱，申請密碼重設。</p>
            <form
              id="recovery-form"
              hidden={s.recoverySent}
              onSubmit={(event) => {
                event.preventDefault();
                if (account.trim())
                  dispatch(
                    executeWorkspaceCommand({
                      type: "update",
                      update: (d) => {
                        d.recoverySent = true;
                      },
                    }),
                  );
              }}
            >
              <BaseLabel>
                LDAP 帳號
                <BaseInput
                  name="account"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  autoComplete="username"
                  required
                />
              </BaseLabel>
              <BaseLabel>
                登記信箱
                <BaseInput
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@hospital.example"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </BaseLabel>
              <p className="muted small">
                此為介面展示，請使用假資料；尚未串接院內 LDAP 或寄信服務。
              </p>
              <BaseButton variant="primary" type="submit">
                模擬申請重設
              </BaseButton>
            </form>
            <BaseAlert
              variant="result"
              id="recovery-result"
              className="mb-4"
              role="status"
              tabIndex={-1}
              hidden={!s.recoverySent}
            >
              展示申請流程已完成。正式服務會在資料符合院內規則時提供重設指引；本次未查詢帳號、寄送郵件或變更密碼。
            </BaseAlert>
            <BaseButton
              variant="text"
              id="back-to-login"
              type="button"
              onClick={() => {
                setEmail("");
                dispatch(
                  executeWorkspaceCommand({
                    type: "update",
                    update: (d) => {
                      d.recovery = false;
                      d.recoverySent = false;
                    },
                  }),
                );
              }}
            >
              ← 返回登入
            </BaseButton>
          </BaseCard>
        </section>
      )}
    </>
  );
}
