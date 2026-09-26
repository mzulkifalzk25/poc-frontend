import { describe, expect, it } from "vitest";

import {
  formatClockTime,
  formatDayMonth,
  formatDayMonthYear,
  formatWeekdayDayMonth,
} from "./dates";

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

describe("receipt date and time", () => {
  it("shows the local date and 24-hour time", () => {
    expect(formatDayMonthYear("2026-09-19T12:47:03Z", "Asia/Karachi")).toBe(
      "19 Sep 2026",
    );
    expect(formatClockTime("2026-09-19T12:47:03Z", "Asia/Karachi")).toBe(
      "17:47",
    );
    expect(formatClockTime("2026-09-19T19:05:00Z", "Asia/Karachi")).toBe(
      "00:05",
    );
  });
});

describe("formatWeekdayDayMonth", () => {
  it("names the local day", () => {
    expect(formatWeekdayDayMonth("2026-09-19T09:00:00Z", "Asia/Karachi")).toBe(
      "Saturday, 19 September",
    );
  });
});
