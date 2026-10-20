import { useAppSelector } from "@/store/hooks";

/** Current master options for new documents; snapshots on existing documents remain unchanged. */
export function useBaseDataOptions() {
  const data = useAppSelector((state) => state.baseData);
  return {
    suppliers: data.suppliers
      .filter((row) => row.active)
      .map((row) => row.name),
    warehouses: data.warehouses
      .filter((row) => row.active)
      .map((row) => row.name),
  };
}
