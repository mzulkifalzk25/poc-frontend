import { describe, expect, it } from "vitest";

import type { DraftLine } from "./bill";
import {
  defaultRestock,
  drawerEffect,
  priceReturnLine,
  returnTotals,
  type BillPrices,
} from "./return";

const oil: DraftLine = {
  productId: 2,
  barcode: "8961002300022",
  name: "Cooking Oil 1L",
  unitPrice: "620.00",
  qty: 1,
};
const eggs: DraftLine = {
  productId: 6,
  barcode: "8961006700066",
  name: "Eggs (dozen)",
  unitPrice: "420.00",
  qty: 2,
};
const noTax = { taxRate: "0.00", pricesIncludeTax: false };

const bill: BillPrices = {
  billNo: "001000498",
  prices: new Map([
    [2, { unitPrice: "600.00", returnableQty: 1 }],
    [6, { unitPrice: "420.00", returnableQty: 2 }],
  ]),
};

describe("refund price", () => {
  it("uses today's price without a bill", () => {
    expect(priceReturnLine(oil, null)).toMatchObject({
      unitPrice: "620.00",
      source: "today",
      changed: false,
      notOnBill: false,
    });
  });

  it("uses the price paid when the item is on the bill and marks a change", () => {
    expect(priceReturnLine(oil, bill)).toMatchObject({
      unitPrice: "600.00",
      todayPrice: "620.00",
      source: "paid",
      changed: true,
    });
    expect(priceReturnLine(eggs, bill)).toMatchObject({
      unitPrice: "420.00",
      source: "paid",
      changed: false,
    });
  });

  it("falls back to today's price for an item that is not on the bill", () => {
    const sugar: DraftLine = {
      productId: 5,
      barcode: "8961005600055",
      name: "Sugar 1kg",
      unitPrice: "180.00",
      qty: 1,
    };

    expect(priceReturnLine(sugar, bill)).toMatchObject({
      unitPrice: "180.00",
      source: "today",
      notOnBill: true,
    });
  });
});

describe("returnTotals", () => {
  it("adds the refund of every line", () => {
    expect(returnTotals([oil, eggs], null, noTax)).toMatchObject({
      itemCount: 3,
      refund: 146_000,
    });
    expect(returnTotals([oil, eggs], bill, noTax)).toMatchObject({
      itemCount: 3,
      refund: 144_000,
    });
  });

  it("refunds the tax too when prices exclude it, rounded like a bill", () => {
    expect(
      returnTotals([oil], null, { taxRate: "17.00", pricesIncludeTax: false })
        .refund,
    ).toBe(72_500);
  });
});

describe("restock and drawer", () => {
  it("puts goods back on the shelf unless damaged or expired", () => {
    expect(defaultRestock("changed_mind")).toBe(true);
    expect(defaultRestock("wrong_item")).toBe(true);
    expect(defaultRestock("price_error")).toBe(true);
    expect(defaultRestock("expired_damaged")).toBe(false);
  });

  it("takes only cash refunds out of the drawer", () => {
    expect(drawerEffect("cash", 57_000)).toBe(-57_000);
    expect(drawerEffect("card", 57_000)).toBe(0);
    expect(drawerEffect("wallet", 57_000)).toBe(0);
  });
});
