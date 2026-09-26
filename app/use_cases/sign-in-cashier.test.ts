import { beforeEach, describe, expect, it, vi } from "vitest";

import { NO_DELAY, type PinDelayState } from "~/domain/pin-delay";
import { ApiError } from "~/infrastructure/api/errors";
import type { AuditEventUpload } from "~/infrastructure/db/rows";
import { getSession } from "~/infrastructure/session/session-store";

import {
  signInCashier,
  type CashierAuthRepository,
  type CashierSignInDeps,
  type LocalCashier,
} from "./sign-in-cashier";

const roster = [
  { id: 1, fullName: "Zainab Khan" },
  { id: 2, fullName: "Bilal Raza" },
];

const zainab: LocalCashier = {
  id: 1,
  fullName: "Zainab Khan",
  pinVerifier: "verifier-1234",
  unlockedAt: null,
};

function apiError(status: number, code: string, retryAfter?: number) {
  return new ApiError(status, {
    error: { code, message: code },
    retry_after: retryAfter,
  });
}

function makeRepo(
  overrides: Partial<CashierAuthRepository> = {},
): CashierAuthRepository {
  return {
    fetchRoster: () => Promise.resolve(roster),
    pinLogin: () =>
      Promise.resolve({ access: "a", refresh: "r", fullName: "Zainab Khan" }),
    ...overrides,
  };
}

interface TestDeps extends CashierSignInDeps {
  delayMap: Map<number, PinDelayState>;
  audit: AuditEventUpload[];
}

function makeDeps(
  repo: CashierAuthRepository,
  local: LocalCashier[] = [],
): TestDeps {
  const delayMap = new Map<number, PinDelayState>();
  const audit: AuditEventUpload[] = [];
  const key = (typed: string) =>
    typed.trim().replace(/\s+/g, " ").toLowerCase();
  return {
    repo,
    localRoster: {
      findByName: (typed) =>
        Promise.resolve(
          local.find((cashier) => key(cashier.fullName) === key(typed)) ?? null,
        ),
      count: () => Promise.resolve(local.length),
    },
    verifyPin: (pin, verifier) =>
      Promise.resolve(verifier === `verifier-${pin}`),
    delays: {
      get: (userId) => Promise.resolve(delayMap.get(userId) ?? NO_DELAY),
      set: (userId, state) => {
        delayMap.set(userId, state);
        return Promise.resolve();
      },
    },
    delayMap,
    audit,
    queueAudit: (event) => {
      audit.push(event);
      return Promise.resolve();
    },
    now: () => new Date("2026-09-26T10:00:00Z"),
    newId: () => "event-1",
  };
}

const offline = () => Promise.reject(new TypeError("Failed to fetch"));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("signInCashier before the first sync (server roster)", () => {
  it("matches the typed name case-insensitively and signs in", async () => {
    const result = await signInCashier(
      makeDeps(makeRepo()),
      "  zainab   khan ",
      "1234",
    );

    expect(result).toEqual({ status: "success", offline: false });
    expect(getSession()).toEqual({
      role: "cashier",
      accessToken: "a",
      refreshToken: "r",
      userId: 1,
      fullName: "Zainab Khan",
      offline: false,
    });
  });

  it("returns name_not_found when no roster entry matches", async () => {
    const result = await signInCashier(
      makeDeps(makeRepo()),
      "Someone Else",
      "1234",
    );

    expect(result).toEqual({ status: "name_not_found" });
    expect(getSession()).toBeNull();
  });

  it("returns invalid_pin on a wrong pin", async () => {
    const repo = makeRepo({
      pinLogin: () => Promise.reject(apiError(401, "invalid_pin")),
    });

    const result = await signInCashier(makeDeps(repo), "Zainab Khan", "0000");

    expect(result).toEqual({ status: "invalid_pin" });
    expect(getSession()).toBeNull();
  });

  it("returns the retry_after seconds when throttled", async () => {
    const repo = makeRepo({
      pinLogin: () => Promise.reject(apiError(429, "pin_throttled", 60)),
    });

    const result = await signInCashier(makeDeps(repo), "Zainab Khan", "0000");

    expect(result).toEqual({ status: "throttled", retryAfterSeconds: 60 });
  });

  it("returns offline when the roster fetch fails on the network", async () => {
    const result = await signInCashier(
      makeDeps(makeRepo({ fetchRoster: offline })),
      "Zainab Khan",
      "1234",
    );

    expect(result).toEqual({ status: "offline" });
  });

  it("returns device_revoked when the counter PC was deactivated", async () => {
    const repo = makeRepo({
      fetchRoster: () => Promise.reject(apiError(401, "device_revoked")),
    });

    const result = await signInCashier(makeDeps(repo), "Zainab Khan", "1234");

    expect(result).toEqual({ status: "device_revoked" });
  });

  it("rethrows unexpected server errors", async () => {
    const repo = makeRepo({
      pinLogin: () => Promise.reject(apiError(500, "server_error")),
    });

    await expect(
      signInCashier(makeDeps(repo), "Zainab Khan", "1234"),
    ).rejects.toThrow();
  });
});

describe("signInCashier with the local roster", () => {
  it("says the name was not found without asking the server", async () => {
    const repo = makeRepo({ fetchRoster: vi.fn(offline) });

    const result = await signInCashier(
      makeDeps(repo, [zainab]),
      "Hina Malik",
      "1234",
    );

    expect(result).toEqual({ status: "name_not_found" });
    expect(repo.fetchRoster).not.toHaveBeenCalled();
  });

  it("signs in with the server when online and clears the local delay", async () => {
    const deps = makeDeps(makeRepo(), [zainab]);
    deps.delayMap.set(1, {
      failCount: 2,
      nextAllowedAt: null,
      lastFailedAt: "2026-09-26T09:00:00Z",
    });

    await expect(signInCashier(deps, "zainab khan", "1234")).resolves.toEqual({
      status: "success",
      offline: false,
    });
    expect(deps.delayMap.get(1)).toEqual(NO_DELAY);
  });

  it("checks the PIN on this PC when offline", async () => {
    const deps = makeDeps(makeRepo({ pinLogin: offline }), [zainab]);

    const result = await signInCashier(deps, "Zainab Khan", "1234");

    expect(result).toEqual({ status: "success", offline: true });
    expect(getSession()).toMatchObject({
      userId: 1,
      accessToken: "",
      offline: true,
    });
  });

  it("counts offline wrong PINs, queues an audit event and delays after three", async () => {
    const deps = makeDeps(makeRepo({ pinLogin: offline }), [zainab]);

    const results = [];
    for (let i = 0; i < 4; i += 1) {
      results.push(await signInCashier(deps, "Zainab Khan", "0000"));
    }

    expect(results.slice(0, 3)).toEqual(
      Array(3).fill({ status: "invalid_pin" }),
    );
    expect(results[3]).toEqual({ status: "throttled", retryAfterSeconds: 30 });
    expect(deps.audit).toHaveLength(4);
    expect(deps.audit[3]).toMatchObject({
      action: "pin_failure",
      entity_type: "user",
      entity_id: "1",
      occurred_at: "2026-09-26T10:00:00.000Z",
      detail: { fail_count: 4, retry_after: 30, offline: true },
    });
  });

  it("refuses to try during a delay, even with the right PIN", async () => {
    const repo = makeRepo({ pinLogin: vi.fn(offline) });
    const deps = makeDeps(repo, [zainab]);
    deps.delayMap.set(1, {
      failCount: 4,
      nextAllowedAt: "2026-09-26T10:00:20Z",
      lastFailedAt: "2026-09-26T09:59:50Z",
    });

    const result = await signInCashier(deps, "Zainab Khan", "1234");

    expect(result).toEqual({ status: "throttled", retryAfterSeconds: 20 });
    expect(repo.pinLogin).not.toHaveBeenCalled();
  });

  it("lets the cashier in after the owner's unlock", async () => {
    const deps = makeDeps(makeRepo({ pinLogin: offline }), [
      { ...zainab, unlockedAt: "2026-09-26T09:59:55Z" },
    ]);
    deps.delayMap.set(1, {
      failCount: 6,
      nextAllowedAt: "2026-09-26T10:04:00Z",
      lastFailedAt: "2026-09-26T09:59:00Z",
    });

    await expect(signInCashier(deps, "Zainab Khan", "1234")).resolves.toEqual({
      status: "success",
      offline: true,
    });
  });

  it("mirrors a server wrong PIN locally without a second audit event", async () => {
    const deps = makeDeps(
      makeRepo({
        pinLogin: () => Promise.reject(apiError(401, "invalid_pin")),
      }),
      [zainab],
    );

    await signInCashier(deps, "Zainab Khan", "0000");

    expect(deps.delayMap.get(1)).toMatchObject({ failCount: 1 });
    expect(deps.audit).toEqual([]);
  });

  it("keeps the server's delay for later offline tries", async () => {
    const deps = makeDeps(
      makeRepo({
        pinLogin: () => Promise.reject(apiError(429, "pin_throttled", 60)),
      }),
      [zainab],
    );

    await signInCashier(deps, "Zainab Khan", "0000");

    expect(deps.delayMap.get(1)).toMatchObject({
      nextAllowedAt: "2026-09-26T10:01:00.000Z",
    });
  });

  it("cannot sign in offline without a cached verifier", async () => {
    const deps = makeDeps(makeRepo({ pinLogin: offline }), [
      { ...zainab, pinVerifier: null },
    ]);

    await expect(signInCashier(deps, "Zainab Khan", "1234")).resolves.toEqual({
      status: "offline",
    });
  });

  it("starts the countdown when a wrong PIN answer carries retry_after", async () => {
    const deps = makeDeps(
      makeRepo({
        pinLogin: () => Promise.reject(apiError(401, "invalid_pin", 30)),
      }),
      [zainab],
    );

    const result = await signInCashier(deps, "Zainab Khan", "0000");

    expect(result).toEqual({ status: "throttled", retryAfterSeconds: 30 });
    expect(deps.delayMap.get(1)).toMatchObject({
      nextAllowedAt: "2026-09-26T10:00:30.000Z",
    });
  });
});
