import { describe, expect, it } from "vitest";

import { META_KEYS } from "./meta-keys";
import { createSaleStore } from "./sale-store";
import { completedBill, freshDatabaseFactory } from "./test-database";

const freshDatabase = freshDatabaseFactory();

describe("sale store", () => {
  it("writes the outbox, stock, bill sequence and recent bill together", async () => {
    const database = freshDatabase();
    await database.stock.put({ productId: 4, qty: "10.000" });
    await database.meta.put({ key: META_KEYS.billSeq, value: 742 });

    await createSaleStore(database).recordSale(completedBill("bill-1"), 1000);

    expect(await database.bills_outbox.get("bill-1")).toMatchObject({
      status: "pending",
      nextTryAt: 1000,
      payload: { bill_no: "002000743" },
    });
    expect(await database.stock.get(4)).toEqual({ productId: 4, qty: "8.000" });
    expect(await database.stock.get(1)).toEqual({
      productId: 1,
      qty: "-1.000",
    });
    expect((await database.meta.get(META_KEYS.billSeq))?.value).toBe(743);
    expect(await database.recent_bills.get("bill-1")).toMatchObject({
      billNo: "002000743",
      shiftId: "shift-1",
    });
  });

  it("never moves the bill sequence backwards", async () => {
    const database = freshDatabase();
    await database.meta.put({ key: META_KEYS.billSeq, value: 800 });

    await createSaleStore(database).recordSale(completedBill("bill-1"), 1000);

    expect((await database.meta.get(META_KEYS.billSeq))?.value).toBe(800);
  });

  it("writes nothing when any part fails", async () => {
    const database = freshDatabase();
    await database.stock.put({ productId: 4, qty: "10.000" });
    const store = createSaleStore(database);
    await store.recordSale(completedBill("bill-1"), 1000);

    await expect(
      store.recordSale(completedBill("bill-1", { billNo: "002000744" }), 2000),
    ).rejects.toThrow();

    expect(await database.stock.get(4)).toEqual({ productId: 4, qty: "8.000" });
    expect((await database.meta.get(META_KEYS.billSeq))?.value).toBe(743);
    expect(await database.bills_outbox.count()).toBe(1);
  });
});
