export interface StoreSettings {
  storeName: string;
  phone: string;
  address: string;
  taxRate: string;
  pricesIncludeTax: boolean;
  blockWhenOutOfStock: boolean;
  receiptPaperMm: number;
  receiptHeader: string;
  receiptFooter: string;
  receiptShowBarcode: boolean;
}

export const PAPER_WIDTHS = [58, 80] as const;

// Tax is a percent from 0 to 100 with at most two decimals, as the server stores it.
export function isValidTaxRate(text: string): boolean {
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(text.trim())) {
    return false;
  }
  return Number(text) <= 100;
}
