import { liveQuery } from "dexie";

import type { DeleteHeldDeps, HeldBillDeps } from "~/use_cases/held-bills";

import { db } from "../db/database";
import { counterClock } from "../clock";
import { heldBillStore } from "../db/held-bill-store";
import { notifyOutboxChanged } from "./outbox-events";

export const heldBillDeps: HeldBillDeps = {
  save: heldBillStore.save,
  get: heldBillStore.get,
  remove: heldBillStore.remove,
};

export const deleteHeldDeps: DeleteHeldDeps = {
  get: heldBillStore.get,
  removeWithEvent: heldBillStore.removeWithEvent,
  onQueued: notifyOutboxChanged,
  now: () => counterClock.now(),
  newId: () => crypto.randomUUID(),
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
