import { billTotals, type DraftLine, type TaxRule } from "./bill";
import type { PaymentMethod } from "./payment";

export const RETURN_REASONS = [
  "expired_damaged",
  "wrong_item",
  "changed_mind",
  "price_error",
] as const;
export type ReturnReason = (typeof RETURN_REASONS)[number];

export const DEFAULT_REASON: ReturnReason = "changed_mind";

// What the found bill says each product cost; returnable is null when unknown (this PC's own bill).
export interface PaidPrice {
  unitPrice: string;
  returnableQty: number | null;
}

export interface BillPrices {
  billNo: string;
  prices: Map<number, PaidPrice>;
}

export type PriceSource = "today" | "paid";

export interface PricedReturnLine extends DraftLine {
  todayPrice: string;
  source: PriceSource;
  changed: boolean;
  notOnBill: boolean;
}

// Refund at today's price, or at the price paid when the bill is known and the item is on it.
export function priceReturnLine(
  line: DraftLine,
  bill: BillPrices | null,
): PricedReturnLine {
  const paid = bill?.prices.get(line.productId);
  if (!paid) {
    return {
      ...line,
      todayPrice: line.unitPrice,
      source: "today",
      changed: false,
      notOnBill: bill !== null,
    };
  }
  return {
    ...line,
    unitPrice: paid.unitPrice,
    todayPrice: line.unitPrice,
    source: "paid",
    changed: Number(paid.unitPrice) !== Number(line.unitPrice),
    notOnBill: false,
  };
}

export interface ReturnTotals {
  lines: PricedReturnLine[];
  itemCount: number;
  refund: number;
}

// Same tax and whole-rupee rounding as a bill; the server recomputes and flags a difference.
export function returnTotals(
  lines: DraftLine[],
  bill: BillPrices | null,
  taxRule: TaxRule,
): ReturnTotals {
  const priced = lines.map((line) => priceReturnLine(line, bill));
  const totals = billTotals(priced, taxRule);
  return { lines: priced, itemCount: totals.itemCount, refund: totals.total };
}

// Damaged or expired goods do not go back on the shelf by default.
export function defaultRestock(reason: ReturnReason): boolean {
  return reason !== "expired_damaged";
}

// Only a cash refund comes out of the drawer; card and wallet are recorded only.
export function drawerEffect(method: PaymentMethod, refund: number): number {
  return method === "cash" ? -refund : 0;
}
