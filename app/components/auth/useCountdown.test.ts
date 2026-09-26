import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCountdown } from "./useCountdown";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useCountdown", () => {
  it("is idle until started", () => {
    const { result } = renderHook(() => useCountdown());

    expect(result.current.secondsRemaining).toBeNull();
  });

  it("counts down each second and ends at null", () => {
    const { result } = renderHook(() => useCountdown());

    act(() => {
      result.current.start(3);
    });
    expect(result.current.secondsRemaining).toBe(3);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.secondsRemaining).toBe(2);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.secondsRemaining).toBeNull();
  });

  it("stops when cleared", () => {
    const { result } = renderHook(() => useCountdown());

    act(() => {
      result.current.start(30);
      result.current.clear();
    });

    expect(result.current.secondsRemaining).toBeNull();
  });
});
