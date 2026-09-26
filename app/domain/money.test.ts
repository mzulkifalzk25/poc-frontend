import { describe, expect, it } from "vitest";

import {
  formatAmount,
  formatMoney,
  formatPaisa,
  parseMoney,
  roundToWholeRupees,
} from "./money";

describe("parseMoney", () => {
  it("parses an api money string", () => {
    expect(parseMoney("1350.00")).toBe(1350);
  });

  it("throws on a non-numeric value", () => {
    expect(() => parseMoney("abc")).toThrow("Invalid money value: abc");
  });
});

describe("roundToWholeRupees", () => {
  it("rounds to the nearest whole rupee", () => {
    expect(roundToWholeRupees(1349.5)).toBe(1350);
    expect(roundToWholeRupees(1349.49)).toBe(1349);
  });
});

describe("formatMoney", () => {
  it("formats an api string with thousands separators", () => {
    expect(formatMoney("1350.00")).toBe("Rs 1,350");
  });

  it("formats a number and rounds it", () => {
    expect(formatMoney(268570.4)).toBe("Rs 268,570");
  });

  it("formats zero and small values without a stray separator", () => {
    expect(formatMoney("0.00")).toBe("Rs 0");
    expect(formatMoney("50.00")).toBe("Rs 50");
  });

  it("formats a negative amount", () => {
    expect(formatMoney(-570)).toBe("Rs -570");
  });
});

describe("formatAmount and formatPaisa", () => {
  it("drops the currency for table columns", () => {
    expect(formatAmount("1650.00")).toBe("1,650");
    expect(formatAmount(-20)).toBe("-20");
  });

  it("formats paisa as whole rupees", () => {
    expect(formatPaisa(135000)).toBe("Rs 1,350");
    expect(formatPaisa(17550)).toBe("Rs 176");
  });
});
