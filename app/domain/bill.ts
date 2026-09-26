import { roundToRupee, toPaisa } from "./paisa";

export const MAX_LINE_QTY = 9999;

export interface ScannedProduct {
  productId: number;
  barcode: string;
  name: string;
  unitPrice: string;
}

// A line keeps the price it was scanned at, even if the catalogue changes later.
export interface DraftLine extends ScannedProduct {
  qty: number;
}

export interface TaxRule {
  taxRate: string;
  pricesIncludeTax: boolean;
}

export interface BillTotals {
  itemCount: number;
  subtotal: number;
  tax: number;
  rounding: number;
  total: number;
}

// Scanning a product already on the bill adds 1 to that row; never a second row.
export function addProduct(
  lines: DraftLine[],
  product: ScannedProduct,
): DraftLine[] {
  const existing = lines.find((line) => line.productId === product.productId);
  if (!existing) {
    return [...lines, { ...product, qty: 1 }];
  }
  return setQuantity(lines, product.productId, existing.qty + 1);
}

// Zero or less removes the row; the typed quantity is capped.
export function setQuantity(
  lines: DraftLine[],
  productId: number,
  qty: number,
): DraftLine[] {
  const next = Math.min(Math.floor(qty), MAX_LINE_QTY);
  if (!Number.isFinite(next) || next <= 0) {
    return removeLine(lines, productId);
  }
  return lines.map((line) =>
    line.productId === productId ? { ...line, qty: next } : line,
  );
}

export function changeQuantity(
  lines: DraftLine[],
  productId: number,
  delta: number,
): DraftLine[] {
  const line = lines.find((item) => item.productId === productId);
  return line ? setQuantity(lines, productId, line.qty + delta) : lines;
}

export function removeLine(lines: DraftLine[], productId: number): DraftLine[] {
  return lines.filter((line) => line.productId !== productId);
}

export function lineTotal(line: DraftLine): number {
  return toPaisa(line.unitPrice) * line.qty;
}

function taxOf(subtotal: number, rule: TaxRule): number {
  const rate = Number(rule.taxRate);
  if (!Number.isFinite(rate) || rate <= 0) {
    return 0;
  }
  return Math.round(
    rule.pricesIncludeTax
      ? (subtotal * rate) / (100 + rate)
      : (subtotal * rate) / 100,
  );
}

// All amounts in paisa. Tax is inside the price or added on top; the total is whole rupees.
export function billTotals(lines: DraftLine[], rule: TaxRule): BillTotals {
  const subtotal = lines.reduce((sum, line) => sum + lineTotal(line), 0);
  const tax = taxOf(subtotal, rule);
  const gross = rule.pricesIncludeTax ? subtotal : subtotal + tax;
  const total = roundToRupee(gross);
  return {
    itemCount: lines.reduce((sum, line) => sum + line.qty, 0),
    subtotal,
    tax,
    rounding: total - gross,
    total,
  };
}
