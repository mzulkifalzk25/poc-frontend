// One row per product on a bill; money and quantities are API strings.
export interface BillLine {
  productId: number;
  barcode: string;
  name: string;
  qty: string;
  unitPrice: string;
}
