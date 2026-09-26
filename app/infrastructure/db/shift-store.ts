import { db as appDb, type MartDeskDatabase } from "./database";
import type { ShiftRow } from "./rows";

export function createShiftStore(database: MartDeskDatabase) {
  return {
    save: async (shift: ShiftRow) => {
      await database.shifts.put(shift);
    },
    get: async (id: string) => (await database.shifts.get(id)) ?? null,
    current: async (counterId: number): Promise<ShiftRow | null> =>
      (await database.shifts
        .where("status")
        .equals("open")
        .filter((row) => row.counterId === counterId)
        .first()) ?? null,
    update: async (id: string, changes: Partial<ShiftRow>) => {
      await database.shifts.update(id, changes);
    },
    waitingUpload: () =>
      database.shifts
        .where("syncState")
        .anyOf("open_pending", "close_pending")
        .toArray(),
  };
}

export type ShiftStore = ReturnType<typeof createShiftStore>;

export const shiftStore = createShiftStore(appDb);
