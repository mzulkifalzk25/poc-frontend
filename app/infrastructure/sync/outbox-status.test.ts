import { describe, expect, it, vi } from "vitest";

import { createOutbox } from "../db/outbox-store";
import { billUpload, freshDatabaseFactory } from "../db/test-database";
import { watchOutboxStatus, type OutboxStatus } from "./outbox-status";

const freshDatabase = freshDatabaseFactory();

describe("watchOutboxStatus", () => {
  it("reports pending and rejected sales and follows changes", async () => {
    const database = freshDatabase();
    const outbox = createOutbox(database.bills_outbox);
    const seen: OutboxStatus[] = [];
    const stop = watchOutboxStatus((status) => seen.push(status), database);

    await vi.waitFor(() => {
      expect(seen.at(-1)).toEqual({ pending: 0, rejected: 0 });
    });
    await outbox.add(billUpload("a"), 1);
    await outbox.add(billUpload("b"), 2);
    await outbox.markRejected("b", ["bad"]);

    await vi.waitFor(() => {
      expect(seen.at(-1)).toEqual({ pending: 1, rejected: 1 });
    });
    stop();
  });
});
