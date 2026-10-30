import type {
  PosPolicy,
  CartLine,
  Allocation,
  SaleLine,
  Customer,
  Sale,
  PosState,
  SaleAction,
  SaleReturn,
} from "@/types/pos";
import {
  available,
  createItemsSeed,
  relativeDate,
  taipeiToday,
  usageStatus,
} from "@/features/items/model";
import type { InventoryBatch, Item } from "@/types/items";
export const paymentMethods = ["現金", "刷卡", "銀行轉帳", "電子支付"] as const;

export const customers: Customer[] = [
  { id: "C001", name: "陳小美（展示）", phone: "0900-000-001" },
  { id: "C002", name: "林大明（展示）", phone: "0900-000-002" },
  { id: "C003", name: "王小姐（展示）", phone: "0900-000-003" },
];
export const walkIn: Customer = { id: "", name: "一般顧客", phone: "" };

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
export function percentageDiscount(subtotal: number, percent: number) {
  if (
    !Number.isFinite(percent) ||
    percent < 0 ||
    percent > 100 ||
    Math.abs(percent * 100 - Math.round(percent * 100)) > 1e-8
  ) {
    return {
      amount: 0,
      error: "整單折扣百分比須介於 0% 至 100%，最多小數兩位。",
    };
  }
  return {
    amount:
      Math.round((cents(subtotal) * Math.round(percent * 100)) / 10000) / 100,
    error: "",
  };
}
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
export function pendingRefund(sale: Sale) {
  return (
    sale.refunds
      .filter((refund) => refund.status === "待退款")
      .reduce((sum, refund) => sum + cents(refund.amount), 0) / 100
  );
}

export function refundStatus(sale: Sale) {
  if (!sale.refunds.length) return "無須退款";
  if (pendingRefund(sale) > 0)
    return refunded(sale) > 0 ? "部分已退款" : "待退款";
  return "已退款";
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
export function saleActionReason(
  sale: Sale,
  action: SaleAction,
  authorized: boolean,
) {
  if (!authorized) return "需主管／財務權限";
  if (action === "refund")
    return sale.refunds.some((refund) => refund.status === "待退款")
      ? ""
      : "無待退款紀錄";
  if (sale.void) return "此交易已作廢";
  if (action === "void" && sale.returns.length) return "已有退貨紀錄，無法作廢";
  if (action === "return" && saleStatus(sale) === "全部退貨")
    return "商品已全部退貨";
  return "";
}
export function saleReturnAmount(record: SaleReturn) {
  return record.lines.reduce((sum, line) => sum + cents(line.refund), 0) / 100;
}
export function saleReturnRefunded(sale: Sale, record: SaleReturn) {
  return (
    sale.refunds
      .filter(
        (refund) => refund.sourceId === record.id && refund.status === "已退款",
      )
      .reduce((sum, refund) => sum + cents(refund.amount), 0) / 100
  );
}
export function saleReturnPending(sale: Sale, record: SaleReturn) {
  return (
    sale.refunds
      .filter(
        (refund) => refund.sourceId === record.id && refund.status === "待退款",
      )
      .reduce((sum, refund) => sum + cents(refund.amount), 0) / 100
  );
}
export function saleReturnRefundStatus(sale: Sale, record: SaleReturn) {
  if (saleReturnAmount(record) === 0) return "無須退款";
  if (saleReturnPending(sale, record) > 0)
    return saleReturnRefunded(sale, record) > 0 ? "部分已退款" : "待退款";
  return saleReturnRefunded(sale, record) >= saleReturnAmount(record)
    ? "已退款"
    : "待退款";
}
export function nextSaleReturnNumber(
  sales: readonly Sale[],
  date = taipeiToday(),
) {
  const prefix = `SR${date.replaceAll("-", "")}-`;
  let sequence = 0;
  for (const sale of sales)
    for (const record of sale.returns) {
      if (!record.number?.startsWith(prefix)) continue;
      const suffix = record.number.slice(prefix.length);
      if (/^\d+$/.test(suffix)) sequence = Math.max(sequence, Number(suffix));
    }
  return `${prefix}${String(sequence + 1).padStart(4, "0")}`;
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
      sellerTaxId: "",
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
      invoiceStatus: "不開立",
      remark: "",
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
        number: `SR${sale.date.slice(0, 10).replaceAll("-", "")}-0001`,
        saleId: sale.id,
        createdAt: sale.date,
        date: sale.date.slice(0, 10),
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
        method: "刷卡",
        status: "待退款",
        reference: "",
        actor: "",
        confirmedAt: "",
      });
    }
    state.sales.push(sale);
    // 已售出的展示批次保留零庫存，供退貨與作廢追溯；不增加初始可售量。
    for (const allocation of line.allocations) {
      state.batches.push({
        id: allocation.batchId,
        itemId: item.id,
        warehouse: sale.warehouse,
        batchNumber: allocation.batchNumber,
        expiryDate: allocation.expiry,
        quantity: 0,
        unavailable: 0,
        receivedAt: sale.date.slice(0, 10),
      });
    }
  }
  return state;
}
