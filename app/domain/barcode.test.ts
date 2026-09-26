import { describe, expect, it } from "vitest";

import { cleanBarcode, isPlausibleBarcode } from "./barcode";

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
