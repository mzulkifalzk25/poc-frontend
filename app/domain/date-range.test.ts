import { describe, expect, it } from "vitest";

import {
  addDays,
  addMonths,
  daysBetween,
  endOfMonth,
  moneyRange,
  reportRange,
  startOfMonth,
  summaryGroup,
} from "./date-range";

describe("date helpers", () => {
  it("move across month and year ends", () => {
    expect(addDays("2026-09-01", -1)).toBe("2026-08-31");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(startOfMonth("2026-09-19")).toBe("2026-09-01");
    expect(endOfMonth("2026-02-10")).toBe("2026-02-28");
    expect(addMonths("2026-01-19", -1)).toBe("2025-12-01");
    expect(daysBetween({ from: "2026-09-13", to: "2026-09-19" })).toBe(7);
  });
});

describe("report presets", () => {
  it("count back from today, today included", () => {
    expect(reportRange("today", "2026-09-19")).toEqual({
      from: "2026-09-19",
      to: "2026-09-19",
    });
    expect(reportRange("7d", "2026-09-19")).toEqual({
      from: "2026-09-13",
      to: "2026-09-19",
    });
    expect(reportRange("30d", "2026-09-19")).toEqual({
      from: "2026-08-21",
      to: "2026-09-19",
    });
  });

  it("group hours, days or weeks by length", () => {
    expect(summaryGroup({ from: "2026-09-19", to: "2026-09-19" })).toBe("hour");
    expect(summaryGroup({ from: "2026-09-13", to: "2026-09-19" })).toBe("day");
    expect(summaryGroup({ from: "2026-08-21", to: "2026-09-19" })).toBe("week");
  });
});

describe("money presets", () => {
  it("cover this month so far, last month and the last 12 months", () => {
    expect(moneyRange("this_month", "2026-09-19")).toEqual({
      from: "2026-09-01",
      to: "2026-09-19",
    });
    expect(moneyRange("last_month", "2026-09-19")).toEqual({
      from: "2026-08-01",
      to: "2026-08-31",
    });
    expect(moneyRange("last_12", "2026-09-19")).toEqual({
      from: "2025-10-01",
      to: "2026-09-19",
    });
  });
});

import { dayMonth, monthShort, periodLabel, weekdayShort } from "./date-range";

describe("labels", () => {
  it("read like the boards", () => {
    expect(weekdayShort("2026-09-19")).toBe("Sat");
    expect(dayMonth("2026-09-19")).toBe("19 Sept");
    expect(monthShort("2026-09")).toBe("Sept");
    expect(periodLabel("2026-08-20", "2026-08-26")).toBe("20–26 Aug");
    expect(periodLabel("2026-08-27", "2026-09-02")).toBe("27 Aug–2 Sept");
    expect(periodLabel("2026-09-19", "2026-09-19")).toBe("19 Sept");
  });
});

import { moneyGroup } from "./date-range";

describe("moneyGroup", () => {
  it("shows days for short ranges and months for long ones", () => {
    expect(moneyGroup({ from: "2026-09-01", to: "2026-09-19" })).toBe("day");
    expect(moneyGroup({ from: "2025-10-01", to: "2026-09-19" })).toBe("month");
  });

  it("refuses an empty or too long range", () => {
    expect(moneyGroup({ from: "2026-09-19", to: "2026-09-01" })).toBeNull();
    expect(moneyGroup({ from: "2023-01-01", to: "2026-09-19" })).toBeNull();
  });
});
