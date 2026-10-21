import { BaseCard } from "@/components/ui/BaseCard";

import { BaseDataTable } from "@/components/ui/BaseDataTable";

import { useAppSelector } from "@/store/hooks";

export function DataChangeHistory() {
  const s = useAppSelector((root) => root.workspace);
  return (
    <>
      {" "}
      {["vendors", "his", "products", "requisitions"].includes(
        s.activeModule,
      ) && (
        <BaseCard variant="panel">
          <h3>資料修改歷程</h3>
          <BaseDataTable
            tableKey={`data-changes-${s.activeModule}`}
            headers={[
              "時間",
              "識別",
              "欄位",
              "原值",
              "新值",
              "操作",
              "修改人員",
            ]}
            rows={s.dataChangeRecords
              .filter((c) => c.kind === s.activeModule)
              .slice()
              .reverse()
              .map((c) => [
                new Date(c.time).toLocaleString("zh-TW"),
                String(c.recordId),
                (
                  {
                    code: "廠商代碼",
                    name: "名稱",
                    shortName: "簡稱",
                    contact: "聯絡人",
                    phone: "電話",
                    email: "Email",
                    barcode: "國際條碼",
                    spec: "規格",
                    unit: "單位",
                    vendorId: "廠商",
                    costPrice: "成本價",
                    salePrice: "售價",
                    minStock: "最低庫存",
                    activationDate: "啟用日期",
                    deactivationDate: "停用日期",
                    person: "領用人",
                    productId: "品項",
                    quantity: "數量",
                    note: "備註",
                  } as Record<string, string>
                )[c.field] ?? c.field,
                c.before,
                c.after,
                c.permission,
                c.filledBy,
              ])}
          />
        </BaseCard>
      )}
    </>
  );
}
