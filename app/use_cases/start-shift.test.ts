import { describe, expect, it, vi } from "vitest";

import type { ShiftRow } from "~/infrastructure/db/rows";

import { startShift, type StartShiftDeps } from "./start-shift";
import { uploadPendingShifts } from "./upload-shifts";

function deps(
  open: ShiftRow | null = null,
  overrides: Partial<StartShiftDeps> = {},
) {
  const saved: ShiftRow[] = [];
  const value: StartShiftDeps = {
    shifts: {
      current: () => Promise.resolve(open),
      save: (shift) => {
        saved.push(shift);
        return Promise.resolve();
      },
    },
    firstSyncDone: () => Promise.resolve(true),
    counterId: () => Promise.resolve(2),
    now: () => new Date("2026-09-26T04:00:00Z"),
    newId: () => "shift-1",
    ...overrides,
  };
  return { value, saved };
}

const input = {
  cashierId: 12,
  cashierName: "Zainab Khan",
  openingCash: "5,000",
};

const openShift: ShiftRow = {
  id: "shift-0",
  counterId: 2,
  cashierId: 12,
  cashierName: "Zainab Khan",
  openedAt: "2026-09-26T03:00:00Z",
  openingCash: "5000.00",
  status: "open",
  closedAt: null,
  countedCash: null,
  syncState: "open_synced",
};

describe("startShift", () => {
  it("opens a shift on this PC with the opening cash", async () => {
    const { value, saved } = deps();

    await expect(startShift(value, input)).resolves.toEqual({
      status: "started",
      shiftId: "shift-1",
    });
    expect(saved).toEqual([
      {
        id: "shift-1",
        counterId: 2,
        cashierId: 12,
        cashierName: "Zainab Khan",
        openedAt: "2026-09-26T04:00:00.000Z",
        openingCash: "5000.00",
        status: "open",
        closedAt: null,
        countedCash: null,
        syncState: "open_pending",
      },
    ]);
  });

  it("goes back to the cashier's own open shift", async () => {
    const { value, saved } = deps(openShift);

    await expect(startShift(value, input)).resolves.toEqual({
      status: "resumed",
      shiftId: "shift-0",
    });
    expect(saved).toEqual([]);
  });

  it("does not open a second shift while another cashier's is open", async () => {
    const { value } = deps({
      ...openShift,
      cashierId: 13,
      cashierName: "Bilal Raza",
    });

    await expect(startShift(value, input)).resolves.toEqual({
      status: "other_open",
      cashierName: "Bilal Raza",
    });
  });

  it("needs the opening cash as a number", async () => {
    const { value } = deps();

    await expect(
      startShift(value, { ...input, openingCash: "" }),
    ).resolves.toEqual({ status: "invalid_amount" });
    await expect(
      startShift(value, { ...input, openingCash: "-5" }),
    ).resolves.toEqual({ status: "invalid_amount" });
  });

  it("is blocked until the first catalogue download finished", async () => {
    const { value } = deps(null, {
      firstSyncDone: () => Promise.resolve(false),
    });

    await expect(startShift(value, input)).resolves.toEqual({
      status: "not_synced",
    });
  });

  it("needs an activated PC", async () => {
    const { value } = deps(null, { counterId: () => Promise.resolve(null) });

    await expect(startShift(value, input)).resolves.toEqual({
      status: "no_counter",
    });
  });
});

describe("uploadPendingShifts", () => {
  it("sends shifts opened on this PC and marks them synced", async () => {
    const update = vi.fn(() => Promise.resolve());
    const open = vi.fn(() => Promise.resolve());
    const pending = { ...openShift, syncState: "open_pending" as const };

    const sent = await uploadPendingShifts({
      shifts: { waitingUpload: () => Promise.resolve([pending]), update },
      api: { open },
    });

    expect(sent).toBe(1);
    expect(open).toHaveBeenCalledWith(pending);
    expect(update).toHaveBeenCalledWith("shift-0", {
      syncState: "open_synced",
    });
  });

  it("stops on a network error so the shift stays pending", async () => {
    const update = vi.fn(() => Promise.resolve());

    await expect(
      uploadPendingShifts({
        shifts: {
          waitingUpload: () =>
            Promise.resolve([{ ...openShift, syncState: "open_pending" }]),
          update,
        },
        api: { open: () => Promise.reject(new TypeError("offline")) },
      }),
    ).rejects.toThrow("offline");
    expect(update).not.toHaveBeenCalled();
  });
});
