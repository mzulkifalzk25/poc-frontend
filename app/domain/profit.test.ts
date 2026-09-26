import { describe, expect, it } from "vitest";

import { profitPerUnit } from "./profit";

describe("profitPerUnit", () => {
  it("matches the design example for cooking oil", () => {
    expect(profitPerUnit("620", "570")).toEqual({
      profit: 50,
      marginPercent: 8.1,
    });
  });

  it("keeps paisa in the profit", () => {
    expect(profitPerUnit("100.50", "80.25")).toEqual({
      profit: 20.25,
      marginPercent: 20.1,
    });
  });

  it("shows a loss as a negative profit and margin", () => {
    expect(profitPerUnit("180", "200")).toEqual({
      profit: -20,
      marginPercent: -11.1,
    });
  });

  it("has no margin when the price is zero", () => {
    expect(profitPerUnit("0", "50")).toEqual({
      profit: -50,
      marginPercent: null,
    });
  });

  it("rejects values that are not numbers", () => {
    expect(() => profitPerUnit("abc", "1")).toThrow();
  });
});
