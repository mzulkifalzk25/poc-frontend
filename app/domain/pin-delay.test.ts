import { describe, expect, it } from "vitest";

import {
  afterFailure,
  applyUnlock,
  delaySeconds,
  NO_DELAY,
  secondsRemaining,
  serverDelay,
} from "./pin-delay";

const now = new Date("2026-09-26T10:00:00Z");

function failTimes(times: number) {
  let state = NO_DELAY;
  for (let i = 0; i < times; i += 1) {
    state = afterFailure(state, now);
  }
  return state;
}

describe("PIN delay schedule", () => {
  it.each([
    [1, 0],
    [3, 0],
    [4, 30],
    [5, 60],
    [6, 300],
    [12, 300],
  ])("after %i wrong PINs waits %i s", (fails, seconds) => {
    expect(delaySeconds(fails)).toBe(seconds);
  });

  it("starts the countdown on the fourth wrong PIN", () => {
    expect(secondsRemaining(failTimes(3), now)).toBe(0);
    const delayed = failTimes(4);
    expect(secondsRemaining(delayed, now)).toBe(30);
    expect(
      secondsRemaining(delayed, new Date("2026-09-26T10:00:29.200Z")),
    ).toBe(1);
    expect(secondsRemaining(delayed, new Date("2026-09-26T10:00:30Z"))).toBe(0);
  });

  it("is cleared by an unlock after the last failure only", () => {
    const delayed = failTimes(5);

    expect(applyUnlock(delayed, "2026-09-26T10:00:01Z")).toEqual(NO_DELAY);
    expect(applyUnlock(delayed, "2026-09-26T09:59:00Z")).toBe(delayed);
    expect(applyUnlock(delayed, null)).toBe(delayed);
  });

  it("follows the server's retry_after when the server is stricter", () => {
    const state = serverDelay(NO_DELAY, 60, now);

    expect(secondsRemaining(state, now)).toBe(60);
    expect(state.failCount).toBe(4);
  });
});
