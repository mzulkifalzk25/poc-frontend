import { describe, expect, it } from "vitest";

import { fromPaisa, roundToRupee, toPaisa } from "./paisa";

describe("paisa", () => {
  it("converts API amounts both ways", () => {
    expect(toPaisa("1350.00")).toBe(135000);
    expect(toPaisa("0.1")).toBe(10);
    expect(fromPaisa(135050)).toBe("1350.50");
    expect(fromPaisa(5)).toBe("0.05");
    expect(fromPaisa(-250)).toBe("-2.50");
  });

  it("rejects amounts that are not numbers", () => {
    expect(() => toPaisa("")).toThrow();
    expect(() => toPaisa("abc")).toThrow();
    expect(() => fromPaisa(1.5)).toThrow();
  });

  it("rounds half up to whole rupees", () => {
    expect(roundToRupee(13549)).toBe(13500);
    expect(roundToRupee(13550)).toBe(13600);
    expect(roundToRupee(-13550)).toBe(-13600);
  });
});
