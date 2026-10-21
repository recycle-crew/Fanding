import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "cn";
import { ChevronDownIcon } from "lucide-react";

const selectVariants = cva(
  [
    "h-9 w-full min-w-0 appearance-none rounded-md border border-input bg-transparent px-3 py-2 pr-9 text-sm shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed data-[size=sm]:h-8 data-[size=sm]:py-1 dark:bg-input/30 dark:hover:bg-input/50",
    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
    "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
  ],
  {
    variants: {
      variant: {
        default: "",
        pagination:
          "w-auto min-w-[60px] border border-[#bac9d4] bg-white p-[6px_9px] text-[var(--ink)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

const selectWrapperVariants = cva(
  "group/native-select relative min-w-0 w-full has-[select:disabled]:opacity-50",
);

const selectIconVariants = cva(
  "pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground opacity-50 select-none",
);

function BaseNativeSelect({
  className,
  variant = "default",
  size = "default",
  ...props
}: Omit<React.ComponentProps<"select">, "size"> &
  VariantProps<typeof selectVariants> & { size?: "sm" | "default" }) {
  return (
    <div
      className={cn(selectWrapperVariants())}
      data-variant={variant}
      data-slot="native-select-wrapper"
    >
      <select
        data-slot="native-select"
        data-variant={variant}
        data-size={size}
        className={cn(selectVariants({ variant }), className)}
        {...props}
      />
      <ChevronDownIcon
        className={cn(selectIconVariants())}
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  );
}

const selectOptionVariants = cva("bg-[Canvas] text-[CanvasText]");

function BaseNativeSelectOption({
  className,
  ...props
}: React.ComponentProps<"option">) {
  return (
    <option
      data-slot="native-select-option"
      className={cn(selectOptionVariants(), className)}
      {...props}
    />
  );
}

const selectOptGroupVariants = cva("bg-[Canvas] text-[CanvasText]");

function BaseNativeSelectOptGroup({
  className,
  ...props
}: React.ComponentProps<"optgroup">) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn(selectOptGroupVariants(), className)}
      {...props}
    />
  );
}

export { BaseNativeSelect, BaseNativeSelectOptGroup, BaseNativeSelectOption };
