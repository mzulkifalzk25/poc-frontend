import { describe, expect, it } from "vitest";

import { productListPath } from "./product-repository";

describe("productListPath", () => {
  it("sends the page, size and default filters", () => {
    expect(
      productListPath({ search: "", categoryId: null, filter: "all", page: 1 }),
    ).toBe("/products?page=1&page_size=10&stock=all&archived=false");
  });

  it("adds a trimmed search and the category", () => {
    expect(
      productListPath({
        search: " oil ",
        categoryId: 3,
        filter: "low",
        page: 2,
      }),
    ).toBe(
      "/products?page=2&page_size=10&stock=low&archived=false&search=oil&category=3",
    );
  });

  it("asks for archived products with every stock level", () => {
    expect(
      productListPath({
        search: "",
        categoryId: null,
        filter: "archived",
        page: 1,
      }),
    ).toBe("/products?page=1&page_size=10&stock=all&archived=true");
  });
});
