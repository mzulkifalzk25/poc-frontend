import { describe, expect, it } from "vitest";

import {
  addScanned,
  costChange,
  costRiseCount,
  deliverySummary,
  todayIn,
  validateDelivery,
  type DeliveryLine,
} from "./delivery";

function line(over: Partial<DeliveryLine> = {}): DeliveryLine {
  return {
    productId: 1,
    name: "Cooking Oil 1L",
    barcode: "8961002300022",
    qty: "60",
    unitCost: "585",
    lastCost: "570",
    ...over,
  };
}

describe("costChange", () => {
  it("compares with the last cost paid", () => {
    expect(costChange("585", "570")).toEqual({ kind: "higher", diff: 15 });
    expect(costChange("560", "570")).toEqual({ kind: "lower", diff: 10 });
    expect(costChange("570", "570")).toEqual({ kind: "same" });
  });

  it("calls a first delivery new, never a rise", () => {
    expect(costChange("100", "0")).toEqual({ kind: "new" });
  });
});

describe("deliverySummary", () => {
  it("counts lines, units and the total cost", () => {
    const lines = [
      line(),
      line({ productId: 2, qty: "30", unitCost: "375.50" }),
    ];

    expect(deliverySummary(lines)).toEqual({
      lines: 2,
      units: 90,
      total: 46365,
    });
    expect(costRiseCount(lines)).toBe(1);
  });
});

describe("addScanned", () => {
  const product = { id: 1, name: "Oil", barcode: "896", cost: "570.00" };

  it("starts a line with one unit at the last cost", () => {
    expect(addScanned([], product)).toEqual([
      {
        productId: 1,
        name: "Oil",
        barcode: "896",
        qty: "1",
        unitCost: "570",
        lastCost: "570.00",
      },
    ]);
  });

  it("adds one more unit when the same product is scanned again", () => {
    const once = addScanned([], product);

    expect(addScanned(once, product)[0]?.qty).toBe("2");
  });
});

describe("validateDelivery", () => {
  const draft = {
    supplierId: 3,
    invoiceNo: " INV-1 ",
    deliveryDate: "2026-09-19",
    lines: [line()],
  };

  it("builds the payload", () => {
    expect(validateDelivery(draft)).toEqual({
      ok: true,
      payload: {
        supplierId: 3,
        invoiceNo: "INV-1",
        deliveryDate: "2026-09-19",
        lines: [{ productId: 1, qty: "60.000", unitCost: "585.00" }],
      },
    });
  });

  it("needs a supplier, a date and at least one good line", () => {
    expect(validateDelivery({ ...draft, supplierId: null })).toEqual({
      ok: false,
      error: "no_supplier",
    });
    expect(validateDelivery({ ...draft, deliveryDate: "" })).toEqual({
      ok: false,
      error: "no_date",
    });
    expect(validateDelivery({ ...draft, lines: [] })).toEqual({
      ok: false,
      error: "no_lines",
    });
    expect(validateDelivery({ ...draft, lines: [line({ qty: "0" })] })).toEqual(
      { ok: false, error: "bad_line" },
    );
    expect(
      validateDelivery({ ...draft, lines: [line({ unitCost: "x" })] }),
    ).toEqual({ ok: false, error: "bad_line" });
  });
});

describe("todayIn", () => {
  it("is the date in the store's time zone", () => {
    const instant = new Date("2026-09-19T20:00:00Z");

    expect(todayIn("Asia/Karachi", instant)).toBe("2026-09-20");
    expect(todayIn("UTC", instant)).toBe("2026-09-19");
  });
});
