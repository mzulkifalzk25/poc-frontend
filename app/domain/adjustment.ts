import { parseAmountInput } from "./product-draft";

export const ADJUST_MODES = ["add", "remove", "set"] as const;
export type AdjustMode = (typeof ADJUST_MODES)[number];

export const ADJUST_REASONS = [
  "received",
  "damaged",
  "expired",
  "stolen_lost",
  "count_correction",
] as const;
export type AdjustReason = (typeof ADJUST_REASONS)[number];

export interface AdjustDraft {
  mode: AdjustMode;
  qty: string;
  reason: AdjustReason;
  note: string;
}

export interface AdjustPayload {
  mode: AdjustMode;
  qty: string;
  reason: AdjustReason;
  note: string;
}

export type AdjustError = "required" | "invalid_amount" | "must_be_positive";

export type AdjustValidation =
  { ok: true; payload: AdjustPayload } | { ok: false; error: AdjustError };

export function validateAdjustment(draft: AdjustDraft): AdjustValidation {
  if (draft.qty.trim() === "") {
    return { ok: false, error: "required" };
  }
  const qty = parseAmountInput(draft.qty, 3);
  if (qty === null) {
    return { ok: false, error: "invalid_amount" };
  }
  if (draft.mode !== "set" && Number(qty) <= 0) {
    return { ok: false, error: "must_be_positive" };
  }
  return {
    ok: true,
    payload: {
      mode: draft.mode,
      qty,
      reason: draft.reason,
      note: draft.note.trim(),
    },
  };
}

// "Stock after this change"; null while the quantity is not a valid number.
export function stockAfter(
  mode: AdjustMode,
  qtyText: string,
  before: string,
): number | null {
  const qty = parseAmountInput(qtyText, 3);
  if (qty === null) {
    return null;
  }
  const amount = Number(qty);
  if (mode === "set") {
    return amount;
  }
  return mode === "add" ? Number(before) + amount : Number(before) - amount;
}
