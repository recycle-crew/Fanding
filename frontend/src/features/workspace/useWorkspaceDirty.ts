import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setModuleDirty } from "@/store/moduleUi";
export function useWorkspaceDirty(dirty: boolean) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(setModuleDirty(dirty));
    const unload = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", unload);
    return () => {
      dispatch(setModuleDirty(false));
      window.removeEventListener("beforeunload", unload);
    };
  }, [dirty, dispatch]);
}
