import { configureStore } from "@reduxjs/toolkit";
import type { ThunkAction, UnknownAction } from "@reduxjs/toolkit";
import workspaceReducer from "./workspace";
import itemsReducer from "./items";
import purchasesReducer from "./purchases";
import baseDataReducer from "./baseData";
import moduleUiReducer from "./moduleUi";
import posReducer from "./pos";
import stocktakesReducer from "./stocktakes";

// Redux only owns data shared across modules and the cross-route navigation guard.
// Keep module-only data in features/<module>; keep UI drafts in component state.
export const store = configureStore({
  reducer: {
    workspace: workspaceReducer,
    items: itemsReducer,
    purchases: purchasesReducer,
    baseData: baseDataReducer,
    moduleUi: moduleUiReducer,
    pos: posReducer,
    stocktakes: stocktakesReducer,
  },
});

export type AppStore = typeof store;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
export type AppThunk = ThunkAction<void, RootState, unknown, UnknownAction>;
