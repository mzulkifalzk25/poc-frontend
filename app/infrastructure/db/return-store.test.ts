import { describe, expect, it } from "vitest";

import type { CompletedReturn } from "~/domain/return";

import { createReturnStore } from "./return-store";
import { freshDatabaseFactory } from "./test-database";

const freshDatabase = freshDatabaseFactory();

function completedReturn(
  overrides: Partial<CompletedReturn> = {},
): CompletedReturn {
  return {
    id: "ret-1",
    shiftId: "shift-1",
    lines: [
      {
        productId: 6,
        barcode: "8961006700066",
        name: "Eggs (dozen)",
        unitPrice: "420.00",
        todayPrice: "420.00",
        qty: 2,
        source: "today",
        changed: false,
        notOnBill: false,
      },
    ],
    itemCount: 2,
    reason: "changed_mind",
    restock: true,
    method: "cash",
    refund: 84_000,
    billNo: null,
    returnedAt: "2026-09-26T12:52:10.000Z",
    ...overrides,
  };
}

async function withShift() {
  const database = freshDatabase();
  await database.shifts.put({
    id: "shift-1",
    counterId: 2,
    cashierId: 12,
    cashierName: "Zainab Khan",
    openedAt: "2026-09-26T04:00:00Z",
    openingCash: "5000.00",
    status: "open",
    closedAt: null,
    countedCash: null,
    syncState: "open_synced",
  });
  await database.stock.put({ productId: 6, qty: "-1.000" });
  return database;
}

describe("return store", () => {
  it("queues the return, restocks and takes a cash refund off the drawer", async () => {
    const database = await withShift();

    await createReturnStore(database).recordReturn(completedReturn(), 1000);

    expect(await database.returns_outbox.get("ret-1")).toMatchObject({
      status: "pending",
      payload: {
        lines: [{ product_id: 6, qty: "2.000" }],
        refund: { method: "cash", amount: "840.00" },
      },
    });
    expect(await database.stock.get(6)).toEqual({ productId: 6, qty: "1.000" });
    expect((await database.shifts.get("shift-1"))?.refunds).toEqual([
      { amount: 84_000, paidFromDrawer: true },
    ]);
  });

  it("leaves stock alone for damaged goods and keeps card refunds out of the drawer", async () => {
    const database = await withShift();

    await createReturnStore(database).recordReturn(
      completedReturn({
        restock: false,
        reason: "expired_damaged",
        method: "card",
      }),
      1000,
    );

    expect(await database.stock.get(6)).toEqual({
      productId: 6,
      qty: "-1.000",
    });
    expect((await database.shifts.get("shift-1"))?.refunds).toEqual([
      { amount: 84_000, paidFromDrawer: false },
    ]);
  });

  it("writes nothing when the shift is missing", async () => {
    const database = await withShift();

    await expect(
      createReturnStore(database).recordReturn(
        completedReturn({ shiftId: "nope" }),
        1000,
      ),
    ).rejects.toThrow();

    expect(await database.returns_outbox.count()).toBe(0);
    expect(await database.stock.get(6)).toEqual({
      productId: 6,
      qty: "-1.000",
    });
  });
});
