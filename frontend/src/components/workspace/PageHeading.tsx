import { BaseButton } from "@/components/ui/BaseButton";
import { BaseBadge } from "@/components/ui/BaseBadge";
import { BaseAlert } from "@/components/ui/BaseAlert";

import { useAppSelector } from "@/store/hooks";

import type { ModuleKey } from "@/types/workspace";
const subtitles: Record<ModuleKey, string> = {
  "base-data": "維護倉別與供應商基本資料。",
  consumptions: "查閱 HIS 來源耗用與同步異常。",
  pos: "商品搜尋與前端收銀展示。",
  sales: "銷售歷史、退貨與退款展示。",
  stocktakes: "盲盤輸入、主管核對與複盤展示。",
  purchases: "管理進貨單據、核對結帳與進貨明細。",
  items: "統一管理品項資料、庫存數量及批號效期。",
  "historical-cost": "依已送出的入庫傳票，查閱各料號歷史成本與當次單價。",
  overview: "從資料維護到庫存作業，掌握今天的工作。",
  vendors: "以表格管理廠商基本資料。",
  his: "查詢藥品檔，模擬修改並回寫 HIS。",
  products: "維護 OTC 品項與條碼，庫存透過作業異動更新。",
  receipt: "建立入庫傳票，掃碼加入明細後整批送出。",
  issue: "建立出庫傳票，掃碼加入明細後整批送出。",
  requisitions: "維護領用資料與展示扣庫紀錄。",
  stocktake: "只處理進行中的週期：開始、填寫、確認送出。",
  "stocktake-history": "只查已結束批次：月份紀錄、盤差、操作與更正歷程。",
};
export function PageHeading() {
  const s = useAppSelector((root) => root.workspace);
  const module = s.modules.find((module) => module.key === s.activeModule)!;
  const low = s.otcProducts.filter(
    (product) => product.status === "啟用" && product.stock < product.minStock,
  );
  return (
    <>
      {" "}
      {![
        "items",
        "purchases",
        "base-data",
        "consumptions",
        "pos",
        "sales",
        "stocktakes",
      ].includes(s.activeModule) && (
        <div className="page-heading">
          <div>
            <p className="eyebrow">
              庫存管理系統 / {s.activeModule === "his" ? "HIS" : "工作區"}
            </p>
            <h2>{module.label}</h2>
            <p>{subtitles[s.activeModule]}</p>
          </div>
          {["vendors", "products", "requisitions"].includes(s.activeModule) ? (
            <BaseButton variant="primary" data-action="add">
              ＋ 新增資料
            </BaseButton>
          ) : (
            <div className="page-heading-actions">
              {s.activeModule === "overview" && (
                <BaseButton
                  variant="notification"
                  type="button"
                  data-action="show-low-stock"
                  aria-controls="low-stock-panel"
                  aria-label={`低庫存提醒，共 ${low.length} 個品項，點擊查看`}
                  title="查看低庫存提醒"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                    <path d="M10 21h4M12 2V1" />
                  </svg>
                  <span className="low-stock-count">{low.length}</span>
                  <span>低庫存提醒</span>
                </BaseButton>
              )}
              <BaseBadge variant="secondary">展示模式・假資料</BaseBadge>
            </div>
          )}
        </div>
      )}
      {s.activeModule === "his" && (
        <BaseAlert variant="info" role="note">
          日常扣庫由 HIS 執行。本頁僅模擬藥品檔維護與回寫；藥品編輯不修改庫存。
        </BaseAlert>
      )}
      {s.activeModule === "requisitions" && (
        <BaseAlert variant="warning" role="note">
          展示假設，正式規則待確認：領用立即扣庫，修改依差額調整，刪除回復庫存；不重複產生耗用扣庫。
        </BaseAlert>
      )}
      {["stocktake", "stocktake-history"].includes(s.activeModule) && (
        <BaseAlert variant="warning" role="note">
          展示假設，正式規則待確認：HIS 與 OTC
          盤點確認後直接調整假庫存。此操作不會連線或修改 HIS 資料庫。
        </BaseAlert>
      )}
    </>
  );
}
