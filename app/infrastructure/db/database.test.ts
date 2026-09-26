import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";

import { MartDeskDatabase } from "./database";

const opened: Dexie[] = [];

function track<T extends Dexie>(database: T): T {
  opened.push(database);
  return database;
}

afterEach(async () => {
  for (const database of opened.splice(0)) {
    database.close();
    await Dexie.delete(database.name);
  }
});

describe("MartDeskDatabase", () => {
  it("has every store from the offline design", async () => {
    const database = track(
      new MartDeskDatabase(`schema-${crypto.randomUUID()}`),
    );
    await database.open();

    expect(database.tables.map((table) => table.name).sort()).toEqual([
      "audit_outbox",
      "bills_outbox",
      "categories",
      "held_bills",
      "meta",
      "products",
      "recent_bills",
      "returns_outbox",
      "shifts",
      "stock",
      "users",
    ]);
  });

  it("keeps the activated device when upgrading from version 1", async () => {
    const name = `upgrade-${crypto.randomUUID()}`;
    const old = new Dexie(name);
    old.version(1).stores({ meta: "key" });
    await old.table("meta").put({ key: "device", value: { token: "t" } });
    old.close();

    const database = track(new MartDeskDatabase(name));

    await expect(database.meta.get("device")).resolves.toEqual({
      key: "device",
      value: { token: "t" },
    });
  });

  it("finds products by barcode and lower-case name", async () => {
    const database = track(
      new MartDeskDatabase(`index-${crypto.randomUUID()}`),
    );
    await database.products.bulkPut([
      {
        id: 1,
        barcode: "8961004500044",
        name: "Fresh Milk 1L",
        nameLc: "fresh milk 1l",
        categoryId: 2,
        unit: "litre",
        price: "290.00",
        isArchived: false,
      },
      {
        id: 2,
        barcode: "8961004500044",
        name: "Old Milk",
        nameLc: "old milk",
        categoryId: 2,
        unit: "litre",
        price: "250.00",
        isArchived: true,
      },
    ]);

    await expect(
      database.products.where("barcode").equals("8961004500044").count(),
    ).resolves.toBe(2);
    await expect(
      database.products.where("nameLc").startsWith("fresh").count(),
    ).resolves.toBe(1);
  });
});
