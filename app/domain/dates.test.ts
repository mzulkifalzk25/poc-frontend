import { describe, expect, it } from "vitest";

import { formatDayMonth } from "./dates";

describe("formatDayMonth", () => {
  it("shows the day and short month", () => {
    expect(formatDayMonth("2026-09-12T08:00:00Z", "Asia/Karachi")).toBe(
      "12 Sep",
    );
  });

  it("uses the store's time zone, not UTC", () => {
    expect(formatDayMonth("2026-08-02T20:30:00Z", "Asia/Karachi")).toBe(
      "03 Aug",
    );
  });

  it("rejects a broken timestamp", () => {
    expect(() => formatDayMonth("yesterday", "Asia/Karachi")).toThrow();
  });
});
