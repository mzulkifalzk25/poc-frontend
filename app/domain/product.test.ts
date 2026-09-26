import { describe, expect, it } from "vitest";

import { formatQuantity, isProductUnit, productInitials } from "./product";

describe("product rules", () => {
  it("uses the first two letters as the row tile", () => {
    expect(productInitials(" basmati Rice 5kg")).toBe("BA");
  });

  it("knows the four units", () => {
    expect(isProductUnit("litre")).toBe(true);
    expect(isProductUnit("box")).toBe(false);
  });

  it("drops trailing zeros from quantities", () => {
    expect(formatQuantity("84.000")).toBe("84");
    expect(formatQuantity("2.500")).toBe("2.5");
    expect(formatQuantity("-3.000")).toBe("-3");
    expect(formatQuantity("1250.000")).toBe("1,250");
  });

  it("rejects a quantity that is not a number", () => {
    expect(() => formatQuantity("n/a")).toThrow();
  });
});
