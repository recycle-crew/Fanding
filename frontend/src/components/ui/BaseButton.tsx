import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";

const primaryButtonStyles =
  "bg-primary text-primary-foreground hover:bg-primary/90";
const outlineButtonStyles =
  "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50";
const ghostButtonStyles =
  "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        menu: "h-9 px-[10px] py-[6px]",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
      variant: {
        default: primaryButtonStyles,
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline: outlineButtonStyles,
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: ghostButtonStyles,
        link: "text-primary underline-offset-4 hover:underline",
        primary: [primaryButtonStyles, "primary"],
        text: [ghostButtonStyles, "text-button"],
        "status-active": [outlineButtonStyles, "activation-status enabled"],
        "status-inactive": [outlineButtonStyles, "activation-status inactive"],
        readonly: [outlineButtonStyles, "readonly-select-trigger"],
        sort: [ghostButtonStyles, "items-sort"],
        "record-link": [ghostButtonStyles, "purchase-order-link"],
        notification: [outlineButtonStyles, "low-stock-bell"],
        product: [ghostButtonStyles, "pos-product-main"],
        pagination: [
          outlineButtonStyles,
          "border border-[var(--line)] bg-white p-[6px_10px] text-[var(--ink)] disabled:cursor-default disabled:opacity-45",
        ],
        module: outlineButtonStyles,
        "module-active": [outlineButtonStyles, "bg-blue-50 text-blue-700"],
        navigation: [
          outlineButtonStyles,
          "flex h-auto w-full min-w-0 items-center justify-start gap-[10px] whitespace-normal rounded-[7px] border-transparent bg-transparent p-3 text-left font-semibold",
        ],
        "navigation-active": [
          outlineButtonStyles,
          "flex h-auto w-full min-w-0 items-center justify-start gap-[10px] whitespace-normal rounded-[7px] border-transparent bg-transparent p-3 text-left font-semibold active border-[#d3e0e9] bg-[#eaf1f6] text-[#245e7d] shadow-[inset_3px_0_var(--primary)]",
        ],
        page: ghostButtonStyles,
        "page-active":
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active",
        disclosure: [ghostButtonStyles, "text-[14px] font-semibold"],
        logout: [
          ghostButtonStyles,
          "h-11 min-w-11 shrink-0 border-0 bg-transparent px-2 py-0 text-[12px] font-medium text-[var(--muted)] shadow-none",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function BaseButton({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { BaseButton, buttonVariants };
