import { describe, expect, it } from "vitest";

import { clockOffsetMs, correctedTime, isClockSkewed } from "./clock";

describe("clock offset", () => {
  it("compares the server time with the middle of the request", () => {
    const sent = Date.parse("2026-09-26T10:00:00.000Z");
    const received = sent + 400;

    expect(clockOffsetMs("2026-09-26T10:02:00.200Z", sent, received)).toBe(
      120_000,
    );
  });

  it("corrects local time with the offset", () => {
    expect(
      correctedTime(Date.parse("2026-09-26T10:00:00Z"), -90_000).toISOString(),
    ).toBe("2026-09-26T09:58:30.000Z");
  });

  it("flags skew over five minutes either way", () => {
    expect(isClockSkewed(300_000)).toBe(false);
    expect(isClockSkewed(300_001)).toBe(true);
    expect(isClockSkewed(-400_000)).toBe(true);
  });

  it("rejects a broken server time", () => {
    expect(() => clockOffsetMs("soon", 0, 0)).toThrow();
  });
});
