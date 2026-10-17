import React, { useEffect, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import type { InventoryFilter } from "@/types/demo";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
type ControlProps = {
  children?: ReactNode;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
};
// 各表保留自己的未送出條件；查詢批次時先解除單日限制，需要日期交集時可再填日期。
export function BaseFilterForm(props: {
  id: string;
  className: string;
  initial: InventoryFilter;
  filterFields: ReactNode;
}) {
  const [draft, setDraft] = useState(props.initial);
  useEffect(() => setDraft(props.initial), [props.initial]);
  function controls(nodes: ReactNode): ReactNode {
    return React.Children.map(nodes, (child) => {
      if (!React.isValidElement<ControlProps>(child)) return child;
      const controlProps = child.props;
      if (
        (child.type === Input || child.type === NativeSelect) &&
        controlProps.name
      ) {
        const name = controlProps.name as keyof InventoryFilter;
        return React.cloneElement(child, {
          defaultValue: undefined,
          value: draft[name] ?? "",
          onChange: (event) => {
            const value = event.target.value;
            setDraft((previous) => ({
              ...previous,
              [name]: value,
              ...(props.id === "overview-movement-filter" &&
              name === "voucherId" &&
              value.trim()
                ? { date: "" }
                : {}),
            }));
          },
          children: controlProps.children,
        });
      }
      return controlProps.children
        ? React.cloneElement(child, {
            children: controls(controlProps.children),
          })
        : child;
    });
  }
  return (
    <form id={props.id} className={props.className}>
      {controls(props.filterFields)}
    </form>
  );
}
