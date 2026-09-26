import { fromPaisa, toPaisa } from "~/domain/paisa";
import { parseAmountInput } from "~/domain/product-draft";
import { checkDrawer, type ShiftTotals } from "~/domain/shift-totals";
import type { ShiftRow, ShiftServerResult } from "~/infrastructure/db/rows";

export interface CloseShiftDeps {
  update: (id: string, changes: Partial<ShiftRow>) => Promise<void>;
  get: (id: string) => Promise<ShiftRow | null>;
  clearHeldBills: (shiftId: string) => Promise<void>;
  uploadShifts: () => Promise<unknown>;
  now: () => Date;
}

export interface CloseShiftInput {
  shift: ShiftRow;
  counted: string;
  totals: ShiftTotals;
  expected: number;
  unsyncedCount: number;
}

export type CloseShiftResult =
  | { status: "closed"; server: ShiftServerResult | null }
  | { status: "invalid_amount" };

function summary(
  input: CloseShiftInput,
  counted: number,
): Record<string, string | number> {
  const { totals } = input;
  const drawer = checkDrawer(counted, input.expected);
  return {
    bills: totals.bills,
    total_sales: fromPaisa(totals.totalSales),
    cash: fromPaisa(totals.byMethod.cash),
    card: fromPaisa(totals.byMethod.card),
    wallet: fromPaisa(totals.byMethod.wallet),
    refund_count: totals.refundCount,
    refund_amount: fromPaisa(totals.refundAmount),
    cash_refunds: fromPaisa(totals.cashRefunds),
    expected_cash: fromPaisa(input.expected),
    difference: fromPaisa(
      drawer.status === "short" ? -drawer.difference : drawer.difference,
    ),
  };
}

// Closing works offline: the close is kept on this PC and the server recomputes it on upload.
export async function closeShift(
  deps: CloseShiftDeps,
  input: CloseShiftInput,
): Promise<CloseShiftResult> {
  const countedText = parseAmountInput(input.counted, 2);
  if (countedText === null) {
    return { status: "invalid_amount" };
  }
  const { shift } = input;
  await deps.update(shift.id, {
    status: "closed",
    closedAt: deps.now().toISOString(),
    countedCash: countedText,
    syncState:
      shift.syncState === "open_pending" ? "open_pending" : "close_pending",
    closeSummary: summary(input, toPaisa(countedText)),
    unsyncedAtClose: input.unsyncedCount,
  });
  await deps.clearHeldBills(shift.id);
  try {
    await deps.uploadShifts();
  } catch {
    return { status: "closed", server: null };
  }
  return {
    status: "closed",
    server: (await deps.get(shift.id))?.serverResult ?? null,
  };
}
