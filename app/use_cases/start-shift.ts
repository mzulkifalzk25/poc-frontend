import { parseAmountInput } from "~/domain/product-draft";
import type { ShiftRow } from "~/infrastructure/db/rows";
import type { ShiftStore } from "~/infrastructure/db/shift-store";

export interface StartShiftDeps {
  shifts: Pick<ShiftStore, "current" | "save">;
  firstSyncDone: () => Promise<boolean>;
  counterId: () => Promise<number | null>;
  now: () => Date;
  newId: () => string;
}

export interface StartShiftInput {
  cashierId: number;
  cashierName: string;
  openingCash: string;
}

export type StartShiftResult =
  | { status: "started" | "resumed"; shiftId: string }
  | { status: "invalid_amount" }
  | { status: "not_synced" }
  | { status: "other_open"; cashierName: string }
  | { status: "no_counter" };

// Opens a shift on this PC first; the server hears about it when it can (uploadPendingShifts).
export async function startShift(
  deps: StartShiftDeps,
  input: StartShiftInput,
): Promise<StartShiftResult> {
  const counterId = await deps.counterId();
  if (counterId === null) {
    return { status: "no_counter" };
  }
  const open = await deps.shifts.current(counterId);
  if (open) {
    return open.cashierId === input.cashierId
      ? { status: "resumed", shiftId: open.id }
      : { status: "other_open", cashierName: open.cashierName };
  }
  const openingCash = parseAmountInput(input.openingCash, 2);
  if (openingCash === null) {
    return { status: "invalid_amount" };
  }
  if (!(await deps.firstSyncDone())) {
    return { status: "not_synced" };
  }
  const shift: ShiftRow = {
    id: deps.newId(),
    counterId,
    cashierId: input.cashierId,
    cashierName: input.cashierName,
    openedAt: deps.now().toISOString(),
    openingCash,
    status: "open",
    closedAt: null,
    countedCash: null,
    syncState: "open_pending",
  };
  await deps.shifts.save(shift);
  return { status: "started", shiftId: shift.id };
}
