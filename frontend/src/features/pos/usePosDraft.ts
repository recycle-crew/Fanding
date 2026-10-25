import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updatePosDraft } from "@/store/pos";
import type { PosDraft } from "@/types/pos";

// 草稿與交易同樣只保留於本次工作階段，跨頁查單不會清空。
export function usePosDraft<K extends keyof PosDraft>(key: K) {
  const value = useAppSelector((root) => root.pos.draft[key]);
  const dispatch = useAppDispatch();
  return [
    value,
    (next: PosDraft[K]) => dispatch(updatePosDraft({ [key]: next })),
  ] as const;
}
