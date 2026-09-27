import { describe, expect, it } from "vitest";

import {
  cashierDraftErrors,
  isSignedInNow,
  staffSummary,
  type StaffMember,
} from "./staff";

const now = new Date("2026-09-19T12:47:00Z");

function member(overrides: Partial<StaffMember> = {}): StaffMember {
  return {
    id: 1,
    fullName: "Zainab Khan",
    initials: "ZK",
    role: "cashier",
    email: null,
    username: null,
    defaultCounterId: 2,
    isActive: true,
    lastActiveAt: null,
    ...overrides,
  };
}

describe("staff rules", () => {
  it("counts a cashier as signed in within two minutes of the last heartbeat", () => {
    expect(
      isSignedInNow(member({ lastActiveAt: "2026-09-19T12:45:30Z" }), now),
    ).toBe(true);
    expect(
      isSignedInNow(member({ lastActiveAt: "2026-09-19T12:45:00Z" }), now),
    ).toBe(false);
    expect(isSignedInNow(member(), now)).toBe(false);
  });

  it("never counts a deactivated cashier as signed in", () => {
    const recent = { lastActiveAt: "2026-09-19T12:46:50Z", isActive: false };
    expect(isSignedInNow(member(recent), now)).toBe(false);
  });

  it("sums owners, cashiers and who is signed in now", () => {
    const members = [
      member({ id: 1, role: "owner" }),
      member({ id: 2, lastActiveAt: "2026-09-19T12:46:40Z" }),
      member({ id: 3, isActive: false }),
    ];
    expect(staffSummary(members, now)).toEqual({
      owners: 1,
      cashiers: 2,
      signedIn: 1,
    });
  });

  it("needs a name, and a login and password only for a new cashier", () => {
    const blank = {
      fullName: " ",
      email: "",
      username: "",
      password: "",
      defaultCounterId: null,
    };
    expect(cashierDraftErrors(blank, true)).toEqual({
      fullName: "required",
      login: "required",
      password: "required",
    });
    expect(cashierDraftErrors(blank, false)).toEqual({ fullName: "required" });
    expect(
      cashierDraftErrors(
        {
          fullName: "Ali",
          email: "ali@example.com",
          username: "",
          password: "pw-482134",
          defaultCounterId: 1,
        },
        true,
      ),
    ).toEqual({});
  });
});
