import type { ComponentProps } from "react";
import { cn } from "cn";

export function BaseSwitch({
  checked,
  className,
  ...props
}: Omit<ComponentProps<"button">, "children" | "role" | "aria-checked"> & {
  checked: boolean;
}) {
  return (
    <button
      type="button"
      {...props}
      role="switch"
      aria-checked={checked}
      data-slot="switch"
      data-state={checked ? "checked" : "unchecked"}
      className={cn(
        "inline-flex h-6 w-10 shrink-0 items-center rounded-full border-0 bg-muted p-[3px] transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=checked]:justify-end data-[state=checked]:bg-primary",
        className,
      )}
    >
      <span className="size-[18px] rounded-full bg-white" />
    </button>
  );
}
