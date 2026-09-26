import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { startPeriodicTask } from "./periodic-task";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("startPeriodicTask", () => {
  it("runs at once and then on every interval", async () => {
    const task = vi.fn(() => Promise.resolve());

    const stop = startPeriodicTask(task, { intervalMs: 60_000 });
    await vi.advanceTimersByTimeAsync(120_000);
    stop();
    await vi.advanceTimersByTimeAsync(60_000);

    expect(task).toHaveBeenCalledTimes(3);
  });

  it("runs again on reconnect and focus", async () => {
    const task = vi.fn(() => Promise.resolve());

    const stop = startPeriodicTask(task, {
      intervalMs: 60_000,
      triggers: ["online", "focus"],
    });
    await vi.advanceTimersByTimeAsync(0);
    window.dispatchEvent(new Event("online"));
    await vi.advanceTimersByTimeAsync(0);
    window.dispatchEvent(new Event("focus"));
    await vi.advanceTimersByTimeAsync(0);
    stop();
    window.dispatchEvent(new Event("online"));

    expect(task).toHaveBeenCalledTimes(3);
  });

  it("never starts a second run while one is in flight", async () => {
    let finish: () => void = () => undefined;
    const task = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );

    const stop = startPeriodicTask(task, {
      intervalMs: 1000,
      triggers: ["online"],
    });
    window.dispatchEvent(new Event("online"));
    await vi.advanceTimersByTimeAsync(3000);
    expect(task).toHaveBeenCalledTimes(1);
    finish();
    await vi.advanceTimersByTimeAsync(1000);
    stop();

    expect(task).toHaveBeenCalledTimes(2);
  });

  it("reports errors and keeps going", async () => {
    const onError = vi.fn();
    const task = vi.fn(() => Promise.reject(new TypeError("offline")));

    const stop = startPeriodicTask(task, { intervalMs: 1000, onError });
    await vi.advanceTimersByTimeAsync(1000);
    stop();

    expect(onError).toHaveBeenCalledTimes(2);
  });
});
