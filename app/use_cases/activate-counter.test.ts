import { describe, expect, it } from "vitest";

import { ApiError } from "~/infrastructure/api/errors";
import type { DeviceMeta } from "~/infrastructure/session/device-store";

import { activateCounter, type ActivationRepository } from "./activate-counter";

const counter = { id: 3, name: "Counter 3", code: "003" };

function makeDeps(overrides: Partial<ActivationRepository> = {}) {
  const saved: DeviceMeta[] = [];
  const repo: ActivationRepository = {
    activate: () => Promise.resolve({ deviceToken: "device-1", counter }),
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
  it("saves the device token and counter", async () => {
    const { deps, saved } = makeDeps();

    const outcome = await activateCounter(deps, "K7M4-Q92R");

    expect(outcome).toEqual({ status: "success", counter });
    expect(saved).toEqual([
      {
        token: "device-1",
        counter,
        activatedAt: "2026-09-26T10:00:00.000Z",
        revokedAt: null,
      },
    ]);
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
});
