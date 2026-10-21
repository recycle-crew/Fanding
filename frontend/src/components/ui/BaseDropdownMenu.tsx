import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { DropdownMenu } from "radix-ui";

export const BaseDropdownMenu = DropdownMenu.Root;
export const BaseDropdownMenuTrigger = DropdownMenu.Trigger;
export const BaseDropdownMenuPortal = DropdownMenu.Portal;
const menuVariants = cva("", {
  variants: {
    variant: {
      default: "",
      menu: "purchase-operation-menu",
    },
  },
  defaultVariants: { variant: "default" },
});

export function BaseDropdownMenuContent({
  className,
  variant = "default",
  ...props
}: ComponentProps<typeof DropdownMenu.Content> &
  VariantProps<typeof menuVariants>) {
  return (
    <DropdownMenu.Content
      data-variant={variant}
      className={cn(menuVariants({ variant }), className)}
      {...props}
    />
  );
}
export const BaseDropdownMenuLabel = DropdownMenu.Label;
export const BaseDropdownMenuItem = DropdownMenu.Item;
export const BaseDropdownMenuSeparator = DropdownMenu.Separator;
