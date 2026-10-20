import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { suppliers } from "@/features/items/model";
import type { BaseDataKind, BaseDataRecord } from "@/features/base-data/types";
export type { BaseDataKind, BaseDataRecord } from "@/features/base-data/types";
export function blankBaseData(): BaseDataRecord {
  return {
    id: "",
    code: "",
    name: "",
    location: "",
    taxId: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
    remark: "",
    active: true,
    used: false,
  };
}
const initialState: Record<BaseDataKind, BaseDataRecord[]> = {
  warehouses: [
    ["MAIN", "主倉庫", "一樓藥局"],
    ["MED", "診間倉庫", "二樓診間"],
    ["CONS", "備用倉庫", "三樓儲藏室"],
    ["DISPLAY", "展示倉", "一樓櫃檯"],
    ["SAMPLE", "樣品倉", "一樓藥局"],
    ["RETURN", "退貨暫存倉", "三樓儲藏室"],
    ["DAMAGE", "報廢暫存倉", "三樓儲藏室"],
    ["INACTIVE", "舊倉庫", "舊址"],
  ].map(([code, name, location], i) => ({
    ...blankBaseData(),
    id: `W${i}`,
    code,
    name,
    location,
    active: i !== 7,
    used: i < 3,
    remark: i < 3 ? "已被展示庫存引用" : "",
  })),
  suppliers: suppliers.map((name, i) => ({
    ...blankBaseData(),
    id: `V${i}`,
    name,
    code: `SUP00${i + 1}`,
    contact: ["林小姐", "陳先生", "王小姐"][i],
    phone: `02-0000-000${i}`,
    email: `demo${i + 1}@example.com`,
    address: "展示用地址",
    used: true,
  })),
};
const baseData = createSlice({
  name: "baseData",
  initialState,
  reducers: {
    saveBaseData(
      state,
      {
        payload,
      }: PayloadAction<{ kind: BaseDataKind; record: BaseDataRecord }>,
    ) {
      const list = state[payload.kind];
      const index = list.findIndex((row) => row.id === payload.record.id);
      if (index < 0) list.push(payload.record);
      else list[index] = payload.record;
    },
    toggleBaseData(
      state,
      { payload }: PayloadAction<{ kind: BaseDataKind; id: string }>,
    ) {
      const row = state[payload.kind].find(
        (record) => record.id === payload.id,
      );
      if (row) row.active = !row.active;
    },
    deleteBaseData(
      state,
      { payload }: PayloadAction<{ kind: BaseDataKind; id: string }>,
    ) {
      state[payload.kind] = state[payload.kind].filter(
        (record) => record.id !== payload.id || record.used,
      );
    },
  },
});
export const { saveBaseData, toggleBaseData, deleteBaseData } =
  baseData.actions;
export default baseData.reducer;
