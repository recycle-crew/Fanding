import { cn } from "cn";
import { cva } from "class-variance-authority";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  BaseDialog,
  BaseDialogContent,
  BaseDialogTitle,
  BaseDialogDescription,
} from "@/components/ui/BaseDialog";
const modalAccessibilityTextVariants = cva("sr-only");

export function BaseModal(props: {
  id: string;
  open: boolean;
  onClose: (value: string) => void;
  dialogContent: ReactNode;
  variant?: "standard" | "player";
  preview?: boolean;
  labelledBy?: string;
  describedBy?: string;
  title: string;
}) {
  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null);
  const {
    id,
    open,
    onClose,
    variant = "standard",
    preview = false,
    labelledBy,
    describedBy,
  } = props;
  useEffect(() => {
    const element = dialog;
    if (!element) return;
    if (open && !element.open) {
      if (preview) element.setAttribute("open", "");
      else element.showModal();
    } else if (!open && element.open) element.close("cancel");
  }, [dialog, open, preview]);
  return (
    <BaseDialog open={open} modal={false}>
      {/* 原生 top layer 保留規劃板 iframe 的生命週期，焦點與表單關閉仍由瀏覽器處理。 */}
      <BaseDialogContent
        asChild
        forceMount={variant === "player" ? true : undefined}
        showCloseButton={false}
        variant={variant === "player" ? "player" : "native"}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => {
          event.preventDefault();
          dialog?.close("cancel");
        }}
      >
        <dialog
          ref={setDialog}
          id={id}
          {...(labelledBy ? { "aria-labelledby": labelledBy } : {})}
          {...(describedBy ? { "aria-describedby": describedBy } : {})}
          onClose={(event) => {
            if (open) onClose(event.currentTarget.returnValue);
          }}
        >
          <BaseDialogTitle className={cn(modalAccessibilityTextVariants())}>
            {props.title}
          </BaseDialogTitle>
          <BaseDialogDescription
            className={cn(modalAccessibilityTextVariants())}
          >
            {variant === "player"
              ? "可操作展示畫面並切換流程步驟。"
              : "請閱讀內容後選擇操作。"}
          </BaseDialogDescription>
          {props.dialogContent}
        </dialog>
      </BaseDialogContent>
    </BaseDialog>
  );
}
