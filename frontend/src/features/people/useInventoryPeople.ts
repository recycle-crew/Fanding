import { useEffect, useState } from "react";
import { listInventoryPeople } from "./api";
import type { InventoryPerson } from "@/types/people";

export function useInventoryPeople() {
  const [people, setPeople] = useState<InventoryPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    listInventoryPeople()
      .then((rows) => {
        if (!cancelled) setPeople(rows.filter((row) => row.active));
      })
      .catch(() => {
        if (!cancelled) {
          setPeople([]);
          setError("無法載入人員資料，請重試。");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [revision]);
  return {
    people,
    loading,
    error,
    retry: () => setRevision((value) => value + 1),
  };
}
