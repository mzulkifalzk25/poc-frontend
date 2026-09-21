import { beforeEach, describe, expect, it } from "vitest";

import { ApiError } from "~/infrastructure/api/errors";
import { getSession } from "~/infrastructure/session/session-store";

import { signInOwner, type OwnerAuthRepository } from "./sign-in-owner";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("signInOwner", () => {
  it("sets the session and returns success on a valid login", async () => {
    const repo: OwnerAuthRepository = {
      login: async () =>
        Promise.resolve({
          access: "access-1",
          refresh: "refresh-1",
          userId: 1,
          fullName: "Sana Ahmed",
          role: "owner",
        }),
    };

    const result = await signInOwner(
      repo,
      "sana@freshbasket.example",
      "pw",
      true,
    );

    expect(result).toEqual({ status: "success" });
    expect(getSession()).toEqual({
      role: "owner",
      accessToken: "access-1",
      refreshToken: "refresh-1",
      userId: 1,
      fullName: "Sana Ahmed",
    });
  });

  it("returns invalid_credentials on a 401", async () => {
    const repo: OwnerAuthRepository = {
      login: () =>
        Promise.reject(
          new ApiError(401, {
            error: { code: "invalid_credentials", message: "Wrong" },
          }),
        ),
    };

    const result = await signInOwner(
      repo,
      "sana@freshbasket.example",
      "wrong",
      false,
    );

    expect(result).toEqual({ status: "invalid_credentials" });
    expect(getSession()).toBeNull();
  });

  it("returns offline on a network failure", async () => {
    const repo: OwnerAuthRepository = {
      login: () => Promise.reject(new TypeError("Failed to fetch")),
    };

    const result = await signInOwner(
      repo,
      "sana@freshbasket.example",
      "pw",
      false,
    );

    expect(result).toEqual({ status: "offline" });
  });
});
