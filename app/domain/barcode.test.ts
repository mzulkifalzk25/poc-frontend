import { describe, expect, it } from "vitest";

import { cleanBarcode, isPlausibleBarcode, isRepeatScan } from "./barcode";

describe("barcode rules", () => {
  it("strips spaces and control characters a scanner may add", () => {
    expect(cleanBarcode(" 8961011200111\r\n")).toBe("8961011200111");
    expect(cleanBarcode("\u0002896 1011\u0003")).toBe("8961011");
  });

  it.each(["8961011200111", "ABC-123", "1234"])("accepts %s", (code) => {
    expect(isPlausibleBarcode(code)).toBe(true);
  });

  it.each(["", "123", "has space", "x".repeat(33), "89610*"])(
    "rejects %j",
    (code) => {
      expect(isPlausibleBarcode(code)).toBe(false);
    },
  );
});

describe("isRepeatScan", () => {
  const last = { code: "8961011200111", at: 1000 };

  it("ignores the same code inside the window", () => {
    expect(isRepeatScan(last, "8961011200111", 2500, 3000)).toBe(true);
  });

  it("accepts the same code after the window", () => {
    expect(isRepeatScan(last, "8961011200111", 4000, 3000)).toBe(false);
  });

  it("accepts a different code at once", () => {
    expect(isRepeatScan(last, "8961002300022", 1100, 3000)).toBe(false);
  });

  it("accepts the first scan", () => {
    expect(isRepeatScan(null, "8961011200111", 0, 3000)).toBe(false);
  });
});
