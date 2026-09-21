import { describe, expect, it } from "vitest";

import {
  resolveActivateGuardRedirect,
  resolveAdminGuardRedirect,
  resolvePosGuardRedirect,
  resolvePosSignInGuardRedirect,
} from "./guards";
import type { AuthSession } from "./session-store";

const ownerSession: AuthSession = {
  role: "owner",
  accessToken: "a",
  refreshToken: "r",
  userId: 1,
  fullName: "Sana Ahmed",
};

const cashierSession: AuthSession = {
  role: "cashier",
  accessToken: "a",
  refreshToken: "r",
  userId: 2,
  fullName: "Zainab Khan",
};

describe("resolveAdminGuardRedirect", () => {
  it("allows an owner session", () => {
    expect(resolveAdminGuardRedirect(ownerSession)).toBeNull();
  });

  it("sends a cashier session back to sign in", () => {
    expect(resolveAdminGuardRedirect(cashierSession)).toBe("/");
  });

  it("sends no session back to sign in", () => {
    expect(resolveAdminGuardRedirect(null)).toBe("/");
  });
});

describe("resolvePosGuardRedirect", () => {
  it("sends an unactivated device to activate", () => {
    expect(resolvePosGuardRedirect(false, cashierSession)).toBe(
      "/pos/activate",
    );
  });

  it("sends an activated device with no cashier session to sign in", () => {
    expect(resolvePosGuardRedirect(true, null)).toBe("/pos/sign-in");
  });

  it("sends an owner session at the counter to sign in", () => {
    expect(resolvePosGuardRedirect(true, ownerSession)).toBe("/pos/sign-in");
  });

  it("allows an activated device with a cashier session", () => {
    expect(resolvePosGuardRedirect(true, cashierSession)).toBeNull();
  });
});

describe("resolveActivateGuardRedirect", () => {
  it("allows activation when not yet activated", () => {
    expect(resolveActivateGuardRedirect(false)).toBeNull();
  });

  it("sends an already-activated device to sign in", () => {
    expect(resolveActivateGuardRedirect(true)).toBe("/pos/sign-in");
  });
});

describe("resolvePosSignInGuardRedirect", () => {
  it("allows sign in once activated", () => {
    expect(resolvePosSignInGuardRedirect(true)).toBeNull();
  });

  it("sends an unactivated device to activate", () => {
    expect(resolvePosSignInGuardRedirect(false)).toBe("/pos/activate");
  });
});
