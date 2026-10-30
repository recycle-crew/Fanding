import type { Purchase, PurchaseLine } from "@/types/purchases";

const quantity = (value: number) => Math.round(value * 1000) / 1000;

export function lineMovements(order: Purchase, line: PurchaseLine) {
  let remaining = line.quantity;
  let returned = 0;
  let reversed = 0;
  let corrected = 0;
  const entries = order.records
    .flatMap((record, sequence) =>
      record.lines
        .filter((entry) => entry.lineId === line.id)
        .map((entry, index) => ({ record, entry, sequence, index })),
    )
    .sort(
      (a, b) =>
        new Date(a.record.createdAt || a.record.date).getTime() -
          new Date(b.record.createdAt || b.record.date).getTime() ||
        a.sequence - b.sequence ||
        a.index - b.index,
    )
    .map(({ record, entry, index }) => {
      remaining = quantity(remaining + entry.quantityChange);
      if (record.kind === "return") returned += -entry.quantityChange;
      if (record.kind === "reversal") reversed += -entry.quantityChange;
      if (record.kind === "correction") corrected += entry.quantityChange;
      return { record, entry, index, remaining: Math.max(0, remaining) };
    });
  return {
    entries,
    returned: quantity(returned),
    reversed: quantity(reversed),
    corrected: quantity(corrected),
    remaining: Math.max(0, quantity(remaining)),
  };
}
