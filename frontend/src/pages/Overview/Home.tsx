import { BaseCard } from "@/components/ui/BaseCard";

import { BaseButton } from "@/components/ui/BaseButton";

import { BaseDataTable } from "@/components/ui/BaseDataTable";

import { useAppSelector } from "@/store/hooks";

import { OverviewMovements } from "@/features/inventory/render";

import { InventoryFilters } from "@/features/inventory/InventoryFilters";
import { PageHeading } from "@/components/workspace/PageHeading";
import { useNavigate, useLocation } from "react-router";
export function OverviewPage() {
  const products = useAppSelector((root) => root.workspace.otcProducts);
  const low = products.filter(
    (product) => product.status === "啟用" && product.stock < product.minStock,
  );
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <InventoryFilters>
      <div
        onClick={(event) => {
          const button = (event.target as HTMLElement).closest("button");
          if (button?.dataset.action === "show-low-stock") {
            const panel = document.getElementById("low-stock-panel");
            panel?.focus({ preventScroll: true });
            panel?.scrollIntoView({ block: "start" });
          }
          if (button?.dataset.module === "receipt")
            navigate("/receipt" + location.search);
        }}
      >
        <PageHeading />{" "}
        <>
          {<OverviewMovements />}
          <BaseCard variant="panel" id="low-stock-panel" tabIndex={-1}>
            <h3>OTC 低庫存提醒</h3>
            <BaseDataTable
              tableKey="overview-low-stock"
              headers={["品項", "庫存", "最低庫存", "單位", "填寫人員"]}
              rows={low.map((product) => [
                product.name,
                String(product.stock),
                String(product.minStock),
                product.unit,
                product.filledBy ?? "未記錄",
              ])}
            />
            <BaseButton
              variant="outline"
              data-module="receipt"
              className="mt-4"
            >
              前往掃碼入庫 →
            </BaseButton>
          </BaseCard>
        </>
      </div>
    </InventoryFilters>
  );
}
