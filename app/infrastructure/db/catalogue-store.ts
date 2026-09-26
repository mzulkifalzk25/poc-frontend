import { db as appDb, type MartDeskDatabase } from "./database";
import type { CategoryRow, ProductRow, StockRow } from "./rows";

export interface SearchResult {
  rows: ProductRow[];
  total: number;
}

function matches(product: ProductRow, query: string): boolean {
  return (
    !product.isArchived &&
    (product.nameLc.includes(query) || product.barcode.startsWith(query))
  );
}

export function createCatalogueStore(database: MartDeskDatabase) {
  return {
    // Archived products stay as tombstones so held bills can still show them.
    applyProducts: async (rows: ProductRow[]) => {
      await database.products.bulkPut(rows);
    },
    applyCategories: async (rows: CategoryRow[]) => {
      await database.categories.bulkPut(rows);
    },
    applyStock: async (rows: StockRow[]) => {
      await database.stock.bulkPut(rows);
    },
    findByBarcode: async (barcode: string): Promise<ProductRow | null> => {
      const rows = await database.products
        .where("barcode")
        .equals(barcode)
        .toArray();
      return rows.find((row) => !row.isArchived) ?? null;
    },
    getProduct: async (id: number) => (await database.products.get(id)) ?? null,
    search: async (text: string, limit: number): Promise<SearchResult> => {
      const query = text.trim().toLowerCase();
      if (query === "") {
        return { rows: [], total: 0 };
      }
      const found = await database.products
        .filter((row) => matches(row, query))
        .toArray();
      found.sort((a, b) => a.nameLc.localeCompare(b.nameLc));
      return { rows: found.slice(0, limit), total: found.length };
    },
    byCategory: async (categoryId: number, limit: number) =>
      (
        await database.products
          .where("categoryId")
          .equals(categoryId)
          .filter((row) => !row.isArchived)
          .sortBy("nameLc")
      ).slice(0, limit),
    categories: () => database.categories.toArray(),
    countLive: () => database.products.filter((row) => !row.isArchived).count(),
    getStock: async (productId: number) =>
      (await database.stock.get(productId))?.qty ?? null,
  };
}

export type CatalogueStore = ReturnType<typeof createCatalogueStore>;

export const catalogueStore = createCatalogueStore(appDb);
