import { describe, expect, it } from "vitest";

import {
  resolveActivateGuardRedirect,
  resolveAdminGuardRedirect,
  resolveDeactivatedGuardRedirect,
  resolvePosGuardRedirect,
  resolveShiftRedirect,
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
    expect(resolvePosGuardRedirect("none", cashierSession)).toBe(
      "/pos/activate",
    );
  });

  it("sends a deactivated device to the deactivated screen", () => {
    expect(resolvePosGuardRedirect("revoked", cashierSession)).toBe(
      "/pos/deactivated",
    );
  });

  it("sends an activated device with no cashier session to sign in", () => {
    expect(resolvePosGuardRedirect("active", null)).toBe("/");
  });

  it("sends an owner session at the counter to sign in", () => {
    expect(resolvePosGuardRedirect("active", ownerSession)).toBe("/");
  });

  it("allows an activated device with a cashier session", () => {
    expect(resolvePosGuardRedirect("active", cashierSession)).toBeNull();
  });
});

describe("resolveActivateGuardRedirect", () => {
  it("allows activation when not yet activated", () => {
    expect(resolveActivateGuardRedirect("none")).toBeNull();
  });

  it("sends an already-activated device to sign in", () => {
    expect(resolveActivateGuardRedirect("active")).toBe("/");
  });

  it("sends a deactivated device to the deactivated screen", () => {
    expect(resolveActivateGuardRedirect("revoked")).toBe("/pos/deactivated");
  });
});

describe("resolveDeactivatedGuardRedirect", () => {
  it("shows the screen only for a deactivated device", () => {
    expect(resolveDeactivatedGuardRedirect("revoked")).toBeNull();
    expect(resolveDeactivatedGuardRedirect("active")).toBe("/");
    expect(resolveDeactivatedGuardRedirect("none")).toBe("/");
  });
});

describe("resolveShiftRedirect", () => {
  const cashier = {
    role: "cashier" as const,
    accessToken: "",
    refreshToken: "",
    userId: 12,
    fullName: "Zainab Khan",
  };

  it("lets the cashier with the open shift into billing", () => {
    expect(resolveShiftRedirect(12, cashier)).toBeNull();
  });

  it("sends everyone else to start a shift", () => {
    expect(resolveShiftRedirect(null, cashier)).toBe("/pos/sign-in");
    expect(resolveShiftRedirect(13, cashier)).toBe("/pos/sign-in");
    expect(resolveShiftRedirect(12, null)).toBe("/pos/sign-in");
  });
});
