import { describe, expect, it } from "vitest";

import { code128Pattern, encodeCode128B } from "./code128";

describe("Code 128 B", () => {
  it("has 11-module patterns and a 13-module stop", () => {
    for (let value = 0; value < 106; value += 1) {
      const widths = Array.from(code128Pattern(value), Number);
      expect(widths.reduce((a, b) => a + b, 0)).toBe(11);
      expect(widths).toHaveLength(6);
    }
    expect(
      Array.from(code128Pattern(106), Number).reduce((a, b) => a + b, 0),
    ).toBe(13);
  });

  it("frames the bill number with Start B, a checksum and Stop", () => {
    const widths = encodeCode128B("002000743");
    const modules = widths.reduce((a, b) => a + b, 0);

    expect(modules).toBe(11 * (1 + 9 + 1) + 13);
    expect(widths.slice(0, 6).join("")).toBe("211214");
    expect(widths.slice(-7).join("")).toBe("2331112");
  });

  it("uses the Code 128 checksum", () => {
    // "0"=16,"0"=16,"2"=18: (104 + 16*1 + 16*2 + 18*3) % 103 = 103 % 103 = 0.
    const widths = encodeCode128B("002");
    expect(widths.slice(24, 30).join("")).toBe(code128Pattern(0));
  });

  it("refuses text it cannot encode", () => {
    expect(() => encodeCode128B("")).toThrow();
    expect(() => encodeCode128B("é")).toThrow();
  });
});
