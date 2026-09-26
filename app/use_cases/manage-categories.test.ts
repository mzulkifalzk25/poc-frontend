import { describe, expect, it, vi } from "vitest";

import type { Category } from "~/domain/category";
import { ApiError } from "~/infrastructure/api/errors";

import {
  deleteCategory,
  moveProductsAndDelete,
  saveCategory,
  type CategoryRepository,
} from "./manage-categories";

const saved: Category = {
  id: 8,
  name: "Frozen",
  tint: "dairy",
  productCount: 0,
};

function fakeRepo(): CategoryRepository {
  return {
    list: vi.fn(() => Promise.resolve([])),
    create: vi.fn(() => Promise.resolve(saved)),
    update: vi.fn(() => Promise.resolve(saved)),
    remove: vi.fn(() => Promise.resolve()),
    moveProducts: vi.fn(() => Promise.resolve()),
  };
}

describe("saveCategory", () => {
  it("creates a new category with a cleaned name", async () => {
    const repo = fakeRepo();

    const outcome = await saveCategory(repo, null, {
      name: "  Frozen   food ",
      tint: "dairy",
    });

    expect(outcome).toEqual({ status: "done", value: saved });
    expect(repo.create).toHaveBeenCalledWith({
      name: "Frozen food",
      tint: "dairy",
    });
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("updates an existing category", async () => {
    const repo = fakeRepo();

    await saveCategory(repo, 8, { name: "Frozen", tint: "snacks" });

    expect(repo.update).toHaveBeenCalledWith(8, {
      name: "Frozen",
      tint: "snacks",
    });
  });

  it("reports offline instead of throwing", async () => {
    const repo = fakeRepo();
    repo.create = () => Promise.reject(new TypeError("Failed to fetch"));

    const outcome = await saveCategory(repo, null, {
      name: "Frozen",
      tint: "dairy",
    });

    expect(outcome).toEqual({ status: "offline" });
  });
});

function hasProducts() {
  return Promise.reject(
    new ApiError(409, {
      error: { code: "category_has_products", message: "Not empty" },
    }),
  );
}

describe("deleteCategory", () => {
  it("deletes an empty category", async () => {
    const repo = fakeRepo();

    await expect(deleteCategory(repo, 8)).resolves.toEqual({
      status: "done",
      value: undefined,
    });
    expect(repo.remove).toHaveBeenCalledWith(8);
  });

  it("reports a category that still has products", async () => {
    const repo = fakeRepo();
    repo.remove = hasProducts;

    await expect(deleteCategory(repo, 1)).resolves.toEqual({
      status: "has_products",
    });
  });

  it("passes other conflicts through", async () => {
    const repo = fakeRepo();
    repo.remove = () =>
      Promise.reject(
        new ApiError(409, { error: { code: "other", message: "Other" } }),
      );

    await expect(deleteCategory(repo, 1)).resolves.toMatchObject({
      status: "conflict",
      code: "other",
    });
  });
});

describe("moveProductsAndDelete", () => {
  it("moves the products first and then deletes the category", async () => {
    const order: string[] = [];
    const repo = fakeRepo();
    repo.moveProducts = (from, to) => {
      order.push(`move ${String(from)} to ${String(to)}`);
      return Promise.resolve();
    };
    repo.remove = (id) => {
      order.push(`remove ${String(id)}`);
      return Promise.resolve();
    };

    const outcome = await moveProductsAndDelete(repo, 1, 2);

    expect(outcome.status).toBe("done");
    expect(order).toEqual(["move 1 to 2", "remove 1"]);
  });

  it("does not delete when the move fails", async () => {
    const repo = fakeRepo();
    repo.moveProducts = () => Promise.reject(new TypeError("Failed to fetch"));

    const outcome = await moveProductsAndDelete(repo, 1, 2);

    expect(outcome).toEqual({ status: "offline" });
    expect(repo.remove).not.toHaveBeenCalled();
  });

  it("refuses to move products into the same category", async () => {
    await expect(moveProductsAndDelete(fakeRepo(), 1, 1)).rejects.toThrow();
  });
});
