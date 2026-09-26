import { describe, expect, it } from "vitest";

import { canPay, checkCash } from "./payment";

describe("cash check", () => {
  it("gives the change when the cash covers the total", () => {
    expect(checkCash(135000, 500000)).toEqual({
      status: "covered",
      change: 365000,
    });
    expect(checkCash(135000, 135000)).toEqual({ status: "covered", change: 0 });
  });

  it("says how much is still to collect", () => {
    expect(checkCash(135000, 100000)).toEqual({
      status: "short",
      missing: 35000,
    });
  });
});

describe("canPay", () => {
  it("needs items on the bill", () => {
    expect(canPay(0, "card", 0, null)).toBe(false);
  });

  it("needs cash that covers the total", () => {
    expect(canPay(3, "cash", 135000, null)).toBe(false);
    expect(canPay(3, "cash", 135000, 134999)).toBe(false);
    expect(canPay(3, "cash", 135000, 135000)).toBe(true);
  });

  it("lets card and wallet pay at once", () => {
    expect(canPay(3, "card", 135000, null)).toBe(true);
    expect(canPay(3, "wallet", 135000, 0)).toBe(true);
  });
});
