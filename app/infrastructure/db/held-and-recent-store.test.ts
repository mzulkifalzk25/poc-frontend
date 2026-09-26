import { describe, expect, it } from "vitest";

import { createHeldBillStore } from "./held-bill-store";
import { createRecentBillStore } from "./recent-bill-store";
import {
  completedBill,
  freshDatabaseFactory,
  recentBillRow,
} from "./test-database";

const freshDatabase = freshDatabaseFactory();

describe("held bill store", () => {
  it("lists the held bills of a shift in the order they were held", async () => {
    const store = createHeldBillStore(freshDatabase());
    const base = { cashierId: 12, lines: [], itemCount: 0, total: "0.00" };
    await store.save({
      ...base,
      id: "h2",
      shiftId: "s1",
      title: "Blue kurta",
      heldAt: "2026-09-26T10:05:00Z",
    });
    await store.save({
      ...base,
      id: "h1",
      shiftId: "s1",
      title: "Ahmed",
      heldAt: "2026-09-26T10:00:00Z",
    });
    await store.save({
      ...base,
      id: "h3",
      shiftId: "s0",
      title: "Old",
      heldAt: "2026-09-25T10:00:00Z",
    });

    const held = await store.listForShift("s1");

    expect(held.map((row) => row.id)).toEqual(["h1", "h2"]);
    await store.remove("h1");
    await expect(store.countForShift("s1")).resolves.toBe(1);
  });
});

describe("deleting a held bill", () => {
  it("removes it and queues the audit event in one transaction", async () => {
    const database = freshDatabase();
    const store = createHeldBillStore(database);
    const base = { cashierId: 12, lines: [], itemCount: 0, total: "0.00" };
    await store.save({
      ...base,
      id: "h1",
      shiftId: "s1",
      title: "Ahmed",
      heldAt: "2026-09-26T10:00:00Z",
    });

    await store.removeWithEvent(
      "h1",
      {
        id: "e1",
        action: "held_bill_deleted",
        occurred_at: "2026-09-26T10:05:00Z",
      },
      5,
    );

    expect(await store.get("h1")).toBeNull();
    expect(await database.audit_outbox.get("e1")).toMatchObject({
      status: "pending",
      payload: { action: "held_bill_deleted" },
    });
  });

  it("keeps the held bill when the event cannot be queued", async () => {
    const database = freshDatabase();
    const store = createHeldBillStore(database);
    const base = { cashierId: 12, lines: [], itemCount: 0, total: "0.00" };
    await store.save({
      ...base,
      id: "h1",
      shiftId: "s1",
      title: "Ahmed",
      heldAt: "2026-09-26T10:00:00Z",
    });
    const event = {
      id: "e1",
      action: "held_bill_deleted" as const,
      occurred_at: "2026-09-26T10:05:00Z",
    };
    await database.audit_outbox.add({
      id: "e1",
      payload: event,
      status: "pending",
      attempts: 0,
      nextTryAt: 0,
      createdAt: 0,
      errors: [],
    });

    await expect(store.removeWithEvent("h1", event, 5)).rejects.toThrow();

    expect(await store.get("h1")).not.toBeNull();
  });
});

describe("recent bill store", () => {
  it("finds a bill by number and drops bills older than 7 days", async () => {
    const store = createRecentBillStore(freshDatabase());
    await store.save(
      recentBillRow(completedBill("a", { soldAt: "2026-09-26T10:00:00Z" })),
    );
    await store.save(
      recentBillRow(
        completedBill("b", {
          billNo: "002000700",
          soldAt: "2026-09-18T10:00:00Z",
        }),
      ),
    );

    await expect(store.findByNo("002000743")).resolves.toMatchObject({
      id: "a",
    });
    await expect(store.prune(new Date("2026-09-26T12:00:00Z"))).resolves.toBe(
      1,
    );
    await expect(store.get("b")).resolves.toBeNull();
    await expect(store.forShift("shift-1")).resolves.toHaveLength(1);
  });
});
