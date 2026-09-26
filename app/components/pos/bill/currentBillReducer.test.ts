import { describe, expect, it } from "vitest";

import { currentBillReducer, EMPTY_BILL } from "./currentBillReducer";

const soap = {
  productId: 8,
  barcode: "8961008900088",
  name: "Soap",
  unitPrice: "50.00",
};
const milk = {
  productId: 4,
  barcode: "8961004500044",
  name: "Milk",
  unitPrice: "290.00",
};

describe("currentBillReducer", () => {
  it("adds scans to one row per product and marks the last scanned row", () => {
    let state = currentBillReducer(EMPTY_BILL, { type: "add", product: soap });
    state = currentBillReducer(state, { type: "add", product: milk });
    state = currentBillReducer(state, { type: "add", product: soap });

    expect(state.lines.map((line) => [line.productId, line.qty])).toEqual([
      [8, 2],
      [4, 1],
    ]);
    expect(state.lastProductId).toBe(8);
  });

  it("types, steps and removes quantities", () => {
    let state = currentBillReducer(EMPTY_BILL, { type: "add", product: soap });
    state = currentBillReducer(state, { type: "setQty", productId: 8, qty: 5 });
    state = currentBillReducer(state, {
      type: "change",
      productId: 8,
      delta: -1,
    });
    expect(state.lines[0]?.qty).toBe(4);

    state = currentBillReducer(state, { type: "remove", productId: 8 });
    expect(state.lines).toEqual([]);
  });

  it("replaces the bill with recalled lines and clears it", () => {
    const recalled = currentBillReducer(EMPTY_BILL, {
      type: "replace",
      lines: [{ ...milk, qty: 3 }],
    });
    expect(recalled).toEqual({
      lines: [{ ...milk, qty: 3 }],
      lastProductId: null,
    });

    expect(currentBillReducer(recalled, { type: "clear" })).toEqual(EMPTY_BILL);
  });
});
