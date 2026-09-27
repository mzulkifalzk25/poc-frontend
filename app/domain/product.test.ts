import { describe, expect, it } from "vitest";

import {
  formatQuantity,
  isProductUnit,
  productInitials,
  stockLevel,
} from "./product";

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

  it("marks stock out at zero or below", () => {
    expect(stockLevel("0.000", "10.000")).toBe("out");
    expect(stockLevel("-2.000", "10.000")).toBe("out");
  });

  it("marks stock low above zero and at or under the alert", () => {
    expect(stockLevel("10.000", "10.000")).toBe("low");
    expect(stockLevel("10.500", "10.000")).toBe("in_stock");
  });

  it("never marks stock low without an alert level", () => {
    expect(stockLevel("1.000", null)).toBe("in_stock");
    expect(stockLevel("1.000", "0.000")).toBe("in_stock");
  });
});
