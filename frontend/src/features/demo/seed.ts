import type { DemoState, Workspace } from "./types";
export function createDemoState(): DemoState {
  // 展示資料只留在記憶體；重新整理重新建立，不接觸正式系統。
  const vendors: DemoState["vendors"] = [
    {
      id: "V001",
      name: "晴川醫材（虛構）",
      contact: "陳小姐",
      phone: "02-0000-0101",
      email: "sales@example.test",
      status: "啟用",
    },
    {
      id: "V002",
      name: "天澄藥業（虛構）",
      contact: "林先生",
      phone: "02-0000-0102",
      email: "order@example.test",
      status: "啟用",
    },
    {
      id: "V003",
      name: "藍禾健康（虛構）",
      contact: "王小姐",
      phone: "03-0000-0103",
      email: "service@example.test",
      status: "啟用",
    },
    {
      id: "V004",
      name: "和光供應（虛構）",
      contact: "李先生",
      phone: "04-0000-0104",
      email: "hello@example.test",
      status: "啟用",
    },
    {
      id: "V005",
      name: "舊版展示廠商（虛構）",
      contact: "周先生",
      phone: "07-0000-0105",
      email: "archive@example.test",
      status: "停用",
    },
  ];
  // 廠商代碼是可選的顯示欄位；id 保留作為內部關聯識別。
  vendors.forEach((vendor) => {
    vendor.code = vendor.id;
    vendor.shortName = "";
  });
  let nextVendorId: DemoState["nextVendorId"] = 6;
  const hisMedicines: DemoState["hisMedicines"] = [
    ["示例藥品 A", "500 mg", "錠", 1200],
    ["示例藥品 B", "10 mg", "錠", 600],
    ["示例藥品 C", "250 mg", "膠囊", 32],
    ["示例藥品 D", "100 mL", "瓶", 90],
    ["示例藥品 E", "5 mg", "錠", 800],
    ["示例藥品 F", "20 mL", "支", 20],
    ["示例藥品 G", "30 g", "條", 140],
    ["示例藥品 H", "50 mg", "錠", 0],
  ].map((medicine, index) => ({
    id: `H${String(index + 1).padStart(3, "0")}`,
    barcode: `990100000${String(index + 1).padStart(4, "0")}`,
    name: String(medicine[0]),
    spec: String(medicine[1]),
    unit: String(medicine[2]),
    stock: Number(medicine[3]),
    status: index === 7 ? "停用" : "啟用",
  }));
  const otcProducts: DemoState["otcProducts"] = [
    ["醫用口罩", "50 入", "盒", 240],
    ["酒精棉片", "100 入", "盒", 80],
    ["無菌紗布", "10 入", "包", 12],
    ["透氣膠帶", "1 吋", "捲", 64],
    ["檢查手套", "M／100 入", "盒", 120],
    ["生理沖洗液", "500 mL", "瓶", 8],
    ["棉棒", "100 入", "包", 160],
    ["電子體溫計", "標準型", "支", 35],
    ["冷敷袋", "小型", "個", 28],
    ["舊版護具", "展示停用品", "個", 0],
  ].map((product, index): import("./types").Product => ({
    id: `O${String(index + 1).padStart(3, "0")}`,
    barcode: `990200000${String(index + 1).padStart(4, "0")}`,
    name: String(product[0]),
    spec: String(product[1]),
    unit: String(product[2]),
    stock: Number(product[3]),
    costPrice: null,
    salePrice: null,
    minStock: 20,
    activationDate: "",
    deactivationDate: "",
    vendorId: vendors[index % 4].id,
    status: index === 9 ? "停用" : "啟用",
  }));
  const movements: DemoState["movements"] = [
    {
      id: 1,
      workspace: "OTC",
      productId: "O001",
      type: "入庫",
      quantity: 50,
      note: "期初展示入庫",
      time: "2026/10/14 09:00",
      recordedAt: new Date("2026-10-14T09:00:00").toISOString(),
    },
    {
      id: 2,
      workspace: "OTC",
      productId: "O002",
      type: "耗用",
      quantity: -5,
      note: "門診耗用",
      time: "2026/10/14 09:20",
      recordedAt: new Date("2026-10-14T09:20:00").toISOString(),
    },
  ];
  const requisitions: DemoState["requisitions"] = [
    {
      id: 1,
      productId: "O005",
      person: "展示護理師",
      quantity: 5,
      note: "日常領用",
      requisitionedAt: new Date("2026-10-14T09:20:00").toISOString(),
    },
  ];
  const stocktakeBatches: DemoState["stocktakeBatches"] = [
    {
      name: "2026 年 10 月盤點紀錄",
      id: "ST0001",
      workspace: "OTC",
      startedAt: "2026-10-14T01:00:00Z",
      endedAt: "2026-10-14T02:00:00Z",
      startedBy: "未記錄",
      endedBy: "未記錄",
    },
  ];
  const stocktakes: DemoState["stocktakes"] = [
    {
      id: 1,
      batchId: "ST0001",
      workspace: "OTC",
      productId: "O003",
      book: 15,
      actual: 12,
      completed: true,
    },
  ];
  const stocktakeOperations: DemoState["stocktakeOperations"] = [
    {
      id: 1,
      batchId: "ST0001",
      time: "2026-10-14T02:00:00Z",
      operation: "盤點調整",
      productId: "O003",
      before: "15",
      after: "12",
      detail: "既有展示盤點結果",
      outcome: "成功",
      filledBy: "未記錄",
    },
  ];
  // 月份紀錄為獨立歷史快照，不回寫目前庫存。
  for (const [id, workspace, month, productId, book, actual] of [
    ["ST0002", "OTC", 8, "O003", 16, 14],
    ["ST0003", "OTC", 9, "O003", 14, 12],
    ["ST0004", "HIS", 8, "H001", 1200, 1198],
    ["ST0005", "HIS", 9, "H001", 1198, 1200],
  ] as [string, Workspace, number, string, number, number][]) {
    // 九月只有 30 天，使用該月實際結束日。
    const day = month === 9 ? "30" : "31";
    const periodDate = `2026-${String(month).padStart(2, "0")}-${day}`;
    stocktakeBatches.push({
      id,
      name: `2026 年 ${month} 月盤點紀錄`,
      workspace,
      startedAt: `${periodDate}T01:00:00Z`,
      endedAt: `${periodDate}T02:00:00Z`,
      startedBy: "展示盤點人員",
      endedBy: "展示盤點人員",
    });
    stocktakes.push({
      id: stocktakes.length + 1,
      batchId: id,
      workspace,
      productId,
      book,
      actual,
      completed: true,
      confirmed: true,
      filledBy: "展示盤點人員",
    });
    stocktakeOperations.push({
      id: stocktakeOperations.length + 1,
      batchId: id,
      time: `${periodDate}T02:00:00Z`,
      operation: "盤點調整",
      productId,
      before: String(book),
      after: String(actual),
      detail: "月份歷史展示資料",
      outcome: "成功",
      filledBy: "展示盤點人員",
    });
  }
  stocktakes[0].confirmed = true;
  const selectedStocktakeBatchIds: DemoState["selectedStocktakeBatchIds"] = {
    OTC: null,
    HIS: null,
  };
  const selectedHistoricalBatchIds: DemoState["selectedHistoricalBatchIds"] = {
    OTC: "ST0001",
    HIS: "ST0005",
  };
  const stocktakeRoutes: DemoState["stocktakeRoutes"] = {
    "#/stocktake/current": "stocktake",
    "#/stocktake/history": "stocktake-history",
  };
  let nextStocktakeBatchId: DemoState["nextStocktakeBatchId"] = 6;
  let nextStocktakeOperationId: DemoState["nextStocktakeOperationId"] =
    stocktakeOperations.length + 1;
  const modules: DemoState["modules"] = [
    {
      key: "overview",
      label: "工作區總覽",
      group: "共同管理",
    },
    {
      key: "vendors",
      label: "廠商資料維護",
    },
    {
      key: "his",
      label: "藥品查詢與修改",
      group: "HIS 工作區",
    },
    {
      key: "products",
      label: "品項資料維護",
      group: "OTC 工作區",
    },
    {
      key: "historical-cost",
      label: "歷史平均成本價",
    },
    {
      key: "receipt",
      label: "掃碼入庫",
    },
    {
      key: "issue",
      label: "出庫／耗用",
    },
    {
      key: "requisitions",
      label: "領用資料",
    },
    {
      key: "stocktake",
      label: "現有盤點週期",
      group: "HIS ／ OTC 庫存總覽",
    },
    {
      key: "stocktake-history",
      label: "歷史盤點紀錄",
    },
  ];

  let activeModule: DemoState["activeModule"] = "overview";
  let currentAccount: DemoState["currentAccount"] = "";
  let canEditExistingData: DemoState["canEditExistingData"] = false;
  const stocktakeCorrections: DemoState["stocktakeCorrections"] = [];
  const dataChangeRecords: DemoState["dataChangeRecords"] = [];
  let searchTerm: DemoState["searchTerm"] = "";
  let vendorStatusFilter: DemoState["vendorStatusFilter"] = "";
  let historicalCostFilter: DemoState["historicalCostFilter"] = {
    voucherId: "",
    materialNumber: "",
    person: "",
    start: "",
    end: "",
  };
  let requisitionFilter: DemoState["requisitionFilter"] = {
    materialNumber: "",
    person: "",
    start: "",
    end: "",
  };
  let issueMovementTimeFilter: DemoState["issueMovementTimeFilter"] = {
    voucherId: "",
    materialNumber: "",
    person: "",
    start: "",
    end: "",
  };
  let receiptMovementFilter: DemoState["receiptMovementFilter"] = {
    voucherId: "",
    materialNumber: "",
    person: "",
    start: "",
    end: "",
  };
  let issueMovementView: DemoState["issueMovementView"] = "all";
  let overviewMovementFilter: DemoState["overviewMovementFilter"] = {
    voucherId: "",
    materialNumber: "",
    person: "",
    date: new Date().toLocaleDateString("sv-SE"),
    product: "",
    action: "",
    workspace: "",
  };
  let selectedProductId: DemoState["selectedProductId"] = null;
  let scanBarcode: DemoState["scanBarcode"] = "";
  let stocktakeWorkspace: DemoState["stocktakeWorkspace"] = "OTC";
  let nextMovementId: DemoState["nextMovementId"] = 3;
  const movementVouchers: DemoState["movementVouchers"] = [];
  const selectedMovementVoucherIds: DemoState["selectedMovementVoucherIds"] = {
    receipt: null,
    issue: null,
  };
  let nextRequisitionId: DemoState["nextRequisitionId"] = 2;
  let nextStocktakeId: DemoState["nextStocktakeId"] = stocktakes.length + 1;
  return {
    vendors,
    nextVendorId,
    hisMedicines,
    otcProducts,
    movements,
    requisitions,
    stocktakeBatches,
    stocktakes,
    stocktakeOperations,
    selectedStocktakeBatchIds,
    selectedHistoricalBatchIds,
    stocktakeRoutes,
    nextStocktakeBatchId,
    nextStocktakeOperationId,
    modules,
    activeModule,
    currentAccount,
    canEditExistingData,
    stocktakeCorrections,
    dataChangeRecords,
    searchTerm,
    vendorStatusFilter,
    historicalCostFilter,
    requisitionFilter,
    issueMovementTimeFilter,
    receiptMovementFilter,
    issueMovementView,
    overviewMovementFilter,
    selectedProductId,
    scanBarcode,
    stocktakeWorkspace,
    nextMovementId,
    movementVouchers,
    selectedMovementVoucherIds,
    nextRequisitionId,
    nextStocktakeId,
    loggedIn: false,
    recovery: false,
    recoverySent: false,
    editor: null,
    confirmation: null,
    readonlyReason: "",
    notice: "",
    errors: {},
    pageRevision: 0,
    movementDraft: { quantity: "", note: "", unitCost: "" },
  };
}
