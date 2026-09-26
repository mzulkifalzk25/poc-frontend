import type { ScannedProduct } from "~/domain/bill";

export const MIN_SEARCH_LENGTH = 2;

export interface SearchHit {
  product: ScannedProduct;
  categoryId: number | null;
  stock: string | null;
}

export interface SearchDeps {
  search: (
    query: string,
    limit: number,
  ) => Promise<{
    rows: {
      id: number;
      barcode: string;
      name: string;
      price: string;
      categoryId: number | null;
    }[];
    total: number;
  }>;
  getStock: (productId: number) => Promise<string | null>;
}

// Name or barcode search on this PC's database; never the network.
export async function searchProducts(
  deps: SearchDeps,
  query: string,
  limit: number,
) {
  const text = query.trim();
  if (text.length < MIN_SEARCH_LENGTH) {
    return { hits: [] as SearchHit[], total: 0 };
  }
  const found = await deps.search(text, limit);
  const hits = await Promise.all(
    found.rows.map(async (row): Promise<SearchHit> => ({
      product: {
        productId: row.id,
        barcode: row.barcode,
        name: row.name,
        unitPrice: row.price,
      },
      categoryId: row.categoryId,
      stock: await deps.getStock(row.id),
    })),
  );
  return { hits, total: found.total };
}
