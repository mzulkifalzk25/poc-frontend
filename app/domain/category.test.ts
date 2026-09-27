import { describe, expect, it } from "vitest";

import {
  categoryLetter,
  cleanCategoryName,
  isCategoryTint,
  nextUnusedTint,
  totalProductCount,
  type Category,
} from "./category";

function category(id: number, tint: string, productCount = 0): Category {
  return { id, name: `Category ${String(id)}`, tint, productCount };
}

describe("category rules", () => {
  it("knows the seven design tints", () => {
    expect(isCategoryTint("purple")).toBe(true);
    expect(isCategoryTint("grocery")).toBe(false);
  });

  it("uses the first letter of the name as the tile letter", () => {
    expect(categoryLetter("  dairy & eggs")).toBe("D");
    expect(categoryLetter("")).toBe("");
  });

  it("adds up the products of every category", () => {
    expect(
      totalProductCount([category(1, "green", 5120), category(2, "blue", 7)]),
    ).toBe(5127);
    expect(totalProductCount([])).toBe(0);
  });

  it("trims the name and collapses inner spaces", () => {
    expect(cleanCategoryName("  Dairy    &  eggs ")).toBe("Dairy & eggs");
  });

  it("suggests the first tint no category uses yet", () => {
    expect(nextUnusedTint([category(1, "green"), category(2, "blue")])).toBe(
      "orange",
    );
  });

  it("starts over when every tint is taken", () => {
    const all = [
      "green",
      "blue",
      "orange",
      "pink",
      "purple",
      "teal",
      "yellow",
    ].map((tint, index) => category(index, tint));

    expect(nextUnusedTint(all)).toBe("green");
  });
});
