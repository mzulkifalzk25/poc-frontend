import { describe, expect, it, vi } from "vitest";

import type { Category } from "~/domain/category";

import { saveCategory, type CategoryRepository } from "./manage-categories";

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
