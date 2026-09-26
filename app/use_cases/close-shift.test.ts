import { describe, expect, it, vi } from "vitest";

import { shiftTotals } from "~/domain/shift-totals";
import type { ShiftRow } from "~/infrastructure/db/rows";

import { closeShift, type CloseShiftDeps } from "./close-shift";

const shift: ShiftRow = {
  id: "shift-1",
  counterId: 2,
  cashierId: 12,
  cashierName: "Zainab Khan",
  openedAt: "2026-09-26T04:00:00Z",
  openingCash: "5000.00",
  status: "open",
  closedAt: null,
  countedCash: null,
  syncState: "open_synced",
};

const totals = shiftTotals(
  [
    { method: "cash", total: 223000 },
    { method: "card", total: 65000 },
  ],
  [],
);

function deps(overrides: Partial<CloseShiftDeps> = {}) {
  const rows = new Map([[shift.id, shift]]);
  const value: CloseShiftDeps = {
    update: vi.fn((id: string, changes: Partial<ShiftRow>) => {
      const row = rows.get(id);
      if (row) {
        rows.set(id, { ...row, ...changes });
      }
      return Promise.resolve();
    }),
    get: (id) => Promise.resolve(rows.get(id) ?? null),
    clearHeldBills: vi.fn(() => Promise.resolve()),
    uploadShifts: vi.fn(() => {
      const row = rows.get(shift.id);
      if (row) {
        rows.set(shift.id, {
          ...row,
          syncState: "closed_synced",
          serverResult: {
            expectedCash: "7230.00",
            difference: "150.00",
            mismatch: true,
          },
        });
      }
      return Promise.resolve();
    }),
    now: () => new Date("2026-09-26T16:00:00.000Z"),
    ...overrides,
  };
  return { value, rows };
}

const input = {
  shift,
  counted: "7,380",
  totals,
  expected: 723000,
  unsyncedCount: 1,
};

describe("closeShift", () => {
  it("keeps the close on this PC with the counted cash and local summary", async () => {
    const { value, rows } = deps();

    await closeShift(value, input);

    expect(value.update).toHaveBeenCalledWith("shift-1", {
      status: "closed",
      closedAt: "2026-09-26T16:00:00.000Z",
      countedCash: "7380.00",
      syncState: "close_pending",
      closeSummary: {
        bills: 2,
        total_sales: "2880.00",
        cash: "2230.00",
        card: "650.00",
        wallet: "0.00",
        refund_count: 0,
        refund_amount: "0.00",
        cash_refunds: "0.00",
        expected_cash: "7230.00",
        difference: "150.00",
      },
      unsyncedAtClose: 1,
    });
    expect(value.clearHeldBills).toHaveBeenCalledWith("shift-1");
    expect(rows.get("shift-1")?.status).toBe("closed");
  });

  it("returns the server's recomputed result after upload", async () => {
    const { value } = deps();

    await expect(closeShift(value, input)).resolves.toEqual({
      status: "closed",
      server: { expectedCash: "7230.00", difference: "150.00", mismatch: true },
    });
  });

  it("closes offline and leaves the upload for later", async () => {
    const { value, rows } = deps({
      uploadShifts: () => Promise.reject(new TypeError("offline")),
    });

    await expect(closeShift(value, input)).resolves.toEqual({
      status: "closed",
      server: null,
    });
    expect(rows.get("shift-1")?.syncState).toBe("close_pending");
  });

  it("uploads the open first when the shift never reached the server", async () => {
    const { value } = deps({
      uploadShifts: () => Promise.reject(new TypeError("offline")),
    });

    await closeShift(value, {
      ...input,
      shift: { ...shift, syncState: "open_pending" },
    });

    expect(value.update).toHaveBeenCalledWith(
      "shift-1",
      expect.objectContaining({ syncState: "open_pending" }),
    );
  });

  it("records a short drawer as a negative difference", async () => {
    const { value } = deps();

    await closeShift(value, { ...input, counted: "7000" });

    expect(value.update).toHaveBeenCalledWith(
      "shift-1",
      expect.objectContaining({
        closeSummary: expect.objectContaining({
          difference: "-230.00",
        }) as unknown,
      }),
    );
  });

  it("needs the counted cash as a number", async () => {
    const { value } = deps();

    await expect(closeShift(value, { ...input, counted: "" })).resolves.toEqual(
      { status: "invalid_amount" },
    );
    expect(value.update).not.toHaveBeenCalled();
  });
});
