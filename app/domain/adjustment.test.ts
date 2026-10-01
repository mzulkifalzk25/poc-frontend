import { describe, expect, it } from "vitest";

import { stockAfter, validateAdjustment } from "./adjustment";

const base = {
  mode: "add",
  qty: "60",
  reason: "received",
  note: " box ",
} as const;

describe("validateAdjustment", () => {
  it("builds the payload with a clean quantity and note", () => {
    expect(validateAdjustment(base)).toEqual({
      ok: true,
      payload: { mode: "add", qty: "60.000", reason: "received", note: "box" },
    });
  });

  it("needs a quantity", () => {
    expect(validateAdjustment({ ...base, qty: " " })).toEqual({
      ok: false,
      error: "required",
    });
    expect(validateAdjustment({ ...base, qty: "abc" })).toEqual({
      ok: false,
      error: "invalid_amount",
    });
  });

  it("allows 0 only for an exact count", () => {
    expect(validateAdjustment({ ...base, qty: "0" })).toEqual({
      ok: false,
      error: "must_be_positive",
    });
    expect(validateAdjustment({ ...base, mode: "set", qty: "0" }).ok).toBe(
      true,
    );
  });
});

describe("stockAfter", () => {
  it("shows what the level will be", () => {
    expect(stockAfter("add", "60", "9")).toBe(69);
    expect(stockAfter("remove", "4", "9")).toBe(5);
    expect(stockAfter("remove", "20", "9")).toBe(-11);
    expect(stockAfter("set", "20", "9")).toBe(20);
    expect(stockAfter("add", "x", "9")).toBeNull();
  });
});
