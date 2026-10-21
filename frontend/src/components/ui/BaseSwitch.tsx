import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "cn";

const switchVariants = cva(
  "inline-flex h-6 w-10 shrink-0 items-center rounded-full border-0 bg-muted p-[3px] transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=checked]:justify-end data-[state=checked]:bg-primary",
  {
    variants: {
      variant: {
        default: "",
        compact: "items-toggle",
      },
      checked: {
        false: null,
        true: null,
      },
    },
    compoundVariants: [{ variant: "compact", checked: true, class: "on" }],
    defaultVariants: { variant: "default" },
  },
);

const switchThumbVariants = cva("size-[18px] rounded-full bg-white");

export function BaseSwitch({
  checked,
  className,
  variant = "default",
  ...props
}: Omit<ComponentProps<"button">, "children" | "role" | "aria-checked"> &
  VariantProps<typeof switchVariants> & {
    checked: boolean;
  }) {
  return (
    <button
      type="button"
      {...props}
      role="switch"
      aria-checked={checked}
      data-variant={variant}
      data-slot="switch"
      data-state={checked ? "checked" : "unchecked"}
      className={cn(switchVariants({ variant, checked }), className)}
    >
      <span className={cn(switchThumbVariants())} />
    </button>
  );
}
