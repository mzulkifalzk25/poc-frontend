import { cleanBarcode } from "~/domain/barcode";
import type { ScannedProduct } from "~/domain/bill";

export interface LocalProduct {
  id: number;
  barcode: string;
  name: string;
  price: string;
}

export interface ScanDeps {
  findByBarcode: (barcode: string) => Promise<LocalProduct | null>;
  getStock: (productId: number) => Promise<string | null>;
  blockWhenOutOfStock: () => Promise<boolean>;
}

export type ScanResult =
  | { status: "found"; product: ScannedProduct }
  | { status: "unknown"; barcode: string }
  | { status: "out_of_stock"; name: string }
  | { status: "empty" };

// Barcode lookup reads this PC's database only, never the network.
export async function scanProduct(
  deps: ScanDeps,
  raw: string,
): Promise<ScanResult> {
  const barcode = cleanBarcode(raw);
  if (barcode === "") {
    return { status: "empty" };
  }
  const product = await deps.findByBarcode(barcode);
  if (!product) {
    return { status: "unknown", barcode };
  }
  if (await deps.blockWhenOutOfStock()) {
    const qty = await deps.getStock(product.id);
    if (qty !== null && Number(qty) <= 0) {
      return { status: "out_of_stock", name: product.name };
    }
  }
  return {
    status: "found",
    product: {
      productId: product.id,
      barcode: product.barcode,
      name: product.name,
      unitPrice: product.price,
    },
  };
}
