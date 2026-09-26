import { describe, expect, it } from "vitest";

import { pageWindow } from "./paging";

describe("pageWindow", () => {
  it("covers the first page", () => {
    expect(pageWindow(1, 10, 18462)).toEqual({
      from: 1,
      to: 10,
      pageCount: 1847,
      hasPrevious: false,
      hasNext: true,
    });
  });

  it("stops the last page at the total", () => {
    expect(pageWindow(1847, 10, 18462)).toEqual({
      from: 18461,
      to: 18462,
      pageCount: 1847,
      hasPrevious: true,
      hasNext: false,
    });
  });

  it("has one page and nothing to show when the list is empty", () => {
    expect(pageWindow(1, 10, 0)).toEqual({
      from: 0,
      to: 0,
      pageCount: 1,
      hasPrevious: false,
      hasNext: false,
    });
  });

  it("fits an exact multiple of the page size", () => {
    expect(pageWindow(2, 10, 20)).toMatchObject({
      from: 11,
      to: 20,
      pageCount: 2,
      hasNext: false,
    });
  });

  it.each([
    [0, 10, 5],
    [1, 0, 5],
    [1, 10, -1],
  ])("rejects page %i, size %i, total %i", (page, size, total) => {
    expect(() => pageWindow(page, size, total)).toThrow();
  });
});
