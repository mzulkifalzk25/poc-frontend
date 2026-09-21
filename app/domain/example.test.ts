import { describe, expect, it } from "vitest";

import { isPositiveInteger } from "./example";

describe("isPositiveInteger", () => {
  it("accepts a positive integer", () => {
    expect(isPositiveInteger(3)).toBe(true);
  });

  it("rejects zero, negatives and decimals", () => {
    expect(isPositiveInteger(0)).toBe(false);
    expect(isPositiveInteger(-1)).toBe(false);
    expect(isPositiveInteger(1.5)).toBe(false);
  });
});
