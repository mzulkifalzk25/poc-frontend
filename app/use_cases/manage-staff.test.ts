import { describe, expect, it, vi } from "vitest";

import type { StaffMember } from "~/domain/staff";
import { ApiError } from "~/infrastructure/api/errors";

import {
  resetCashierPassword,
  saveCashier,
  setStaffActive,
  type StaffRepository,
} from "./manage-staff";

const zainab: StaffMember = {
  id: 5,
  fullName: "Zainab Khan",
  initials: "ZK",
  role: "cashier",
  email: "zainab@example.com",
  username: null,
  defaultCounterId: 2,
  isActive: true,
  lastActiveAt: null,
};

function fakeRepo(): StaffRepository {
  return {
    list: vi.fn(() => Promise.resolve([zainab])),
    createCashier: vi.fn(() => Promise.resolve(zainab)),
    update: vi.fn(() => Promise.resolve(zainab)),
    resetPassword: vi.fn(() => Promise.resolve("Blue-Kettle-42")),
  };
}

describe("manage staff", () => {
  it("creates a cashier with a cleaned name", async () => {
    const repo = fakeRepo();

    const outcome = await saveCashier(repo, null, {
      fullName: "  Zainab   Khan ",
      email: "zainab@example.com",
      username: "",
      password: "pw-482134",
      defaultCounterId: 2,
    });

    expect(outcome).toEqual({ status: "done", value: zainab });
    expect(repo.createCashier).toHaveBeenCalledWith({
      fullName: "Zainab Khan",
      email: "zainab@example.com",
      username: "",
      password: "pw-482134",
      defaultCounterId: 2,
    });
  });

  it("edits the name and default counter but never sends a password", async () => {
    const repo = fakeRepo();

    await saveCashier(repo, 5, {
      fullName: "Zainab K",
      email: "zainab@example.com",
      username: "",
      password: "new-password",
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
      email: "zainab@example.com",
      username: "",
      password: "pw-482134",
      defaultCounterId: null,
    });

    expect(outcome).toEqual({
      status: "conflict",
      code: "name_exists",
      message: "A cashier with this name already exists.",
    });
  });

  it("deactivates and resets the password through the repository", async () => {
    const repo = fakeRepo();

    await setStaffActive(repo, 5, false);
    const password = await resetCashierPassword(repo, 5);

    expect(repo.update).toHaveBeenCalledWith(5, { isActive: false });
    expect(password).toEqual({ status: "done", value: "Blue-Kettle-42" });
  });
});
