import { cn } from "cn";
import { cva } from "class-variance-authority";
import { useId } from "react";
import { BaseCheckbox } from "./BaseCheckbox";
import { BaseLabel } from "./BaseLabel";
const checkFieldVariants = cva("flex items-center gap-3 leading-6");

export function BaseCheckField({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <BaseLabel htmlFor={id} className={cn(checkFieldVariants())}>
      <BaseCheckbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onChange(value === true)}
      />
      {label}
    </BaseLabel>
  );
}
