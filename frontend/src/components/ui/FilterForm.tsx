import React, { useEffect, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import type { InventoryFilter } from "../../features/demo/types";
type ControlProps = {
  children?: ReactNode;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
};
// 各表保留自己的未送出條件；查詢批次時先解除單日限制，需要日期交集時可再填日期。
export function FilterForm({
  id,
  className,
  initial,
  children,
}: {
  id: string;
  className: string;
  initial: InventoryFilter;
  children: ReactNode;
}) {
  const [draft, setDraft] = useState(initial);
  useEffect(() => setDraft(initial), [initial]);
  function controls(children: ReactNode): ReactNode {
    return React.Children.map(children, (child) => {
      if (!React.isValidElement<ControlProps>(child)) return child;
      const props = child.props;
      if ((child.type === "input" || child.type === "select") && props.name) {
        const name = props.name as keyof InventoryFilter;
        return React.cloneElement(child, {
          defaultValue: undefined,
          value: draft[name] ?? "",
          onChange: (event) => {
            const value = event.target.value;
            setDraft((previous) => ({
              ...previous,
              [name]: value,
              ...(id === "overview-movement-filter" &&
              name === "voucherId" &&
              value.trim()
                ? { date: "" }
                : {}),
            }));
          },
          children: props.children,
        });
      }
      return props.children
        ? React.cloneElement(child, { children: controls(props.children) })
        : child;
    });
  }
  return (
    <form id={id} className={className}>
      {controls(children)}
    </form>
  );
}
