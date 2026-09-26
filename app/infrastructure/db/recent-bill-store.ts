import { db as appDb, type MartDeskDatabase } from "./database";
import type { RecentBillRow } from "./rows";

export const RECENT_BILL_DAYS = 7;

export function createRecentBillStore(database: MartDeskDatabase) {
  return {
    save: async (row: RecentBillRow) => {
      await database.recent_bills.put(row);
    },
    get: async (id: string) => (await database.recent_bills.get(id)) ?? null,
    // Only bills from the last 7 days count, even before the old ones are pruned.
    findRecent: async (billNo: string, now: Date) => {
      const row = await database.recent_bills
        .where("billNo")
        .equals(billNo)
        .first();
      const cutoff = now.getTime() - RECENT_BILL_DAYS * 86_400_000;
      return row && Date.parse(row.soldAt) >= cutoff ? row.bill : null;
    },
    findByNo: async (billNo: string) =>
      (await database.recent_bills.where("billNo").equals(billNo).first()) ??
      null,
    forShift: (shiftId: string) =>
      database.recent_bills.filter((row) => row.shiftId === shiftId).toArray(),
    // Keeps this counter's bills for 7 days, for reprints and returns.
    prune: async (now: Date) => {
      const cutoff = new Date(
        now.getTime() - RECENT_BILL_DAYS * 86_400_000,
      ).toISOString();
      return database.recent_bills.where("soldAt").below(cutoff).delete();
    },
  };
}

export type RecentBillStore = ReturnType<typeof createRecentBillStore>;

export const recentBillStore = createRecentBillStore(appDb);
