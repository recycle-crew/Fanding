import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "cn";
import { XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { BaseButton } from "@/components/ui/BaseButton";

function BaseDialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function BaseDialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function BaseDialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function BaseDialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

const dialogOverlayVariants = cva(
  "fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
);

function BaseDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(dialogOverlayVariants(), className)}
      {...props}
    />
  );
}

const dialogVariants = cva(
  "fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-lg",
  {
    variants: {
      variant: {
        default: "",
        workspace: "items-modal",
        "workspace-wide": "items-modal items-modal-wide",
        native:
          "inset-0 m-auto block translate-x-0 translate-y-0 gap-0 bg-background duration-0 data-[state=open]:animate-none data-[state=closed]:animate-none [&:not([open])]:hidden w-[min(620px,_calc(100%_-_32px))] sm:max-w-[620px] max-h-[90vh] overflow-auto border border-[var(--line)] rounded-[12px] p-7 text-[var(--ink)] shadow-[0_16px_48px_#24384722] backdrop:bg-[#14374b70]",
        player:
          "inset-0 m-auto block translate-x-0 translate-y-0 gap-0 bg-background duration-0 data-[state=open]:animate-none data-[state=closed]:animate-none [&:not([open])]:hidden [&[open]]:flex flex-col w-[calc(100%_-_16px)] max-w-[1540px] sm:max-w-[1540px] h-[calc(100%_-_16px)] max-h-full overflow-hidden border border-[var(--line)] rounded-[8px] p-0 text-[var(--ink)] shadow-[0_16px_48px_#24384722] backdrop:bg-[#102b4180] md:w-[calc(100%_-_48px)] md:h-[calc(100%_-_48px)] md:rounded-[14px]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

const dialogCloseButtonVariants = cva(
  "absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
);

const dialogCloseLabelVariants = cva("sr-only");

function BaseDialogContent({
  className,
  variant = "default",
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> &
  VariantProps<typeof dialogVariants> & {
    showCloseButton?: boolean;
  }) {
  return (
    <BaseDialogPortal data-slot="dialog-portal" forceMount={props.forceMount}>
      <BaseDialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        data-variant={variant}
        className={cn(dialogVariants({ variant }), className)}
        {...props}
      >
        {props.asChild ? (
          children
        ) : (
          <>
            {children}
            {showCloseButton && (
              <DialogPrimitive.Close
                data-slot="dialog-close"
                className={cn(dialogCloseButtonVariants())}
              >
                <XIcon />
                <span className={cn(dialogCloseLabelVariants())}>Close</span>
              </DialogPrimitive.Close>
            )}
          </>
        )}
      </DialogPrimitive.Content>
    </BaseDialogPortal>
  );
}

const dialogHeaderVariants = cva(
  "flex flex-col gap-2 text-center sm:text-left",
);

function BaseDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(dialogHeaderVariants(), className)}
      {...props}
    />
  );
}

const dialogFooterVariants = cva(
  "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
);

function BaseDialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(dialogFooterVariants(), className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <BaseButton variant="outline">Close</BaseButton>
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

const dialogTitleVariants = cva("text-lg leading-none font-semibold");

function BaseDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(dialogTitleVariants(), className)}
      {...props}
    />
  );
}

const descriptionVariants = cva("text-sm text-muted-foreground", {
  variants: { variant: { default: "", workspace: "items-modal-description" } },
  defaultVariants: { variant: "default" },
});

function BaseDialogDescription({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description> &
  VariantProps<typeof descriptionVariants>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      data-variant={variant}
      className={cn(descriptionVariants({ variant }), className)}
      {...props}
    />
  );
}

export {
  BaseDialog,
  BaseDialogClose,
  BaseDialogContent,
  BaseDialogDescription,
  BaseDialogFooter,
  BaseDialogHeader,
  BaseDialogOverlay,
  BaseDialogPortal,
  BaseDialogTitle,
  BaseDialogTrigger,
};
