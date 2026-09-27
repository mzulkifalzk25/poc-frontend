import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "~/infrastructure/api/errors";
import { getSession } from "~/infrastructure/session/session-store";

import { signInCashier, type CashierAuthRepository } from "./sign-in-cashier";

function fakeRepo(
  overrides: Partial<CashierAuthRepository> = {},
): CashierAuthRepository {
  return {
    login: () =>
      Promise.resolve({
        access: "a",
        refresh: "r",
        userId: 7,
        fullName: "Zainab Khan",
      }),
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("signInCashier", () => {
  it("starts a cashier session from the login result", async () => {
    const repo = fakeRepo();

    const outcome = await signInCashier(
      repo,
      "zainab@example.com",
      "pw-482134",
      true,
    );

    expect(outcome).toEqual({ status: "success" });
    expect(getSession()).toMatchObject({
      role: "cashier",
      userId: 7,
      fullName: "Zainab Khan",
      accessToken: "a",
      refreshToken: "r",
    });
  });

  it("remembers the session in local storage only when asked", async () => {
    const repo = fakeRepo();

    await signInCashier(repo, "zainab@example.com", "pw-482134", false);

    expect(localStorage.getItem("martdesk.session")).toBeNull();
    expect(sessionStorage.getItem("martdesk.session")).not.toBeNull();
  });

  it("reports invalid credentials on a 401", async () => {
    const repo = fakeRepo({
      login: () =>
        Promise.reject(
          new ApiError(401, {
            error: { code: "invalid_credentials", message: "Wrong" },
          }),
        ),
    });

    const outcome = await signInCashier(
      repo,
      "zainab@example.com",
      "wrong",
      true,
    );

    expect(outcome).toEqual({ status: "invalid_credentials" });
    expect(getSession()).toBeNull();
  });

  it("reports throttling with the wait", async () => {
    const repo = fakeRepo({
      login: () =>
        Promise.reject(
          new ApiError(429, {
            error: { code: "login_throttled", message: "Wait" },
            retry_after: 30,
          }),
        ),
    });

    const outcome = await signInCashier(
      repo,
      "zainab@example.com",
      "wrong",
      true,
    );

    expect(outcome).toEqual({ status: "throttled", retryAfterSeconds: 30 });
  });

  it("reports a revoked device", async () => {
    const repo = fakeRepo({
      login: () =>
        Promise.reject(
          new ApiError(401, {
            error: { code: "device_revoked", message: "Deactivated" },
          }),
        ),
    });

    const outcome = await signInCashier(
      repo,
      "zainab@example.com",
      "pw-482134",
      true,
    );

    expect(outcome).toEqual({ status: "device_revoked" });
  });

  it("reports being offline on a network failure", async () => {
    const repo = fakeRepo({
      login: () => Promise.reject(new TypeError("Failed to fetch")),
    });

    const outcome = await signInCashier(
      repo,
      "zainab@example.com",
      "pw-482134",
      true,
    );

    expect(outcome).toEqual({ status: "offline" });
    expect(getSession()).toBeNull();
  });

  it("rethrows unexpected errors", async () => {
    const repo = fakeRepo({
      login: () =>
        Promise.reject(
          new ApiError(500, {
            error: { code: "server_error", message: "Oops" },
          }),
        ),
    });

    await expect(
      signInCashier(repo, "zainab@example.com", "pw-482134", true),
    ).rejects.toThrow();
  });
});
