import { liveQuery } from "dexie";

import { db as appDb, type MartDeskDatabase } from "../db/database";

export interface OutboxStatus {
  pending: number;
  rejected: number;
}

async function readStatus(database: MartDeskDatabase): Promise<OutboxStatus> {
  const pending =
    (await database.bills_outbox.where("status").equals("pending").count()) +
    (await database.returns_outbox.where("status").equals("pending").count());
  const rejected =
    (await database.bills_outbox.where("status").equals("rejected").count()) +
    (await database.returns_outbox.where("status").equals("rejected").count());
  return { pending, rejected };
}

// Sales and returns still on this PC; updates whenever either outbox changes.
export function watchOutboxStatus(
  onChange: (status: OutboxStatus) => void,
  database: MartDeskDatabase = appDb,
): () => void {
  const subscription = liveQuery(() => readStatus(database)).subscribe({
    next: onChange,
  });
  return () => {
    subscription.unsubscribe();
  };
}
