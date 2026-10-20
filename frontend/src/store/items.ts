import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  createItemsSeed,
  validateItem,
  type Item,
} from "@/features/items/model";
const slice = createSlice({
  name: "items",
  initialState: createItemsSeed(),
  reducers: {
    saveItem(state, { payload }: PayloadAction<Item>) {
      if (validateItem(payload, state)) return;
      const index = state.items.findIndex((item) => item.id === payload.id);
      if (index >= 0) state.items[index] = payload;
      else
        state.items.push({ ...payload, id: `item-${state.items.length + 1}` });
    },
    setItemActive(
      state,
      { payload }: PayloadAction<{ id: string; active: boolean }>,
    ) {
      const item = state.items.find((i) => i.id === payload.id);
      if (item) item.active = payload.active;
    },
  },
});
export const { saveItem, setItemActive } = slice.actions;
export default slice.reducer;
