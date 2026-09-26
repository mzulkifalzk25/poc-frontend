import type { ShiftRow, ShiftServerResult } from "~/infrastructure/db/rows";
import type { ShiftStore } from "~/infrastructure/db/shift-store";

export interface ShiftUploadApi {
  open: (shift: ShiftRow) => Promise<void>;
  close: (shift: ShiftRow) => Promise<ShiftServerResult>;
}

export interface UploadShiftsDeps {
  shifts: Pick<ShiftStore, "waitingUpload" | "update">;
  api: ShiftUploadApi;
}

// Opens go first, then closes; a network error stops the run and it is retried later.
export async function uploadPendingShifts(
  deps: UploadShiftsDeps,
): Promise<number> {
  let sent = 0;
  for (const shift of (await deps.shifts.waitingUpload()).filter(
    (row) => row.syncState === "open_pending",
  )) {
    await deps.api.open(shift);
    await deps.shifts.update(shift.id, {
      syncState: shift.status === "open" ? "open_synced" : "close_pending",
    });
    sent += 1;
  }
  for (const shift of (await deps.shifts.waitingUpload()).filter(
    (row) => row.syncState === "close_pending",
  )) {
    const serverResult = await deps.api.close(shift);
    await deps.shifts.update(shift.id, {
      syncState: "closed_synced",
      serverResult,
    });
    sent += 1;
  }
  return sent;
}
