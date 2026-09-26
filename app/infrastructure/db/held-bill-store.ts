import { db as appDb, type MartDeskDatabase } from "./database";
import type { HeldBillRow } from "./rows";

export function createHeldBillStore(database: MartDeskDatabase) {
  return {
    save: async (bill: HeldBillRow) => {
      await database.held_bills.put(bill);
    },
    get: async (id: string) => (await database.held_bills.get(id)) ?? null,
    listForShift: (shiftId: string) =>
      database.held_bills.where("shiftId").equals(shiftId).sortBy("heldAt"),
    countForShift: (shiftId: string) =>
      database.held_bills.where("shiftId").equals(shiftId).count(),
    remove: async (id: string) => {
      await database.held_bills.delete(id);
    },
  };
}

export type HeldBillStore = ReturnType<typeof createHeldBillStore>;

export const heldBillStore = createHeldBillStore(appDb);
