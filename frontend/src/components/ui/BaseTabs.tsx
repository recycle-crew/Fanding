import { cn } from "cn";
import { cva } from "class-variance-authority";
import { BaseButton } from "./BaseButton";
import { moveTabFocus } from "@/lib/tabKeyboard";

const tabsVariants = cva("items-tabs");

export function BaseTabs<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div
      className={cn(tabsVariants())}
      role="tablist"
      aria-label={label}
      onKeyDown={moveTabFocus}
    >
      {options.map((option) => (
        <BaseButton
          key={option.value}
          variant="ghost"
          role="tab"
          id={`${id}-${option.value}`}
          aria-selected={value === option.value}
          aria-controls={`${id}-panel`}
          tabIndex={value === option.value ? 0 : -1}
          onFocus={() => {
            if (option.value !== value) onChange(option.value);
          }}
          onClick={() => {
            if (option.value !== value) onChange(option.value);
          }}
        >
          {option.label}
        </BaseButton>
      ))}
    </div>
  );
}
