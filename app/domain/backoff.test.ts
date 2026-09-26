import { describe, expect, it } from "vitest";

import {
  backoffDelayMs,
  MAX_BACKOFF_MS,
  MIN_BACKOFF_MS,
  retryDelayMs,
} from "./backoff";

describe("backoff", () => {
  it("starts at 2 s and doubles", () => {
    expect(backoffDelayMs(0, 1)).toBe(2_000);
    expect(backoffDelayMs(1, 1)).toBe(4_000);
    expect(backoffDelayMs(3, 1)).toBe(16_000);
  });

  it("never waits more than 5 min or less than 2 s", () => {
    expect(backoffDelayMs(20, 1)).toBe(MAX_BACKOFF_MS);
    expect(backoffDelayMs(0, 0)).toBe(MIN_BACKOFF_MS);
  });

  it("spreads retries with jitter between half and all of the step", () => {
    expect(backoffDelayMs(3, 0)).toBe(8_000);
    expect(backoffDelayMs(3, 0.5)).toBe(12_000);
  });

  it("honours Retry-After", () => {
    expect(retryDelayMs(0, 0.5, 30)).toBe(30_000);
    expect(retryDelayMs(0, 0.5, 0)).toBe(2_000);
    expect(retryDelayMs(2, 1, null)).toBe(8_000);
  });
});
