import { describe, expect, it } from "vitest";

import { createCatalogueStore } from "./catalogue-store";
import { productRow, freshDatabaseFactory } from "./test-database";

const freshDatabase = freshDatabaseFactory();

async function seeded() {
  const store = createCatalogueStore(freshDatabase());
  await store.applyProducts([
    productRow(1, {
      name: "Fresh Milk 1L",
      barcode: "8961004500044",
      categoryId: 2,
    }),
    productRow(2, { name: "Milk Powder 400g", categoryId: 2 }),
    productRow(3, { name: "Sugar 1kg", categoryId: 1 }),
    productRow(4, { name: "Milky Bar", categoryId: 4, isArchived: true }),
  ]);
  return store;
}

describe("catalogue store", () => {
  it("finds a live product by barcode", async () => {
    const store = await seeded();

    await expect(store.findByBarcode("8961004500044")).resolves.toMatchObject({
      id: 1,
    });
    await expect(store.findByBarcode("0000")).resolves.toBeNull();
  });

  it("does not sell an archived product but keeps its tombstone", async () => {
    const store = await seeded();
    await store.applyProducts([
      productRow(1, {
        name: "Fresh Milk 1L",
        barcode: "8961004500044",
        isArchived: true,
      }),
    ]);

    await expect(store.findByBarcode("8961004500044")).resolves.toBeNull();
    await expect(store.getProduct(1)).resolves.toMatchObject({
      isArchived: true,
    });
    await expect(store.countLive()).resolves.toBe(2);
  });

  it("searches live products by part of the name or barcode start", async () => {
    const store = await seeded();

    const byName = await store.search(" MIL", 1);
    expect(byName.total).toBe(2);
    expect(byName.rows.map((row) => row.name)).toEqual(["Fresh Milk 1L"]);
    await expect(store.search("896100450", 5)).resolves.toMatchObject({
      total: 1,
    });
    await expect(store.search("  ", 5)).resolves.toEqual({
      rows: [],
      total: 0,
    });
  });

  it("lists a category's live products by name", async () => {
    const store = await seeded();

    const rows = await store.byCategory(2, 10);

    expect(rows.map((row) => row.id)).toEqual([1, 2]);
  });

  it("stores categories and stock levels", async () => {
    const store = await seeded();
    await store.applyCategories([
      { id: 2, name: "Dairy & eggs", tint: "dairy" },
    ]);
    await store.applyStock([{ productId: 1, qty: "-2.000" }]);

    await expect(store.categories()).resolves.toEqual([
      { id: 2, name: "Dairy & eggs", tint: "dairy" },
    ]);
    await expect(store.getStock(1)).resolves.toBe("-2.000");
    await expect(store.getStock(3)).resolves.toBeNull();
  });
});
