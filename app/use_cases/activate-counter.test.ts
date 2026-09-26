import { describe, expect, it, vi } from "vitest";

import { ApiError } from "~/infrastructure/api/errors";
import type { DeviceMeta } from "~/infrastructure/session/device-store";

import { activateCounter, type ActivationRepository } from "./activate-counter";

const counter = { id: 3, name: "Counter 3", code: "003" };

function makeDeps(overrides: Partial<ActivationRepository> = {}) {
  const saved: DeviceMeta[] = [];
  const repo: ActivationRepository = {
    activate: () => Promise.resolve({ deviceToken: "device-1", counter }),
    countCashiers: () => Promise.resolve(3),
    ...overrides,
  };
  return {
    saved,
    deps: {
      repo,
      saveDevice: (meta: DeviceMeta) => {
        saved.push(meta);
        return Promise.resolve();
      },
      now: () => new Date("2026-09-26T10:00:00Z"),
    },
  };
}

function apiFailure(status: number, code: string) {
  return () =>
    Promise.reject(new ApiError(status, { error: { code, message: code } }));
}

describe("activateCounter", () => {
  it("saves the device token and counter and counts the cashiers", async () => {
    const { deps, saved } = makeDeps();

    const outcome = await activateCounter(deps, "K7M4-Q92R");

    expect(outcome).toEqual({ status: "success", counter, cashierCount: 3 });
    expect(saved).toEqual([
      {
        token: "device-1",
        counter,
        activatedAt: "2026-09-26T10:00:00.000Z",
        revokedAt: null,
      },
    ]);
  });

  it("still succeeds when the cashier count cannot be loaded", async () => {
    const { deps } = makeDeps({
      countCashiers: () => Promise.reject(new TypeError("Failed to fetch")),
    });

    const outcome = await activateCounter(deps, "K7M4-Q92R");

    expect(outcome).toEqual({ status: "success", counter, cashierCount: null });
  });

  it.each([
    [400, "code_invalid"],
    [410, "code_expired"],
    [409, "code_used"],
  ])("maps a %i %s answer without saving", async (status, code) => {
    const { deps, saved } = makeDeps({ activate: apiFailure(status, code) });

    const outcome = await activateCounter(deps, "K7M4-Q92R");

    expect(outcome).toEqual({ status: code });
    expect(saved).toEqual([]);
  });

  it("reports rate limiting with the wait", async () => {
    const { deps } = makeDeps({
      activate: () =>
        Promise.reject(
          new ApiError(429, {
            error: { code: "throttled", message: "Slow down" },
            retry_after: 120,
          }),
        ),
    });

    const outcome = await activateCounter(deps, "K7M4-Q92R");

    expect(outcome).toEqual({ status: "rate_limited", retryAfterSeconds: 120 });
  });

  it("reports offline on a network failure", async () => {
    const { deps } = makeDeps({
      activate: () => Promise.reject(new TypeError("Failed to fetch")),
    });

    const outcome = await activateCounter(deps, "K7M4-Q92R");

    expect(outcome).toEqual({ status: "offline" });
  });

  it("rethrows unexpected errors", async () => {
    const { deps } = makeDeps({ activate: apiFailure(500, "server_error") });

    await expect(activateCounter(deps, "K7M4-Q92R")).rejects.toThrow();
  });

  it("does not count cashiers before the device is saved", async () => {
    const order: string[] = [];
    const { deps } = makeDeps({
      countCashiers: vi.fn(() => {
        order.push("count");
        return Promise.resolve(2);
      }),
    });
    const save = deps.saveDevice;
    deps.saveDevice = (meta) => {
      order.push("save");
      return save(meta);
    };

    await activateCounter(deps, "K7M4-Q92R");

    expect(order).toEqual(["save", "count"]);
  });
});
