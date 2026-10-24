export function nativeValidationMessage(
  input: HTMLInputElement | HTMLSelectElement,
) {
  const label = (
    input.getAttribute("aria-label") ||
    input.labels?.[0]?.querySelector("span")?.textContent ||
    "欄位"
  )
    .replace(/\s*\*\s*/g, "")
    .trim();
  const validity = input.validity;
  if (validity.valueMissing)
    return input.tagName === "SELECT" ? `請選擇${label}。` : `請填寫${label}。`;
  if (validity.rangeUnderflow)
    return `${label}不可小於 ${input.getAttribute("min")}。`;
  if (validity.rangeOverflow)
    return `${label}不可大於 ${input.getAttribute("max")}。`;
  if (validity.stepMismatch) {
    const step = input.getAttribute("step") || "1";
    const digits = step.startsWith("0.") ? step.slice(2).length : 0;
    return digits
      ? `${label}最多可填寫小數 ${digits} 位。`
      : `請依指定間隔 ${step} 填寫${label}。`;
  }
  if (validity.tooLong)
    return `${label}請勿超過 ${input.getAttribute("maxlength")} 個字元。`;
  if (validity.tooShort)
    return `${label}至少需要 ${input.getAttribute("minlength")} 個字元。`;
  return `請輸入有效的${label}。`;
}
