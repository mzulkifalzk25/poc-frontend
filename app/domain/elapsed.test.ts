import { describe, expect, it } from "vitest";

import { minutesBetween } from "./elapsed";

describe("minutesBetween", () => {
  const now = new Date("2026-09-26T10:30:00Z");

  it("counts whole minutes", () => {
    expect(minutesBetween("2026-09-26T10:15:30Z", now)).toBe(14);
    expect(minutesBetween("2026-09-26T10:29:59Z", now)).toBe(0);
  });

  it("never goes below zero for a clock ahead of this PC", () => {
    expect(minutesBetween("2026-09-26T10:35:00Z", now)).toBe(0);
  });

  it("rejects a broken timestamp", () => {
    expect(() => minutesBetween("later", now)).toThrow();
  });
});
