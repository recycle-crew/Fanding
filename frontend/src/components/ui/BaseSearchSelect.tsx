import { useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { Check, ChevronDown } from "lucide-react";
import { BaseInput } from "./BaseInput";
import { BaseButton } from "./BaseButton";

export interface SearchSelectOption {
  value: string;
  label: string;
  description?: string;
  keywords?: string;
}

/** Selected identifiers remain separate from editable search text. */
export function BaseSearchSelect({
  value,
  options,
  onValueChange,
  placeholder = "輸入關鍵字搜尋或展開選單",
  emptyText = "沒有符合的選項",
  ...props
}: Omit<ComponentProps<"input">, "value" | "onChange" | "type" | "role"> & {
  value: string;
  options: SearchSelectOption[];
  onValueChange: (value: string) => void;
  emptyText?: string;
}) {
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const selected = options.find((option) => option.value === value);
  const matches = options.filter((option) =>
    `${option.label} ${option.description || ""} ${option.keywords || ""}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const activeIndex = Math.min(active, Math.max(0, matches.length - 1));
  useEffect(() => {
    if (open)
      list.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open, query]);
  useEffect(() => {
    if (!open) return;
    // Run before the enclosing dialog's document capture listener.
    const closeDropdown = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        !event.isComposing &&
        document.activeElement === input.current
      ) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", closeDropdown, true);
    return () => window.removeEventListener("keydown", closeDropdown, true);
  }, [open]);
  function choose(option: SearchSelectOption) {
    onValueChange(option.value);
    setOpen(false);
    setQuery("");
  }
  return (
    <div
      className="relative min-w-0"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <div className="relative">
        <BaseInput
          {...props}
          ref={input}
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={
            open && matches.length ? `${listId}-${activeIndex}` : undefined
          }
          className="pr-10"
          value={open ? query : selected?.label || query}
          placeholder={placeholder}
          onFocus={() => {
            setOpen(true);
            setQuery("");
            setActive(0);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(0);
            if (value) onValueChange("");
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              if (!open) {
                setOpen(true);
                setQuery("");
                setActive(0);
              } else
                setActive(
                  (current) =>
                    (current +
                      (event.key === "ArrowDown" ? 1 : -1) +
                      Math.max(1, matches.length)) %
                    Math.max(1, matches.length),
                );
            } else if (event.key === "Enter") {
              event.preventDefault();
              if (open && matches[activeIndex]) choose(matches[activeIndex]);
            } else if (event.key === "Escape" && open) {
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
            }
          }}
        />
        <BaseButton
          type="button"
          variant="ghost"
          disabled={props.disabled}
          tabIndex={-1}
          aria-label="展開選單"
          aria-expanded={open}
          aria-controls={listId}
          className="absolute inset-y-0 right-0 h-full px-2"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (open) setOpen(false);
            else {
              input.current?.focus();
              setOpen(true);
              setQuery("");
              setActive(0);
            }
          }}
        >
          <ChevronDown size={16} aria-hidden="true" />
        </BaseButton>
      </div>
      {open && (
        <div
          ref={list}
          id={listId}
          role="listbox"
          aria-labelledby={props["aria-labelledby"]}
          aria-label={props["aria-label"]}
          className="purchase-search-results absolute top-full inset-x-0 z-20 bg-card shadow-md"
        >
          {matches.length ? (
            matches.map((option, index) => (
              <BaseButton
                key={option.value}
                id={`${listId}-${index}`}
                type="button"
                variant="ghost"
                role="option"
                aria-selected={option.value === value}
                tabIndex={-1}
                className={index === activeIndex ? "bg-accent" : undefined}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(option)}
              >
                <span className="min-w-0 whitespace-normal text-left">
                  <strong>{option.label}</strong>
                  {option.description && <small>{option.description}</small>}
                </span>
                {option.value === value && (
                  <Check size={16} aria-hidden="true" />
                )}
              </BaseButton>
            ))
          ) : (
            <p role="status" className="items-note px-2">
              {emptyText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
