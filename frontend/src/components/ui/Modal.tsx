import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
export function Modal({
  id,
  open,
  onClose,
  children,
  preview = false,
  labelledBy,
  describedBy,
}: {
  id: string;
  open: boolean;
  onClose: (value: string) => void;
  children: ReactNode;
  preview?: boolean;
  labelledBy?: string;
  describedBy?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (open && !element.open) {
      if (preview) element.setAttribute("open", "");
      else element.showModal();
    } else if (!open && element.open) element.close("cancel");
  }, [open, preview]);
  return (
    <dialog
      ref={dialog}
      id={id}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onClose={(event) => {
        if (open) onClose(event.currentTarget.returnValue);
      }}
    >
      {children}
    </dialog>
  );
}
