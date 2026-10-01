import { describe, expect, it } from "vitest";

import { paramsFromQuery, queryFromParams } from "./inventoryQuery";

describe("inventory query", () => {
  it("reads defaults from empty params", () => {
    expect(queryFromParams(new URLSearchParams())).toEqual({
      filter: "all",
      search: "",
      page: 1,
    });
  });

  it("round-trips a filter, search and page", () => {
    const query = { filter: "low", search: "rice", page: 3 } as const;

    expect(queryFromParams(paramsFromQuery(query))).toEqual(query);
  });

  it("ignores an unknown filter or a bad page", () => {
    expect(
      queryFromParams(new URLSearchParams("stock=weird&page=-2")),
    ).toMatchObject({ filter: "all", page: 1 });
  });
});
