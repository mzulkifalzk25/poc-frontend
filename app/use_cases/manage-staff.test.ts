import { describe, expect, it, vi } from "vitest";

import type { StaffMember } from "~/domain/staff";
import { ApiError } from "~/infrastructure/api/errors";

import {
  resetCashierPin,
  saveCashier,
  setStaffActive,
  unlockCashier,
  type StaffRepository,
} from "./manage-staff";

const zainab: StaffMember = {
  id: 5,
  fullName: "Zainab Khan",
  initials: "ZK",
  role: "cashier",
  defaultCounterId: 2,
  isActive: true,
  lastActiveAt: null,
  pinDelayUntil: null,
};

function fakeRepo(): StaffRepository {
  return {
    list: vi.fn(() => Promise.resolve([zainab])),
    createCashier: vi.fn(() => Promise.resolve(zainab)),
    update: vi.fn(() => Promise.resolve(zainab)),
    resetPin: vi.fn(() => Promise.resolve("4821")),
    unlock: vi.fn(() => Promise.resolve()),
  };
}

describe("manage staff", () => {
  it("creates a cashier with a cleaned name", async () => {
    const repo = fakeRepo();

    const outcome = await saveCashier(repo, null, {
      fullName: "  Zainab   Khan ",
      pin: "1234",
      defaultCounterId: 2,
    });

    expect(outcome).toEqual({ status: "done", value: zainab });
    expect(repo.createCashier).toHaveBeenCalledWith({
      fullName: "Zainab Khan",
      pin: "1234",
      defaultCounterId: 2,
    });
  });

  it("edits the name and default counter but never sends a PIN", async () => {
    const repo = fakeRepo();

    await saveCashier(repo, 5, {
      fullName: "Zainab K",
      pin: "9999",
      defaultCounterId: null,
    });

    expect(repo.update).toHaveBeenCalledWith(5, {
      fullName: "Zainab K",
      defaultCounterId: null,
    });
  });

  it("turns a taken name into a conflict the form can show", async () => {
    const repo = fakeRepo();
    vi.mocked(repo.createCashier).mockRejectedValue(
      new ApiError(409, {
        error: {
          code: "name_exists",
          message: "A cashier with this name already exists.",
          fields: { full_name: ["A cashier with this name already exists."] },
        },
      }),
    );

    const outcome = await saveCashier(repo, null, {
      fullName: "Zainab Khan",
      pin: "1234",
      defaultCounterId: null,
    });

    expect(outcome).toEqual({
      status: "conflict",
      code: "name_exists",
      message: "A cashier with this name already exists.",
    });
  });

  it("deactivates, resets the PIN and unlocks through the repository", async () => {
    const repo = fakeRepo();

    await setStaffActive(repo, 5, false);
    const pin = await resetCashierPin(repo, 5);
    const unlocked = await unlockCashier(repo, 5);

    expect(repo.update).toHaveBeenCalledWith(5, { isActive: false });
    expect(pin).toEqual({ status: "done", value: "4821" });
    expect(unlocked).toEqual({ status: "done", value: undefined });
  });
});
