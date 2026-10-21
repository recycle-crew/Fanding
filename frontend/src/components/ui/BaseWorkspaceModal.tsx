import { cn } from "cn";
import { cva } from "class-variance-authority";
import { useEffect, useRef, type ReactNode } from "react";
import {
  BaseDialog,
  BaseDialogContent,
  BaseDialogTitle,
  BaseDialogDescription,
} from "./BaseDialog";
import { BaseButton } from "./BaseButton";

const workspaceModalHeadingVariants = cva("items-modal-heading");

const workspaceModalDescriptionVariants = cva("px-5 pb-3");

/** Scrollable workspace dialog. Business state and save decisions stay with callers. */
export function BaseWorkspaceModal({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open) heading.current?.focus();
  }, [open, title]);
  return (
    <BaseDialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <BaseDialogContent
        variant="workspace"
        showCloseButton={false}
        aria-modal="true"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          trigger.current = document.activeElement as HTMLElement;
          heading.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (trigger.current?.isConnected) trigger.current.focus();
          else document.querySelector<HTMLElement>("#content")?.focus();
        }}
      >
        <header className={cn(workspaceModalHeadingVariants())}>
          <BaseDialogTitle ref={heading} tabIndex={-1}>
            {title}
          </BaseDialogTitle>
          <BaseButton
            type="button"
            variant="ghost"
            aria-label="關閉視窗"
            onClick={onClose}
          >
            ×
          </BaseButton>
        </header>
        <BaseDialogDescription
          className={cn(workspaceModalDescriptionVariants())}
        >
          {description}
        </BaseDialogDescription>
        {children}
      </BaseDialogContent>
    </BaseDialog>
  );
}
