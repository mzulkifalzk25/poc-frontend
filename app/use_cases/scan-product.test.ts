import { describe, expect, it, vi } from "vitest";

import { scanProduct, type ScanDeps } from "./scan-product";

const oil = {
  id: 7,
  barcode: "8961002300022",
  name: "Cooking Oil 1L",
  price: "620.00",
};

function deps(overrides: Partial<ScanDeps> = {}): ScanDeps {
  return {
    findByBarcode: vi.fn((code: string) =>
      Promise.resolve(code === oil.barcode ? oil : null),
    ),
    getStock: () => Promise.resolve("0.000"),
    blockWhenOutOfStock: () => Promise.resolve(false),
    ...overrides,
  };
}

describe("scanProduct", () => {
  it("finds the product on this PC and keeps its price", async () => {
    await expect(scanProduct(deps(), " 8961002300022\n")).resolves.toEqual({
      status: "found",
      product: {
        productId: 7,
        barcode: "8961002300022",
        name: "Cooking Oil 1L",
        unitPrice: "620.00",
      },
    });
  });

  it("reports a barcode that is not in the catalogue", async () => {
    await expect(scanProduct(deps(), "8961099900123")).resolves.toEqual({
      status: "unknown",
      barcode: "8961099900123",
    });
  });

  it("ignores an empty scan", async () => {
    const scan = deps();

    await expect(scanProduct(scan, "  ")).resolves.toEqual({ status: "empty" });
    expect(scan.findByBarcode).not.toHaveBeenCalled();
  });

  it("sells below zero stock by default", async () => {
    await expect(scanProduct(deps(), oil.barcode)).resolves.toMatchObject({
      status: "found",
    });
  });

  it("blocks an out of stock item when the owner turned the setting on", async () => {
    const scan = deps({ blockWhenOutOfStock: () => Promise.resolve(true) });

    await expect(scanProduct(scan, oil.barcode)).resolves.toEqual({
      status: "out_of_stock",
      name: "Cooking Oil 1L",
    });
  });

  it("allows the sale when the stock is unknown on this PC", async () => {
    const scan = deps({
      blockWhenOutOfStock: () => Promise.resolve(true),
      getStock: () => Promise.resolve(null),
    });

    await expect(scanProduct(scan, oil.barcode)).resolves.toMatchObject({
      status: "found",
    });
  });
});
