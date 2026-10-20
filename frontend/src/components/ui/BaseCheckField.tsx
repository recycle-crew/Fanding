import { useId } from "react";
import { BaseCheckbox } from "./BaseCheckbox";
import { BaseLabel } from "./BaseLabel";
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
    <BaseLabel htmlFor={id} className="flex items-center gap-3 leading-6">
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
