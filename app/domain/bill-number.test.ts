import { describe, expect, it } from "vitest";

import {
  formatBillNumber,
  nextBillNumber,
  toApiBillNumber,
} from "./bill-number";

describe("formatBillNumber", () => {
  it("splits the counter code from the sequence", () => {
    expect(formatBillNumber("002000743")).toBe("002-000743");
  });

  it("throws on the wrong number of digits", () => {
    expect(() => formatBillNumber("37743")).toThrow(
      "Invalid bill number: 37743",
    );
  });
});

describe("toApiBillNumber", () => {
  it("strips the hyphen for the api", () => {
    expect(toApiBillNumber("002-000743")).toBe("002000743");
  });

  it("accepts a bill number typed without a hyphen", () => {
    expect(toApiBillNumber("002000743")).toBe("002000743");
  });

  it("throws on a malformed bill number", () => {
    expect(() => toApiBillNumber("#037743")).toThrow(
      "Invalid bill number: #037743",
    );
  });
});

describe("nextBillNumber", () => {
  it("continues this counter's sequence", () => {
    expect(nextBillNumber("002", 742)).toBe("002000743");
    expect(nextBillNumber("003", 0)).toBe("003000001");
  });

  it("rejects a bad counter code or a full sequence", () => {
    expect(() => nextBillNumber("2", 1)).toThrow();
    expect(() => nextBillNumber("002", 999_999)).toThrow();
    expect(() => nextBillNumber("002", -1)).toThrow();
  });
});
