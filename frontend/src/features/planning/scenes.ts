// 規劃板只展示目前保留的工作區模組。
export const planningPages = [
  {
    id: "items",
    title: "品項與庫存管理",
    description: "管理品項、倉別庫存與批次。",
    frames: [
      {
        scene: "items-list",
        title: "品項清單",
        instruction: "搜尋品項，查看各倉庫存與品項明細。",
        outcome: "呈現品項與庫存資訊。",
        question: "品項清單與庫存明細是否符合日常查詢需求？",
      },
    ],
  },
  {
    id: "purchases",
    title: "進貨管理",
    description: "查詢進貨單、收貨與退換貨。",
    frames: [
      {
        scene: "purchases-list",
        title: "進貨單查詢",
        instruction: "選擇單據，查看進貨、收貨與帳務資訊。",
        outcome: "從列表進入單據處理。",
        question: "進貨、退換貨與帳務的操作權限如何安排？",
      },
    ],
  },
  {
    id: "base-data",
    title: "基礎資料管理",
    description: "維護廠商、倉庫與共用選項。",
    frames: [
      {
        scene: "base-data-list",
        title: "基礎資料",
        instruction: "選擇資料分類，查詢與維護共用資料。",
        outcome: "其他模組使用相同的基礎資料。",
        question: "哪些人員可以維護共用資料？",
      },
    ],
  },
  {
    id: "consumptions",
    title: "耗用查詢",
    description: "查詢耗用與庫存異動。",
    frames: [
      {
        scene: "consumptions-list",
        title: "耗用紀錄",
        instruction: "依日期及品項篩選紀錄。",
        outcome: "查閱耗用明細。",
        question: "需要提供哪些耗用篩選條件？",
      },
    ],
  },
  {
    id: "sales",
    title: "銷售管理",
    description: "收銀、交易查詢與退貨處理。",
    frames: [
      {
        scene: "pos-list",
        title: "收銀作業",
        instruction: "搜尋商品，加入購物車並完成結帳。",
        outcome: "保留銷售明細。",
        question: "結帳需要支援哪些付款方式？",
      },
      {
        scene: "sales-list",
        title: "銷售紀錄",
        instruction: "查詢銷售單據與退貨紀錄。",
        outcome: "從單據查看交易結果。",
        question: "退款與作廢是否需要覆核？",
      },
    ],
  },
  {
    id: "stocktakes",
    title: "盤點管理",
    description: "建立盤點單、登錄實盤與核對差異。",
    frames: [
      {
        scene: "stocktakes-list",
        title: "盤點單清單",
        instruction: "建立盤點單，選擇倉別與盤點範圍。",
        outcome: "建立後即可清點與登錄。",
        question: "盤點期間是否允許入出庫？",
      },
      {
        scene: "stocktakes-review",
        title: "盤點差異核對",
        instruction: "查看差異，必要時複盤，再比較與採用結果。",
        outcome: "逐項核對後完成盤點單。",
        question: "差異確認後是否需要產生正式庫存調整單？",
      },
    ],
  },
];
export type Scene = (typeof planningPages)[number]["frames"][number]["scene"];
export type SceneRequest =
  | { type: "fangding-request-scene"; scene: Scene; requestId: number }
  | { type: "fangding-dismiss-form" };
export type SceneResponse =
  | { type: "fangding-workspace-ready" }
  | {
      type: "fangding-scene-result";
      requestId: number;
      accepted: boolean;
      reason?: string;
    };
