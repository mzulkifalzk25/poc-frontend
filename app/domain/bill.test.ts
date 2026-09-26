import { describe, expect, it } from "vitest";

import {
  addProduct,
  billTotals,
  changeQuantity,
  MAX_LINE_QTY,
  removeLine,
  setQuantity,
  type DraftLine,
  type ScannedProduct,
} from "./bill";

const soap: ScannedProduct = {
  productId: 8,
  barcode: "8961008900088",
  name: "Soap",
  unitPrice: "50.00",
};
const milk: ScannedProduct = {
  productId: 4,
  barcode: "8961004500044",
  name: "Fresh Milk 1L",
  unitPrice: "290.00",
};
const noTax = { taxRate: "0.00", pricesIncludeTax: false };

function scanned(...products: ScannedProduct[]): DraftLine[] {
  return products.reduce<DraftLine[]>(addProduct, []);
}

describe("one row per product", () => {
  it("adds 1 to the same row when a product is scanned again", () => {
    const lines = scanned(soap, milk, soap, soap, soap, soap);

    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ productId: 8, qty: 5 });
    expect(billTotals(lines, noTax)).toMatchObject({
      itemCount: 6,
      subtotal: 25000 + 29000,
    });
  });

  it("keeps the scanned price when the same product is scanned at a new price", () => {
    const lines = addProduct(scanned(soap), { ...soap, unitPrice: "55.00" });

    expect(lines).toEqual([{ ...soap, qty: 2 }]);
  });
});

describe("quantities", () => {
  it("sets a typed quantity and caps it", () => {
    expect(setQuantity(scanned(soap), 8, 12)[0]?.qty).toBe(12);
    expect(setQuantity(scanned(soap), 8, 100000)[0]?.qty).toBe(MAX_LINE_QTY);
    expect(setQuantity(scanned(soap), 8, 2.7)[0]?.qty).toBe(2);
  });

  it("removes the row at zero, below zero or on a bad number", () => {
    expect(setQuantity(scanned(soap, milk), 8, 0)).toHaveLength(1);
    expect(setQuantity(scanned(soap), 8, Number.NaN)).toEqual([]);
    expect(changeQuantity(scanned(soap), 8, -1)).toEqual([]);
  });

  it("changes by plus and minus", () => {
    expect(changeQuantity(scanned(soap), 8, 1)[0]?.qty).toBe(2);
    expect(changeQuantity(scanned(soap), 99, 1)).toEqual(scanned(soap));
  });

  it("removes a row", () => {
    expect(removeLine(scanned(soap, milk), 8)).toEqual([{ ...milk, qty: 1 }]);
  });
});

describe("billTotals", () => {
  it("is empty for an empty bill", () => {
    expect(billTotals([], noTax)).toEqual({
      itemCount: 0,
      subtotal: 0,
      tax: 0,
      rounding: 0,
      total: 0,
    });
  });

  it("rounds the total to whole rupees and keeps the difference", () => {
    const lines = scanned(
      { ...soap, unitPrice: "49.75" },
      { ...milk, unitPrice: "100.50" },
    );

    expect(billTotals(lines, noTax)).toEqual({
      itemCount: 2,
      subtotal: 15025,
      tax: 0,
      rounding: -25,
      total: 15000,
    });
  });

  it("adds tax on top when prices exclude tax", () => {
    const lines = setQuantity(scanned(soap), 8, 3);

    expect(
      billTotals(lines, { taxRate: "17.00", pricesIncludeTax: false }),
    ).toEqual({
      itemCount: 3,
      subtotal: 15000,
      tax: 2550,
      rounding: 50,
      total: 17600,
    });
  });

  it("shows the tax inside the price when prices include tax", () => {
    const lines = scanned({ ...soap, unitPrice: "117.00" });

    expect(
      billTotals(lines, { taxRate: "17.00", pricesIncludeTax: true }),
    ).toEqual({
      itemCount: 1,
      subtotal: 11700,
      tax: 1700,
      rounding: 0,
      total: 11700,
    });
  });
});
