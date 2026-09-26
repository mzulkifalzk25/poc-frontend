import { describe, expect, it } from "vitest";

import type { ProductQuery } from "~/domain/product";

import { paramsFromQuery, queryFromParams } from "./productQuery";

describe("product list query in the URL", () => {
  it("reads defaults from an empty URL", () => {
    expect(queryFromParams(new URLSearchParams())).toEqual({
      search: "",
      categoryId: null,
      filter: "all",
      page: 1,
    });
  });

  it("reads every filter", () => {
    expect(
      queryFromParams(
        new URLSearchParams("search=oil&category=2&stock=low&page=3"),
      ),
    ).toEqual({ search: "oil", categoryId: 2, filter: "low", page: 3 });
  });

  it("ignores values it does not know", () => {
    expect(
      queryFromParams(new URLSearchParams("category=x&stock=gone&page=-4")),
    ).toEqual({ search: "", categoryId: null, filter: "all", page: 1 });
  });

  it("writes only what differs from the defaults", () => {
    expect(
      paramsFromQuery({
        search: "",
        categoryId: 4,
        filter: "archived",
        page: 1,
      }).toString(),
    ).toBe("category=4&stock=archived");
  });

  it("round-trips a full query", () => {
    const query: ProductQuery = {
      search: "rice",
      categoryId: 1,
      filter: "out",
      page: 2,
    };

    expect(queryFromParams(paramsFromQuery(query))).toEqual(query);
  });
});
