import { db as appDb, type MartDeskDatabase } from "./database";
import { newOutboxRow } from "./outbox-store";
import type { AuditEventUpload, HeldBillRow } from "./rows";

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
    clearForShift: async (shiftId: string) => {
      await database.held_bills.where("shiftId").equals(shiftId).delete();
    },
    remove: async (id: string) => {
      await database.held_bills.delete(id);
    },
    // The only record of a deleted held bill is this audit event, so both happen together.
    removeWithEvent: (id: string, event: AuditEventUpload, now: number) =>
      database.transaction(
        "rw",
        [database.held_bills, database.audit_outbox],
        async () => {
          await database.held_bills.delete(id);
          await database.audit_outbox.add(newOutboxRow(event, now));
        },
      ),
  };
}

export type HeldBillStore = ReturnType<typeof createHeldBillStore>;

export const heldBillStore = createHeldBillStore(appDb);
