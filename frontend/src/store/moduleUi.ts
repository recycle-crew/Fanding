import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
const moduleUi = createSlice({
  name: "moduleUi",
  initialState: { dirty: false },
  reducers: {
    setModuleDirty(state, action: PayloadAction<boolean>) {
      state.dirty = action.payload;
    },
  },
});
export const { setModuleDirty } = moduleUi.actions;
export default moduleUi.reducer;
