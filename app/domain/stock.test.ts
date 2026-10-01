import { describe, expect, it } from "vitest";

import { levelFraction, signedQuantity } from "./stock";

describe("levelFraction", () => {
  it("is empty at zero or below", () => {
    expect(levelFraction("0", "10")).toBe(0);
    expect(levelFraction("-3", "10")).toBe(0);
  });

  it("fills in proportion to four times the alert level", () => {
    expect(levelFraction("10", "10")).toBe(0.25);
    expect(levelFraction("40", "10")).toBe(1);
    expect(levelFraction("400", "10")).toBe(1);
  });

  it("is full when no alert level is set", () => {
    expect(levelFraction("5", "0")).toBe(1);
  });
});

describe("signedQuantity", () => {
  it("always shows the direction", () => {
    expect(signedQuantity("60.000")).toBe("+60");
    expect(signedQuantity("-4.500")).toBe("-4.5");
    expect(signedQuantity("1200")).toBe("+1,200");
  });
});
