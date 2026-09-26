import { billTotals, type DraftLine, type TaxRule } from "~/domain/bill";
import { fromPaisa } from "~/domain/paisa";
import type { AuditEventUpload, HeldBillRow } from "~/infrastructure/db/rows";

export interface HoldBillInput {
  id: string;
  shiftId: string;
  cashierId: number;
  title: string;
  lines: DraftLine[];
  taxRule: TaxRule;
  heldAt: string;
}

export interface HeldBillDeps {
  save: (bill: HeldBillRow) => Promise<void>;
  get: (id: string) => Promise<HeldBillRow | null>;
  remove: (id: string) => Promise<void>;
}

export type HoldResult =
  { status: "held"; bill: HeldBillRow } | { status: "empty" };

// Held bills stay on this counter and keep the prices they were scanned at.
export async function holdBill(
  deps: HeldBillDeps,
  input: HoldBillInput,
): Promise<HoldResult> {
  if (input.lines.length === 0) {
    return { status: "empty" };
  }
  const totals = billTotals(input.lines, input.taxRule);
  const bill: HeldBillRow = {
    id: input.id,
    shiftId: input.shiftId,
    cashierId: input.cashierId,
    title: input.title.trim(),
    lines: input.lines.map((line) => ({ ...line, qty: String(line.qty) })),
    itemCount: totals.itemCount,
    total: fromPaisa(totals.total),
    heldAt: input.heldAt,
  };
  await deps.save(bill);
  return { status: "held", bill };
}

export type RecallResult =
  | { status: "recalled"; lines: DraftLine[] }
  | { status: "missing" }
  | { status: "busy" };

// A recall never throws away a bill that is being scanned.
export async function recallBill(
  deps: HeldBillDeps,
  id: string,
  currentLines: DraftLine[],
): Promise<RecallResult> {
  if (currentLines.length > 0) {
    return { status: "busy" };
  }
  const bill = await deps.get(id);
  if (!bill) {
    return { status: "missing" };
  }
  await deps.remove(id);
  return {
    status: "recalled",
    lines: bill.lines.map((line) => ({ ...line, qty: Number(line.qty) })),
  };
}

export interface DeleteHeldDeps {
  get: (id: string) => Promise<HeldBillRow | null>;
  removeWithEvent: (
    id: string,
    event: AuditEventUpload,
    now: number,
  ) => Promise<void>;
  onQueued: () => void;
  now: () => Date;
  newId: () => string;
}

// A deleted held bill is always reported to the owner through the activity log.
export async function deleteHeldBill(
  deps: DeleteHeldDeps,
  id: string,
): Promise<boolean> {
  const bill = await deps.get(id);
  if (!bill) {
    return false;
  }
  const now = deps.now();
  await deps.removeWithEvent(
    id,
    {
      id: deps.newId(),
      action: "held_bill_deleted",
      occurred_at: now.toISOString(),
      entity_type: "held_bill",
      entity_id: bill.id,
      detail: {
        title: bill.title,
        total: bill.total,
        item_count: bill.itemCount,
      },
    },
    now.getTime(),
  );
  deps.onQueued();
  return true;
}
