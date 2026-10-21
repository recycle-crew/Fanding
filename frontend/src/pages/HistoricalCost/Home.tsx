import { HistoricalCostsPage } from "@/features/inventory/render";
import { InventoryFilters } from "@/features/inventory/InventoryFilters";
import { PageHeading } from "@/components/workspace/PageHeading";
export function HistoricalCostPage() {
  return (
    <InventoryFilters>
      <PageHeading />
      <HistoricalCostsPage />
    </InventoryFilters>
  );
}
