import { describe, expect, it, vi } from "vitest";

import type { ProductDetail } from "~/domain/product";
import type { ProductEditDraft } from "~/domain/product-draft";

import {
  setProductArchived,
  updateProduct,
  type ProductRepository,
} from "./manage-products";

const detail: ProductDetail = {
  id: 7,
  barcode: "8961002300022",
  name: "Cooking Oil 1L",
  category: { id: 1, name: "Grocery", tint: "grocery" },
  categoryId: 1,
  unit: "litre",
  price: "620.00",
  cost: "570.00",
  stock: "9.000",
  status: "low",
  lowStockAlert: "15.000",
  isArchived: false,
};

const draft: ProductEditDraft = {
  name: "Cooking Oil 1L",
  categoryId: 1,
  unit: "litre",
  price: "640",
  cost: "570",
  lowStockAlert: "15",
};

function fakeRepo(): ProductRepository {
  return {
    list: vi.fn(() => Promise.resolve({ count: 0, results: [] })),
    get: vi.fn(() => Promise.resolve(detail)),
    priceHistory: vi.fn(() => Promise.resolve([])),
    update: vi.fn(() => Promise.resolve(detail)),
    archive: vi.fn(() => Promise.resolve()),
    restore: vi.fn(() => Promise.resolve()),
  };
}

describe("updateProduct", () => {
  it("sends the cleaned payload", async () => {
    const repo = fakeRepo();

    const outcome = await updateProduct(repo, 7, draft);

    expect(outcome).toEqual({ status: "done", value: detail });
    expect(repo.update).toHaveBeenCalledWith(7, {
      name: "Cooking Oil 1L",
      categoryId: 1,
      unit: "litre",
      price: "640.00",
      cost: "570.00",
      lowStockAlert: "15.000",
    });
  });

  it("does not call the server when the draft is invalid", async () => {
    const repo = fakeRepo();

    const outcome = await updateProduct(repo, 7, { ...draft, price: "" });

    expect(outcome).toEqual({
      status: "rejected",
      fields: { price: "required" },
    });
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("reports offline when the save cannot reach the server", async () => {
    const repo = fakeRepo();
    repo.update = () => Promise.reject(new TypeError("Failed to fetch"));

    await expect(updateProduct(repo, 7, draft)).resolves.toEqual({
      status: "offline",
    });
  });
});

describe("setProductArchived", () => {
  it("archives instead of erasing", async () => {
    const repo = fakeRepo();

    await expect(setProductArchived(repo, 7, "archive")).resolves.toEqual({
      status: "done",
      value: "archive",
    });
    expect(repo.archive).toHaveBeenCalledWith(7);
    expect(repo.restore).not.toHaveBeenCalled();
  });

  it("restores an archived product", async () => {
    const repo = fakeRepo();

    await setProductArchived(repo, 7, "restore");

    expect(repo.restore).toHaveBeenCalledWith(7);
  });

  it("reports offline", async () => {
    const repo = fakeRepo();
    repo.archive = () => Promise.reject(new TypeError("Failed to fetch"));

    await expect(setProductArchived(repo, 7, "archive")).resolves.toEqual({
      status: "offline",
    });
  });
});
