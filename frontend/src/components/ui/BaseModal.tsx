import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  const dialogClassName =
    variant === "player"
      ? "[&[open]]:flex flex-col w-[calc(100%_-_16px)] max-w-[1540px] sm:max-w-[1540px] h-[calc(100%_-_16px)] max-h-full overflow-hidden border border-[var(--line)] rounded-[8px] p-0 text-[var(--ink)] shadow-[0_16px_48px_#24384722] backdrop:bg-[#102b4180] md:w-[calc(100%_-_48px)] md:h-[calc(100%_-_48px)] md:rounded-[14px]"
      : "w-[min(620px,_calc(100%_-_32px))] sm:max-w-[620px] max-h-[90vh] overflow-auto border border-[var(--line)] rounded-[12px] p-7 text-[var(--ink)] shadow-[0_16px_48px_#24384722] backdrop:bg-[#14374b70]";
  useEffect(() => {
    const element = dialog;
    if (!element) return;
    if (open && !element.open) {
      if (preview) element.setAttribute("open", "");
      else element.showModal();
    } else if (!open && element.open) element.close("cancel");
  }, [dialog, open, preview]);
  return (
    <Dialog open={open} modal={false}>
      {/* 原生 top layer 保留規劃板 iframe 的生命週期，焦點與表單關閉仍由瀏覽器處理。 */}
      <DialogContent
        asChild
        forceMount={variant === "player" ? true : undefined}
        showCloseButton={false}
        className={`inset-0 m-auto block translate-x-0 translate-y-0 gap-0 bg-background duration-0 data-[state=open]:animate-none data-[state=closed]:animate-none [&:not([open])]:hidden ${dialogClassName}`}
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
          <DialogTitle className="sr-only">{props.title}</DialogTitle>
          <DialogDescription className="sr-only">
            {variant === "player"
              ? "可操作展示畫面並切換流程步驟。"
              : "請閱讀內容後選擇操作。"}
          </DialogDescription>
          {props.dialogContent}
        </dialog>
      </DialogContent>
    </Dialog>
  );
}
