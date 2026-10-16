// 各 Page 擁有自己的畫面順序、操作說明與需求訪談問題。
export const planningPages = [
  {
    id: "login",
    title: "登入與工作區",
    description: "從 NAS LDAP 登入畫面到工作區總覽。",
    frames: [
      {
        scene: "login",
        title: "登入畫面",
        instruction: "使用已填好的展示帳號，按「使用展示帳號登入」。",
        outcome: "進入工作區總覽；此處不驗證真實帳密。",
        question: "是在本系統輸入帳密，還是沿用既有單一登入狀態？",
      },
      {
        scene: "forgot-password",
        title: "忘記密碼",
        instruction:
          "填寫 LDAP 帳號與登記信箱，按「模擬申請重設」，或返回登入。",
        outcome: "顯示展示申請結果；不寄信、不查帳號、不修改密碼。",
        question: "院內是否已有 LDAP 密碼重設入口？由身分服務或管理員處理？",
      },
      {
        scene: "overview",
        title: "工作區總覽",
        instruction: "查看庫存摘要，點選指標或左側功能選單。",
        outcome: "可進入 HIS、OTC、廠商維護與盤點。",
        question: "哪些庫存指標與提醒需要放在首頁？",
      },
    ],
  },
  {
    id: "vendors",
    title: "廠商資料維護",
    description: "列表 → 新增 → 編輯，以表格管理廠商。",
    frames: [
      {
        scene: "vendor-list",
        title: "廠商列表",
        instruction:
          "搜尋廠商，並以狀態下拉選單篩選全部、啟用或停用；點新增、編輯或刪除。",
        outcome: "列表依搜尋及狀態條件更新；被品項引用的廠商不能刪除。",
        question: "HIS 與 OTC 是否共用廠商？既有廠商資料從哪裡取得？",
      },
      {
        scene: "vendor-new",
        title: "新增廠商",
        instruction: "檢查預填的示範欄位，按儲存新增。",
        outcome: "新增廠商出現在列表，代碼不可重複。",
        question: "哪些廠商欄位必填？是否需要統編、地址或付款條件？",
      },
      {
        scene: "vendor-edit",
        title: "編輯廠商",
        instruction:
          "查看已帶入的唯讀資料；僅補填空白聯絡資訊，狀態顯示於右上角。",
        outcome: "保存補填內容；啟用狀態不可在此修改。",
        question: "已有作業紀錄的廠商，停用後如何處理？",
      },
    ],
  },
  {
    id: "his",
    title: "HIS 藥品查詢與修改",
    description: "查詢藥品檔 → 修改欄位 → 檢視回寫結果。日常扣庫由 HIS 執行。",
    frames: [
      {
        scene: "his-list",
        title: "HIS 藥品列表",
        instruction: "搜尋示例藥品，查看規格、單位與庫存。",
        outcome: "呈現 HIS 藥品檔的查詢畫面。",
        question: "即時資料更新需要多快？有哪些搜尋條件？",
      },
      {
        scene: "his-edit",
        title: "修改藥品檔",
        instruction:
          "核對既有名稱、規格與單位；只能補填空白欄位，狀態不可修改。",
        outcome: "顯示模擬回寫成功，庫存不因編輯而改變。",
        question: "哪些欄位允許修改？誰有權限？是否要保留修改歷程？",
      },
      {
        scene: "his-result",
        title: "回寫結果",
        instruction: "核對列表的最新內容；可再次開啟編輯確認。",
        outcome: "呈現剛才儲存的假資料；切到此步驟不會自動回寫。",
        question: "回寫失敗、連線中斷或多人同時修改時怎麼處理？",
      },
    ],
  },
  {
    id: "receipt",
    title: "OTC 掃碼入庫",
    description: "掃碼 → 已有品項直接入庫／未建檔先補建 → 核對入庫結果。",
    frames: [
      {
        scene: "receipt-scan",
        title: "掃描條碼",
        instruction:
          "掃碼槍掃描完成後送出 Enter，自動查找品項；手動輸入後按 Enter。",
        outcome: "查找到品項後，顯示庫存與入庫表單。",
        question: "國際條碼格式與掃描設備為何？不同包裝是否有不同條碼？",
      },
      {
        scene: "receipt-known",
        title: "已有品項入庫",
        instruction: "已代入既有品項與數量 10；檢查後按確認入庫。",
        outcome: "假庫存增加，留下入庫異動紀錄。",
        question: "是否需要批號、效期、廠商單號或儲位？",
      },
      {
        scene: "receipt-new",
        title: "未建檔：補建並入庫",
        instruction: "系統提示條碼未建檔。檢查品項資料與數量，按儲存。",
        outcome: "新增品項並完成入庫，不必回列表另做一次入庫。",
        question: "新增品項需要哪些資訊？誰可以新增？",
      },
      {
        scene: "receipt-result",
        title: "入庫結果與紀錄",
        instruction: "查看最近入庫紀錄；可到品項維護查詢新建品項。",
        outcome: "顯示當次實際操作結果；本步驟不自動新增或扣庫。",
        question: "入庫錯誤如何更正或取消？是否需要審核？",
      },
    ],
  },
  {
    id: "issue",
    title: "OTC 出庫／耗用",
    description: "查找品項 → 輸入用途與數量 → 核對耗用結果。",
    frames: [
      {
        scene: "issue-scan",
        title: "出庫掃碼",
        instruction: "輸入條碼按 Enter，或代入已存在條碼。",
        outcome: "顯示啟用品項的可用庫存；未知條碼提示查無資料。",
        question: "耗用與其他出庫用途需要分開嗎？",
      },
      {
        scene: "issue-form",
        title: "填寫耗用資訊",
        instruction: "檢查示範數量 3 與用途，按確認耗用出庫。",
        outcome: "減少假庫存並留下紀錄；數量不足時阻擋。",
        question: "需要記錄部門、操作人、批號或耗用原因嗎？",
      },
      {
        scene: "issue-result",
        title: "耗用結果",
        instruction: "核對最近紀錄與庫存數量。",
        outcome: "呈現已完成的耗用，切換步驟不會再次扣庫。",
        question: "如何處理誤扣、取消或退回？",
      },
    ],
  },
  {
    id: "requisitions",
    title: "OTC 領用資料",
    description: "查看領用 → 新增 → 編輯與刪除。展示假設：領用立即扣庫。",
    frames: [
      {
        scene: "requisition-list",
        title: "領用列表",
        instruction: "搜尋領用資料，查看品項、領用人與數量。",
        outcome: "可以新增、編輯、刪除領用資料。",
        question: "領用是申請、實際領取，還是另一種出庫用途？",
      },
      {
        scene: "requisition-new",
        title: "新增領用",
        instruction:
          "檢查預填領用人與數量 4；空白領用人可輸入或從自動完成下拉選取，再按儲存。",
        outcome: "依展示假設立即扣假庫存，不再重複產生耗用扣庫。",
        question: "實際應該在哪個時點扣庫？是否需要審核？",
      },
      {
        scene: "requisition-edit",
        title: "編輯／刪除領用",
        instruction:
          "進入編輯頁補填空白欄位；已有的品項與數量為唯讀，返回列表後可確認刪除。",
        outcome: "修改依新舊差額調整庫存，刪除回復原領用數量。",
        question: "已領取後是否可以修改或刪除？需要保留哪些操作紀錄？",
      },
    ],
  },
  {
    id: "stocktake",
    title: "HIS ／ OTC 庫存總覽",
    description: "選擇工作區 → 掃碼填實盤 → 確認送出 → 核對結果。",
    frames: [
      {
        scene: "stocktake-otc",
        title: "OTC 掃碼盤點",
        instruction: "已加入示例品項；按「編輯」進入實盤數量編輯頁。",
        outcome: "列表顯示帳面數量與盤盈盤差，不在表格直接輸入。",
        question: "盤點以哪個時間點為準？是否分倉庫或盤點批次？",
      },
      {
        scene: "stocktake-edit",
        title: "編輯實盤數量",
        instruction:
          "在獨立編輯頁填寫實盤數量，按「儲存草稿並返回」；返回列表後再確認送出。",
        outcome: "實盤數量需人工填寫，可填零；草稿可修改，送出後整批鎖定。",
        question: "盤點數量是否需要覆核？誰能修改？",
      },
      {
        scene: "stocktake-his",
        title: "HIS 掃碼盤點",
        instruction:
          "在 HIS 工作區按「編輯」，儲存實盤數量後返回列表，再按確認送出。",
        outcome: "展示假設：直接調整 HIS 假庫存，不連線 HIS。",
        question: "正式 HIS 庫存調整如何交由 HIS 執行？",
      },
      {
        scene: "stocktake-confirm",
        title: "確認盤盈盤差調整",
        instruction: "檢查調整前後數量，選擇確認或取消。",
        outcome:
          "整批送出後更新假庫存並鎖定所有明細，不可再修改、移除或重複送出。",
        question: "是否需要審核、調整原因與操作人紀錄？",
      },
      {
        scene: "stocktake-result",
        title: "盤點調整結果",
        instruction: "檢查已調整標示與異動紀錄；必要時重新掃碼開始新盤點。",
        outcome: "呈現當次已完成與待處理盤點；不自動調整。",
        question: "盤點期間庫存異動或帳面變更時怎麼處理？",
      },
    ],
  },
];
export type Scene = (typeof planningPages)[number]["frames"][number]["scene"];
export type SceneRequest =
  | { type: "fangding-request-scene"; scene: Scene; requestId: number }
  | { type: "fangding-dismiss-form" };
export type SceneResponse =
  | { type: "fangding-demo-ready" }
  | {
      type: "fangding-scene-result";
      requestId: number;
      accepted: boolean;
      reason?: string;
    };
