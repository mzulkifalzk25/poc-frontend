import { describe, expect, it } from "vitest";

import { isValidTaxRate } from "./store-settings";

describe("store settings rules", () => {
  it("accepts a percent from 0 to 100 with up to two decimals", () => {
    expect(isValidTaxRate("0")).toBe(true);
    expect(isValidTaxRate("17.5")).toBe(true);
    expect(isValidTaxRate(" 100.00 ")).toBe(true);
  });

  it("refuses anything else", () => {
    for (const text of ["", "-1", "100.01", "1.234", "abc", "0.17%"]) {
      expect(isValidTaxRate(text)).toBe(false);
    }
  });
});
