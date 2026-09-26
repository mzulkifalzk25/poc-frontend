import type { EntityTable } from "dexie";

import { db as appDb } from "./database";
import type {
  AuditEventUpload,
  BillUpload,
  OutboxRow,
  ReturnUpload,
} from "./rows";

type OutboxTable<P> = EntityTable<OutboxRow<P>, "id">;

export function newOutboxRow<P extends { id: string }>(
  payload: P,
  now: number,
): OutboxRow<P> {
  return {
    id: payload.id,
    payload,
    status: "pending",
    attempts: 0,
    nextTryAt: now,
    createdAt: now,
    errors: [],
  };
}

export function createOutbox<P extends { id: string }>(table: OutboxTable<P>) {
  return {
    add: async (payload: P, now: number) => {
      await table.put(newOutboxRow(payload, now));
    },
    // Oldest first, so uploads keep the order things happened in.
    due: async (now: number, limit: number) =>
      (
        await table
          .orderBy("createdAt")
          .filter((row) => row.status === "pending" && row.nextTryAt <= now)
          .toArray()
      ).slice(0, limit),
    remove: async (ids: string[]) => {
      await table.bulkDelete(ids);
    },
    scheduleRetry: async (ids: string[], nextTryAt: number) => {
      await table
        .where("id")
        .anyOf(ids)
        .modify((row) => {
          row.attempts += 1;
          row.nextTryAt = nextTryAt;
        });
    },
    markRejected: async (id: string, errors: string[]) => {
      await table
        .where("id")
        .equals(id)
        .modify((row) => {
          row.status = "rejected";
          row.errors = errors;
        });
    },
    countPending: () => table.where("status").equals("pending").count(),
    countRejected: () => table.where("status").equals("rejected").count(),
    count: () => table.count(),
  };
}

export type Outbox<P extends { id: string }> = ReturnType<
  typeof createOutbox<P>
>;

export const billsOutbox = createOutbox<BillUpload>(appDb.bills_outbox);
export const returnsOutbox = createOutbox<ReturnUpload>(appDb.returns_outbox);
export const auditOutbox = createOutbox<AuditEventUpload>(appDb.audit_outbox);
