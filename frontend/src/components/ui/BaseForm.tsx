import { cn } from "cn";
import { cva } from "class-variance-authority";
import {
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { BaseLabel } from "@/components/ui/BaseLabel";
import { BaseButton } from "@/components/ui/BaseButton";
const ErrorContext = createContext({ field: "", id: "" });
export function BaseField({
  name,
  label,
  required = false,
  children,
  hint,
}: {
  name: string;
  label: string;
  required?: boolean;
  children: ReactElement<Record<string, unknown>>;
  hint?: string;
}) {
  const error = useContext(ErrorContext);
  return (
    <BaseLabel variant="field" htmlFor={name}>
      <span>
        <span id={`${name}-label`}>{label}</span>
        {required && <em aria-hidden="true"> *</em>}
      </span>
      {cloneElement(children, {
        id: name,
        name,
        "aria-labelledby": `${name}-label`,
        "aria-describedby":
          [hint ? `${name}-hint` : "", error.field === name ? error.id : ""]
            .filter(Boolean)
            .join(" ") || undefined,
        "aria-invalid": error.field === name || undefined,
        required,
      })}
      {hint && <small id={`${name}-hint`}>{hint}</small>}
    </BaseLabel>
  );
}
export type FormError = { message: string; field?: string };
const formVariants = cva("items-editor-form purchase-form");

const formScrollVariants = cva("items-modal-scroll");

const formErrorVariants = cva("items-error");

const formFooterVariants = cva("items-modal-footer");

export function BaseForm({
  children,
  submitText,
  onCancel,
  onDirty,
  submit,
}: {
  children: ReactNode;
  submitText: string;
  onCancel: () => void;
  onDirty: () => void;
  submit: () => FormError | void;
}) {
  const [error, setError] = useState<FormError>({ message: "" });
  const id = useId();
  const summary = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (error.message) summary.current?.focus();
  }, [error]);
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    const invalid = event.currentTarget.querySelector<
      HTMLInputElement | HTMLSelectElement
    >(":invalid");
    if (invalid) {
      setError({
        field: invalid.name,
        message: `${invalid.getAttribute("aria-label") || invalid.labels?.[0]?.querySelector("span")?.textContent || "欄位"}：${invalid.validationMessage}`,
      });
      return;
    }
    const failure = submit();
    if (failure) setError(failure);
  }
  return (
    <ErrorContext.Provider value={{ field: error.field || "", id }}>
      <form
        className={cn(formVariants())}
        noValidate
        onSubmit={onSubmit}
        onChangeCapture={() => {
          setError({ message: "" });
          onDirty();
        }}
      >
        <div className={cn(formScrollVariants())}>
          {children}
          {error.message && (
            <p
              ref={summary}
              id={id}
              role="alert"
              tabIndex={-1}
              className={cn(formErrorVariants())}
            >
              {error.message}
            </p>
          )}
        </div>
        <footer className={cn(formFooterVariants())}>
          <span>＊ 必填欄位</span>
          <BaseButton type="button" variant="outline" onClick={onCancel}>
            取消
          </BaseButton>
          <BaseButton type="submit">{submitText}</BaseButton>
        </footer>
      </form>
    </ErrorContext.Provider>
  );
}
