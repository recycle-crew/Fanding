import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "cn";
import { Label as LabelPrimitive } from "radix-ui";

const labelVariants = cva(
  "grid gap-1.5 text-sm leading-normal font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "",
        field: "items-field",
        check: "items-check",
        "check-inline": "purchase-check",
        "page-size": "items-page-size",
        confirmation: "count-confirmation",
        inline: "flex items-center gap-3 leading-6",
        pagination:
          "flex items-center gap-2 whitespace-nowrap text-[12px] font-medium",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function BaseLabel({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> &
  VariantProps<typeof labelVariants>) {
  return (
    <LabelPrimitive.Root
      data-variant={variant}
      data-slot="label"
      className={cn(labelVariants({ variant }), className)}
      {...props}
    />
  );
}

export { BaseLabel };
