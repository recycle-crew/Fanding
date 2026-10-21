import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const alertVariants = cva(
  "relative block w-full rounded-lg border px-4 py-3 text-sm [&>svg]:size-4 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        info: "bg-card text-card-foreground callout",
        warning: "bg-card text-card-foreground callout assumption",
        result:
          "bg-card text-card-foreground bg-secondary p-4 text-sm leading-[1.8]",
        notification:
          "rounded-[10px] border-0 bg-[#17364a] px-[22px] py-[14px] text-base leading-[1.6] text-white shadow-[0_8px_30px_#17364a33]",
        destructive:
          "bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 [&>svg]:text-current",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function BaseAlert({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      data-variant={variant}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

const alertTitleVariants = cva(
  "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
);

function BaseAlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(alertTitleVariants(), className)}
      {...props}
    />
  );
}

const alertDescriptionVariants = cva(
  "col-start-2 grid justify-items-start gap-1 text-sm text-muted-foreground [&_p]:leading-relaxed",
);

function BaseAlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(alertDescriptionVariants(), className)}
      {...props}
    />
  );
}

export { BaseAlert, BaseAlertTitle, BaseAlertDescription };
