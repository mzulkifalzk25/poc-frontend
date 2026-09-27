import { describe, expect, it } from "vitest";

import {
  counterAction,
  counterDraftErrors,
  secondsLeft,
  type Counter,
} from "./counter";

function counter(status: Counter["status"]): Counter {
  return {
    id: 3,
    name: "Counter 3",
    code: "003",
    status,
    codeExpiresAt: null,
    lastSeenAt: null,
    nextBillNo: "003000001",
    unsyncedCount: null,
    hasOpenShift: false,
    hasBills: false,
  };
}

describe("counter rules", () => {
  it("needs a name and a 3-digit code", () => {
    expect(counterDraftErrors({ name: " ", code: "04" })).toEqual({
      name: "required",
      code: "code",
    });
    expect(counterDraftErrors({ name: "Counter 4", code: "004" })).toEqual({});
  });

  it("deactivates a live PC and offers a new code otherwise", () => {
    expect(counterAction(counter("activated"))).toBe("deactivate");
    expect(counterAction(counter("not_activated"))).toBe("newCode");
    expect(counterAction(counter("code_ready"))).toBe("newCode");
    expect(counterAction(counter("deactivated"))).toBe("newCode");
  });

  it("counts the seconds a code has left, never below zero", () => {
    const now = new Date("2026-09-19T12:00:00Z");
    expect(secondsLeft("2026-09-19T12:15:00Z", now)).toBe(900);
    expect(secondsLeft("2026-09-19T11:59:00Z", now)).toBe(0);
  });
});
