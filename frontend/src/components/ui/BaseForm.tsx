import { cn } from "cn";
import { cva } from "class-variance-authority";
import {
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  useForm,
  FormProvider,
  useFormContext,
  type FieldValues,
  type FieldPath,
  type UseFormReturn,
  type SubmitHandler,
} from "react-hook-form";
import { BaseLabel } from "@/components/ui/BaseLabel";
import { BaseButton } from "@/components/ui/BaseButton";

const ErrorContext = createContext<{
  field: string;
  id: string;
  message: string;
}>({ field: "", id: "", message: "" });

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
  const rhfContext = useFormContext();
  const rhfError = rhfContext?.formState.errors[name];
  const hasError = error.field === name || Boolean(rhfError);

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
          [hint ? `${name}-hint` : "", hasError ? error.id : ""]
            .filter(Boolean)
            .join(" ") || undefined,
        "aria-invalid": hasError || undefined,
        required,
      })}
      {hint && <small id={`${name}-hint`}>{hint}</small>}
    </BaseLabel>
  );
}

export type FormError = { message: string; field?: string };

const formVariants = cva("items-editor-form purchase-form");
const formScrollVariants = cva("items-modal-scroll");
const formErrorVariants = cva("items-error items-form-alert");
const formFooterVariants = cva("items-modal-footer");

export interface BaseFormProps<T extends FieldValues = FieldValues> {
  children: ReactNode;
  submitText: string;
  onCancel: () => void;
  onDirty: () => void;
  form?: UseFormReturn<T>;
  submit?: () => FormError | void | Promise<FormError | void>;
  onSubmit?: SubmitHandler<T>;
}

export function BaseForm<T extends FieldValues = FieldValues>({
  children,
  submitText,
  onCancel,
  onDirty,
  form,
  submit,
  onSubmit,
}: BaseFormProps<T>) {
  const fallbackForm = useForm<T>();
  const activeForm = form || fallbackForm;
  const id = useId();
  const summary = useRef<HTMLParagraphElement>(null);

  const errors = activeForm.formState.errors;
  const firstErrorKey = Object.keys(errors)[0];
  const firstErrorMessage = firstErrorKey
    ? String(errors[firstErrorKey]?.message || "欄位驗證未通過")
    : "";

  useEffect(() => {
    if (firstErrorMessage) {
      summary.current?.focus({ preventScroll: true });
    }
  }, [firstErrorMessage]);

  const handleFormSubmit = activeForm.handleSubmit(async (data) => {
    if (onSubmit) {
      await onSubmit(data);
    }
    if (submit) {
      const failure = await submit();
      if (failure) {
        activeForm.setError(
          (failure.field as any) || "root",
          { message: failure.message },
          { shouldFocus: true },
        );
      }
    }
  });

  return (
    <FormProvider {...activeForm}>
      <ErrorContext.Provider
        value={{
          field: firstErrorKey || "",
          id,
          message: firstErrorMessage,
        }}
      >
        <form
          className={cn(formVariants())}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            // 既有 submit 表單先依畫面欄位順序檢查原生限制，再執行業務驗證。
            if (submit && !form) {
              const invalid = event.currentTarget.querySelector<
                HTMLInputElement | HTMLSelectElement
              >(":invalid");
              if (invalid) {
                activeForm.setError((invalid.name || "root") as FieldPath<T>, {
                  type: "native",
                  message: `${invalid.getAttribute("aria-label") || invalid.labels?.[0]?.querySelector("span")?.textContent || "欄位"}：${invalid.validationMessage}`,
                });
                return;
              }
            }
            void handleFormSubmit(event);
          }}
          onChangeCapture={() => {
            activeForm.clearErrors();
            onDirty();
          }}
        >
          <div className={cn(formScrollVariants())}>{children}</div>
          {firstErrorMessage && (
            <p
              ref={summary}
              id={id}
              role="alert"
              tabIndex={-1}
              className={cn(formErrorVariants())}
            >
              {firstErrorMessage}
            </p>
          )}
          <footer className={cn(formFooterVariants())}>
            <span>＊ 必填欄位</span>
            <BaseButton type="button" variant="outline" onClick={onCancel}>
              取消
            </BaseButton>
            <BaseButton
              type="submit"
              disabled={activeForm.formState.isSubmitting}
            >
              {submitText}
            </BaseButton>
          </footer>
        </form>
      </ErrorContext.Provider>
    </FormProvider>
  );
}
