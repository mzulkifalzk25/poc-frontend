import { beforeEach, describe, expect, it } from "vitest";

import { ApiError } from "~/infrastructure/api/errors";
import { getSession } from "~/infrastructure/session/session-store";

import { signInCashier, type CashierAuthRepository } from "./sign-in-cashier";

const roster = [
  { id: 1, fullName: "Zainab Khan" },
  { id: 2, fullName: "Bilal Raza" },
];

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

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("signInCashier", () => {
  it("matches the typed name case-insensitively and signs in", async () => {
    const result = await signInCashier(makeRepo(), "  zainab   khan ", "1234");

    expect(result).toEqual({ status: "success" });
    expect(getSession()).toEqual({
      role: "cashier",
      accessToken: "a",
      refreshToken: "r",
      userId: 1,
      fullName: "Zainab Khan",
    });
  });

  it("returns name_not_found when no roster entry matches", async () => {
    const result = await signInCashier(makeRepo(), "Someone Else", "1234");

    expect(result).toEqual({ status: "name_not_found" });
    expect(getSession()).toBeNull();
  });

  it("returns invalid_pin on a wrong pin", async () => {
    const repo = makeRepo({
      pinLogin: () =>
        Promise.reject(
          new ApiError(401, {
            error: { code: "invalid_pin", message: "Wrong PIN" },
          }),
        ),
    });

    const result = await signInCashier(repo, "Zainab Khan", "0000");

    expect(result).toEqual({ status: "invalid_pin" });
  });

  it("returns the retry_after seconds when throttled", async () => {
    const repo = makeRepo({
      pinLogin: () =>
        Promise.reject(
          new ApiError(429, {
            error: { code: "pin_throttled", message: "Wait" },
            retry_after: 25,
          }),
        ),
    });

    const result = await signInCashier(repo, "Zainab Khan", "0000");

    expect(result).toEqual({ status: "throttled", retryAfterSeconds: 25 });
  });

  it("returns offline when the roster fetch fails on the network", async () => {
    const repo = makeRepo({
      fetchRoster: () => Promise.reject(new TypeError("Failed to fetch")),
    });

    const result = await signInCashier(repo, "Zainab Khan", "1234");

    expect(result).toEqual({ status: "offline" });
  });

  it("returns device_revoked when the counter PC was deactivated", async () => {
    const repo = makeRepo({
      fetchRoster: () =>
        Promise.reject(
          new ApiError(401, {
            error: { code: "device_revoked", message: "Deactivated" },
          }),
        ),
    });

    const result = await signInCashier(repo, "Zainab Khan", "1234");

    expect(result).toEqual({ status: "device_revoked" });
  });

  it("rethrows unexpected server errors", async () => {
    const repo = makeRepo({
      pinLogin: () =>
        Promise.reject(
          new ApiError(500, { error: { code: "server_error", message: "x" } }),
        ),
    });

    await expect(signInCashier(repo, "Zainab Khan", "1234")).rejects.toThrow();
  });
});
