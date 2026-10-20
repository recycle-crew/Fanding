import {
  available,
  createItemsSeed,
  relativeDate,
  taipeiToday,
  usageStatus,
  type InventoryBatch,
  type Item,
} from "@/features/items/model";
export const paymentMethods = [
  "現金",
  "信用卡",
  "銀行轉帳",
  "其他人工付款",
] as const;
export type PaymentMethod = (typeof paymentMethods)[number];
export interface PosPolicy {
  sellable: boolean;
  price: number;
  favorite: boolean;
  sort: number;
  prescription: boolean;
  professional: boolean;
}
export interface CartLine {
  itemId: string;
  quantity: number;
  price: number;
  discount: number;
  batchId: string;
}
export interface Allocation {
  batchId: string;
  batchNumber: string;
  expiry: string;
  quantity: number;
  estimatedCost: number;
}
export interface SaleLine {
  id: string;
  itemId: string;
  code: string;
  name: string;
  specification: string;
  category: string;
  unit: string;
  medicine: boolean;
  quantity: number;
  originalPrice: number;
  price: number;
  discount: number;
  orderShare: number;
  net: number;
  allocations: Allocation[];
}
export interface Customer {
  id: string;
  name: string;
  phone: string;
}
export const customers: Customer[] = [
  { id: "C001", name: "陳小美（展示）", phone: "0900-000-001" },
  { id: "C002", name: "林大明（展示）", phone: "0900-000-002" },
  { id: "C003", name: "王小姐（展示）", phone: "0900-000-003" },
];
export const walkIn: Customer = { id: "", name: "散客", phone: "" };
export interface SaleReturn {
  id: string;
  date: string;
  reason: string;
  actor: string;
  method: PaymentMethod;
  lines: {
    lineId: string;
    quantity: number;
    refund: number;
    disposition: "可售回庫" | "不可售";
    allocations: Allocation[];
  }[];
}
export interface SaleRefund {
  id: string;
  sourceId: string;
  amount: number;
  method: PaymentMethod;
  status: "待退款" | "已退款";
  reference: string;
  actor: string;
  confirmedAt: string;
}
export interface Sale {
  id: string;
  requestId: string;
  number: string;
  date: string;
  warehouse: string;
  seller: string;
  customer: Customer;
  cashier: string;
  lines: SaleLine[];
  subtotal: number;
  orderDiscount: number;
  total: number;
  payment: {
    method: PaymentMethod;
    received: number;
    change: number;
    reference: string;
    confirmed: boolean;
  };
  receiptType: string;
  invoiceStatus: string;
  remark: string;
  authorization: string;
  returns: SaleReturn[];
  refunds: SaleRefund[];
  void: { reason: string; date: string; actor: string } | null;
}
export interface PosMovement {
  id: string;
  saleId: string;
  reference: string;
  batchId: string;
  itemId: string;
  quantity: number;
  type: "POS_OUT" | "POS_RETURN_IN" | "POS_VOID_REVERSAL_IN";
  time: string;
  actor: string;
}
export interface PosState {
  policies: Record<string, PosPolicy>;
  batches: InventoryBatch[];
  sales: Sale[];
  movements: PosMovement[];
}
export function nowTaipei() {
  return new Date().toLocaleString("sv-SE", { timeZone: "Asia/Taipei" });
}
export const cents = (value: number) =>
  Math.round((value + Number.EPSILON) * 100);
export const money = (value: number) =>
  value.toLocaleString("zh-TW", {
    style: "currency",
    currency: "TWD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
export const qty = (value: number) => Math.round(value * 1000) / 1000;
export function policyFor(item: Item): PosPolicy {
  return {
    sellable: item.code !== "MED0003",
    price: Number(item.suggestedPrice) || 0,
    favorite: ["MED0001", "OTC0001", "OTC0002", "OTC0004"].includes(item.code),
    sort: Number(item.code.replace(/\D/g, "")),
    prescription: item.code === "MED0002",
    professional: item.group === "HIS_MEDICINE",
  };
}
export function priceCart(lines: CartLine[], orderDiscount: number) {
  const amounts = lines.map(
    (line) => cents(line.quantity * line.price) - cents(line.discount),
  );
  const subtotal = amounts.reduce((sum, value) => sum + value, 0),
    discount = cents(orderDiscount);
  if (!lines.length)
    return { error: "購物車尚無商品。", subtotal: 0, total: 0, priced: [] };
  if (
    lines.some(
      (line) =>
        !Number.isFinite(line.quantity) ||
        line.quantity <= 0 ||
        qty(line.quantity) !== line.quantity ||
        !Number.isFinite(line.price) ||
        line.price < 0 ||
        Math.abs(line.price - cents(line.price) / 100) > 1e-8 ||
        !Number.isFinite(line.discount) ||
        line.discount < 0 ||
        Math.abs(line.discount - cents(line.discount) / 100) > 1e-8,
    ) ||
    amounts.some((value) => value < 0)
  )
    return {
      error:
        "數量須大於零且最多三位小數，金額最多兩位小數、須非負數，折扣不可超過明細金額。",
      subtotal: 0,
      total: 0,
      priced: [],
    };
  if (
    !Number.isFinite(orderDiscount) ||
    discount < 0 ||
    discount > subtotal ||
    Math.abs(orderDiscount - discount / 100) > 1e-8
  )
    return {
      error: "整單折扣不可超過商品小計或小於零。",
      subtotal: subtotal / 100,
      total: 0,
      priced: [],
    };
  const shares = amounts.map((amount) =>
    subtotal ? Math.floor((discount * amount) / subtotal) : 0,
  );
  let remainder = discount - shares.reduce((sum, share) => sum + share, 0);
  const order = amounts
    .map((amount, index) => ({
      index,
      fraction: subtotal ? (discount * amount) / subtotal - shares[index] : 0,
    }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (const { index } of order) {
    if (remainder-- <= 0) break;
    shares[index]++;
  }
  return {
    error: "",
    subtotal: subtotal / 100,
    total: (subtotal - discount) / 100,
    priced: lines.map((line, index) => ({
      ...line,
      orderShare: shares[index] / 100,
      net: (amounts[index] - shares[index]) / 100,
    })),
  };
}
export function allocate(
  batches: InventoryBatch[],
  item: Item,
  warehouse: string,
  quantity: number,
  preferred = "",
): Allocation[] | null {
  const candidates = batches
    .filter(
      (batch) =>
        batch.itemId === item.id &&
        batch.warehouse === warehouse &&
        available(batch) > 0 &&
        (!preferred || preferred === batch.id),
    )
    .sort(
      (a, b) =>
        (a.expiryDate || "9999").localeCompare(b.expiryDate || "9999") ||
        a.id.localeCompare(b.id),
    );
  let remaining = quantity;
  const allocations: Allocation[] = [];
  for (const batch of candidates) {
    const taken = qty(Math.min(available(batch), remaining));
    if (taken > 0)
      allocations.push({
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        expiry: batch.expiryDate,
        quantity: taken,
        estimatedCost: Number(item.referenceCost) || 0,
      });
    remaining = qty(remaining - taken);
  }
  return remaining > 0 ? null : allocations;
}
export function eligible(item: Item, policy: PosPolicy) {
  if (usageStatus(item) !== "使用中") return "品項未啟用或不在使用期間";
  if (!policy.sellable) return "未開放 POS 銷售";
  return "";
}
export function returnedQuantity(sale: Sale, lineId: string) {
  return qty(
    sale.returns
      .flatMap((record) => record.lines)
      .filter((line) => line.lineId === lineId)
      .reduce((sum, line) => sum + line.quantity, 0),
  );
}
export function returnAmount(sale: Sale, line: SaleLine, quantity: number) {
  const previous = returnedQuantity(sale, line.id);
  return (
    (Math.round((cents(line.net) * qty(previous + quantity)) / line.quantity) -
      Math.round((cents(line.net) * previous) / line.quantity)) /
    100
  );
}
export function refunded(sale: Sale) {
  return sale.refunds
    .filter((refund) => refund.status === "已退款")
    .reduce((sum, refund) => sum + refund.amount, 0);
}
export function saleStatus(sale: Sale) {
  if (sale.void) return "作廢";
  const returned = sale.lines.reduce(
    (sum, line) => sum + returnedQuantity(sale, line.id),
    0,
  );
  if (!returned) return "完成";
  return sale.lines.every(
    (line) => returnedQuantity(sale, line.id) >= line.quantity,
  )
    ? "全部退貨"
    : "部分退貨";
}
export function createPosSeed(): PosState {
  const seed = createItemsSeed();
  const state: PosState = {
    policies: Object.fromEntries(
      seed.items.map((item) => [item.id, policyFor(item)]),
    ),
    batches: seed.batches.map((batch) => ({ ...batch })),
    sales: [],
    movements: [],
  };
  state.batches = state.batches.flatMap((batch) =>
    batch.warehouse === "主倉庫" && batch.quantity >= 8
      ? [
          { ...batch, quantity: Math.floor(batch.quantity * 0.4) },
          {
            ...batch,
            id: `${batch.id}-B`,
            batchNumber: `${batch.batchNumber}-B`,
            quantity: batch.quantity - Math.floor(batch.quantity * 0.4),
            expiryDate: relativeDate(270),
          },
        ]
      : [batch],
  );
  const item = seed.items.find((entry) => entry.code === "OTC0001")!;
  // Keep one explicit expired-only product scenario in the isolated POS ledger.
  const expiredItem = seed.items.find((entry) => entry.code === "OTC0003")!;
  state.batches
    .filter((batch) => batch.itemId === expiredItem.id)
    .forEach((batch) => {
      batch.expiryDate = relativeDate(-1);
    });
  for (let index = 0; index < 8; index++) {
    const line: SaleLine = {
      id: `SEEDLINE${index}`,
      itemId: item.id,
      code: item.code,
      name: item.name,
      specification: item.specification,
      category: item.category,
      unit: item.unit,
      medicine: false,
      quantity: 2,
      originalPrice: Number(item.suggestedPrice),
      price: Number(item.suggestedPrice),
      discount: 10,
      orderShare: 20,
      net: Number(item.suggestedPrice) * 2 - 30,
      allocations: [
        {
          batchId: `HISTORICAL-${index}`,
          batchNumber: `POS-H${index}`,
          expiry: relativeDate(180),
          quantity: 2,
          estimatedCost: Number(item.referenceCost),
        },
      ],
    };
    const sale: Sale = {
      id: `SALE-SEED${index}`,
      requestId: `SEED-REQ${index}`,
      number: `SO${taipeiToday().replaceAll("-", "")}-${String(index + 1).padStart(4, "0")}`,
      date: `${relativeDate(-index)} 10:00:00`,
      warehouse: "主倉庫",
      seller: "示範商行",
      customer: index % 2 ? customers[0] : walkIn,
      cashier: index % 2 ? "王小明" : "李小姐",
      lines: [line],
      subtotal: line.net + 20,
      orderDiscount: 20,
      total: line.net,
      payment: {
        method: paymentMethods[index % 4],
        received: line.net,
        change: 0,
        reference: index ? `PAY-DEMO${index}` : "",
        confirmed: true,
      },
      receiptType: "一般銷售憑證",
      invoiceStatus: "未開立（未串接）",
      remark: "歷史展示資料；批次是當時快照。",
      authorization: "主管（展示）",
      returns: [],
      refunds: [],
      void: null,
    };
    // Seed history represents earlier transactions and does not subtract current seed stock again.
    if (index === 1 || index === 2) {
      const amount = returnAmount(sale, line, index === 1 ? 1 : 2);
      sale.returns.push({
        id: `RET-SEED${index}`,
        date: sale.date,
        reason: "展示退貨",
        actor: "王小明",
        method: "現金",
        lines: [
          {
            lineId: line.id,
            quantity: index === 1 ? 1 : 2,
            refund: amount,
            disposition: "不可售",
            allocations: [],
          },
        ],
      });
      sale.refunds.push({
        id: `REF-SEED${index}`,
        sourceId: `RET-SEED${index}`,
        amount,
        method: "現金",
        status: index === 1 ? "待退款" : "已退款",
        reference: index === 1 ? "" : "DEMO-REF",
        actor: index === 1 ? "" : "財務（展示）",
        confirmedAt: index === 1 ? "" : sale.date,
      });
    }
    if (index === 3) {
      sale.void = {
        reason: "重複輸入，未交付",
        date: sale.date,
        actor: "主管（展示）",
      };
      sale.refunds.push({
        id: "REF-VOID-SEED",
        sourceId: "VOID-SALE-SEED3",
        amount: sale.total,
        method: "信用卡",
        status: "待退款",
        reference: "",
        actor: "",
        confirmedAt: "",
      });
    }
    state.sales.push(sale);
  }
  return state;
}
