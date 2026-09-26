import { describe, expect, it, vi } from "vitest";

import { searchProducts, type SearchDeps } from "./search-products";

function deps(): SearchDeps {
  return {
    search: vi.fn(() =>
      Promise.resolve({
        rows: [
          {
            id: 1,
            barcode: "8961004500044",
            name: "Fresh Milk 1L",
            price: "290.00",
            categoryId: 2,
          },
        ],
        total: 5,
      }),
    ),
    getStock: () => Promise.resolve("120.000"),
  };
}

describe("searchProducts", () => {
  it("returns the hits with their stock and the full match count", async () => {
    const result = await searchProducts(deps(), " mil ", 8);

    expect(result).toEqual({
      total: 5,
      hits: [
        {
          product: {
            productId: 1,
            barcode: "8961004500044",
            name: "Fresh Milk 1L",
            unitPrice: "290.00",
          },
          categoryId: 2,
          stock: "120.000",
        },
      ],
    });
  });

  it("waits for two characters", async () => {
    const search = deps();

    await expect(searchProducts(search, "m", 8)).resolves.toEqual({
      hits: [],
      total: 0,
    });
    expect(search.search).not.toHaveBeenCalled();
  });
});
