import type { ProductCategoryRef, StockStatus } from "./product";

export type StockListFilter = "all" | "low" | "out";

export interface StockRow {
  id: number;
  name: string;
  barcode: string;
  unit: string;
  stock: string;
  lowStockAlert: string;
  status: StockStatus;
  category: ProductCategoryRef | null;
}

export interface StockSummary {
  unitsInStock: string;
  stockValue: string;
  lowCount: number;
  outCount: number;
}

export interface StockPage {
  count: number;
  results: StockRow[];
  summary: StockSummary;
}

export interface StockQuery {
  filter: StockListFilter;
  search: string;
  page: number;
}

export interface StockMovement {
  id: number;
  occurredAt: string;
  productName: string;
  qtyDelta: string;
  reason: string;
  userName: string | null;
}

// How full the level bar is: four times the alert level reads as full.
export function levelFraction(stock: string, lowStockAlert: string): number {
  const qty = Number(stock);
  const alert = Number(lowStockAlert);
  if (qty <= 0) {
    return 0;
  }
  const full = alert > 0 ? alert * 4 : Math.max(qty, 1);
  return Math.min(1, qty / full);
}

export function signedQuantity(value: string): string {
  const amount = Number(value);
  const text = Math.abs(amount).toLocaleString("en-US", {
    maximumFractionDigits: 3,
  });
  return `${amount < 0 ? "-" : "+"}${text}`;
}
