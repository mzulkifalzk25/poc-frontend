import { describe, expect, it } from "vitest";

import { formatChange, paymentShares, type MoneyPeriod } from "./report";

const totals: MoneyPeriod = {
  period: "",
  salesTotal: "1000",
  salesCash: "400",
  salesCard: "360",
  salesWallet: "240",
  refundsTotal: "0",
  refundsCount: 0,
  stockBought: "0",
  net: "1000",
  grossProfit: "0",
};

describe("paymentShares", () => {
  it("splits sales by payment method", () => {
    expect(paymentShares(totals)).toEqual([
      { method: "cash", amount: 400, share: 40 },
      { method: "card", amount: 360, share: 36 },
      { method: "wallet", amount: 240, share: 24 },
    ]);
  });

  it("is all zeros when nothing was sold", () => {
    const empty = {
      ...totals,
      salesCash: "0",
      salesCard: "0",
      salesWallet: "0",
    };

    expect(paymentShares(empty).map((s) => s.share)).toEqual([0, 0, 0]);
  });
});

describe("formatChange", () => {
  it("shows the direction and one decimal", () => {
    expect(formatChange("6.2")).toBe("+6.2%");
    expect(formatChange("-3")).toBe("-3.0%");
    expect(formatChange("0.0")).toBe("0.0%");
    expect(formatChange(null)).toBeNull();
  });
});
