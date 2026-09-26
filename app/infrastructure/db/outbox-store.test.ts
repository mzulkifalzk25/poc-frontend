import { describe, expect, it } from "vitest";

import { createOutbox } from "./outbox-store";
import { billUpload, freshDatabaseFactory } from "./test-database";

const freshDatabase = freshDatabaseFactory();

describe("outbox store", () => {
  it("hands out due bills oldest first and up to the limit", async () => {
    const outbox = createOutbox(freshDatabase().bills_outbox);
    await outbox.add(billUpload("b"), 200);
    await outbox.add(billUpload("a"), 100);
    await outbox.add(billUpload("c"), 300);

    const due = await outbox.due(250, 50);

    expect(due.map((row) => row.id)).toEqual(["a", "b"]);
    await expect(outbox.due(1000, 2)).resolves.toHaveLength(2);
  });

  it("waits until the retry time", async () => {
    const outbox = createOutbox(freshDatabase().bills_outbox);
    await outbox.add(billUpload("a"), 100);
    await outbox.scheduleRetry(["a"], 5000);

    await expect(outbox.due(4999, 50)).resolves.toEqual([]);
    const [row] = await outbox.due(5000, 50);
    expect(row).toMatchObject({ id: "a", attempts: 1, nextTryAt: 5000 });
  });

  it("keeps rejected bills but stops sending them", async () => {
    const outbox = createOutbox(freshDatabase().bills_outbox);
    await outbox.add(billUpload("a"), 100);
    await outbox.add(billUpload("b"), 100);
    await outbox.markRejected("a", ["items: bad qty"]);

    await expect(outbox.due(1000, 50)).resolves.toHaveLength(1);
    await expect(outbox.countPending()).resolves.toBe(1);
    await expect(outbox.countRejected()).resolves.toBe(1);
    await expect(outbox.count()).resolves.toBe(2);
  });

  it("removes bills once the server has them", async () => {
    const outbox = createOutbox(freshDatabase().bills_outbox);
    await outbox.add(billUpload("a"), 100);
    await outbox.add(billUpload("b"), 100);
    await outbox.remove(["a"]);

    await expect(outbox.count()).resolves.toBe(1);
  });

  it("is idempotent on the client id", async () => {
    const outbox = createOutbox(freshDatabase().bills_outbox);
    await outbox.add(billUpload("a"), 100);
    await outbox.add(billUpload("a"), 200);

    await expect(outbox.count()).resolves.toBe(1);
  });
});
