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
