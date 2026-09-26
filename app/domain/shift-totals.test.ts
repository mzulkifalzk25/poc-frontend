import { describe, expect, it } from "vitest";

import { checkDrawer, expectedCash, shiftTotals } from "./shift-totals";

describe("shift totals", () => {
  it("adds up bills by payment method", () => {
    const totals = shiftTotals(
      [
        { method: "cash", total: 26_648_000 },
        { method: "card", total: 24_132_000 },
        { method: "wallet", total: 14_214_000 },
      ],
      [],
    );

    expect(totals).toMatchObject({
      bills: 3,
      totalSales: 64_994_000,
      byMethod: { cash: 26_648_000, card: 24_132_000, wallet: 14_214_000 },
      refundCount: 0,
      cashRefunds: 0,
    });
  });

  it("counts every refund but only takes cash refunds out of the drawer", () => {
    const totals = shiftTotals(
      [{ method: "cash", total: 26_648_000 }],
      [
        { amount: 100_000, paidFromDrawer: true },
        { amount: 191_000, paidFromDrawer: true },
        { amount: 50_000, paidFromDrawer: false },
      ],
    );

    expect(totals).toMatchObject({
      refundCount: 3,
      refundAmount: 341_000,
      cashRefundCount: 2,
      cashRefunds: 291_000,
    });
  });

  it("matches the design: 5,000 + 266,480 − 2,910 = 268,570 expected", () => {
    const totals = shiftTotals(
      [{ method: "cash", total: 26_648_000 }],
      [{ amount: 291_000, paidFromDrawer: true }],
    );

    expect(expectedCash(500_000, totals)).toBe(26_857_000);
  });

  it("is empty for a shift without sales", () => {
    const totals = shiftTotals([], []);

    expect(totals.bills).toBe(0);
    expect(expectedCash(500_000, totals)).toBe(500_000);
  });
});

describe("checkDrawer", () => {
  it("is balanced when the count matches", () => {
    expect(checkDrawer(26_857_000, 26_857_000)).toEqual({
      status: "balanced",
      difference: 0,
    });
  });

  it("reports cash over or short", () => {
    expect(checkDrawer(26_872_000, 26_857_000)).toEqual({
      status: "over",
      difference: 15_000,
    });
    expect(checkDrawer(26_842_000, 26_857_000)).toEqual({
      status: "short",
      difference: 15_000,
    });
  });
});
