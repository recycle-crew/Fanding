import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import reducer from "./reducer";
import { seedConsumptions } from "./model";

const ConsumptionsContext = createContext<{
  state: ReturnType<typeof seedConsumptions>;
  dispatch: Dispatch<Parameters<typeof reducer>[1]>;
} | null>(null);

// Mounted for the app lifetime to preserve data across routes, as before.
// Only the consumption module consumes this state; it does not belong in Redux.
export function ConsumptionsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, seedConsumptions);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <ConsumptionsContext value={value}>{children}</ConsumptionsContext>;
}

export function useConsumptions() {
  const value = useContext(ConsumptionsContext);
  if (!value) throw new Error("ConsumptionsProvider is required");
  return value;
}
