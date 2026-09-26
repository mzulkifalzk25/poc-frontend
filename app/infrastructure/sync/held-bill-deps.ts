import { liveQuery } from "dexie";

import type { HeldBillDeps } from "~/use_cases/held-bills";

import { db } from "../db/database";
import { heldBillStore } from "../db/held-bill-store";

export const heldBillDeps: HeldBillDeps = {
  save: heldBillStore.save,
  get: heldBillStore.get,
  remove: heldBillStore.remove,
};

// Live number of bills on hold for this shift, for the top bar.
export function watchHeldCount(
  shiftId: string,
  onChange: (count: number) => void,
): () => void {
  const subscription = liveQuery(() =>
    db.held_bills.where("shiftId").equals(shiftId).count(),
  ).subscribe({
    next: onChange,
  });
  return () => {
    subscription.unsubscribe();
  };
}
