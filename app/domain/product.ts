export const PRODUCT_UNITS = ["pcs", "kg", "litre", "pack"] as const;
export type ProductUnit = (typeof PRODUCT_UNITS)[number];

export type StockStatus = "in_stock" | "low" | "out";
export type StockFilter = "all" | "low" | "out" | "archived";

export interface ProductCategoryRef {
  id: number;
  name: string;
  tint: string;
}

export interface ProductSummary {
  id: number;
  barcode: string;
  name: string;
  category: ProductCategoryRef | null;
  unit: string;
  price: string;
  cost: string | null;
  stock: string;
  status: StockStatus;
}

export interface ProductDetail extends ProductSummary {
  categoryId: number | null;
  lowStockAlert: string;
  isArchived: boolean;
}

export interface ProductPage {
  count: number;
  results: ProductSummary[];
}

export interface ProductQuery {
  search: string;
  categoryId: number | null;
  filter: StockFilter;
  page: number;
}

export interface PriceChange {
  when: string;
  who: string;
  oldPrice: string;
  newPrice: string;
}

export function isProductUnit(value: string): value is ProductUnit {
  return (PRODUCT_UNITS as readonly string[]).includes(value);
}

export function productInitials(name: string): string {
  return name.trim().substring(0, 2).toUpperCase();
}

export function formatQuantity(value: string): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    throw new Error(`Invalid quantity: ${value}`);
  }
  return amount.toLocaleString("en-US", { maximumFractionDigits: 3 });
}
