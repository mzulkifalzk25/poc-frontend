import type { ShiftRow } from "~/infrastructure/db/rows";
import type { ShiftStore } from "~/infrastructure/db/shift-store";

export interface ShiftUploadApi {
  open: (shift: ShiftRow) => Promise<void>;
}

export interface UploadShiftsDeps {
  shifts: Pick<ShiftStore, "waitingUpload" | "update">;
  api: ShiftUploadApi;
}

// Sends shifts opened on this PC; a network error stops the run and it is retried later.
export async function uploadPendingShifts(
  deps: UploadShiftsDeps,
): Promise<number> {
  const waiting = await deps.shifts.waitingUpload();
  let sent = 0;
  for (const shift of waiting.filter(
    (row) => row.syncState === "open_pending",
  )) {
    await deps.api.open(shift);
    await deps.shifts.update(shift.id, {
      syncState: shift.status === "open" ? "open_synced" : "close_pending",
    });
    sent += 1;
  }
  return sent;
}
