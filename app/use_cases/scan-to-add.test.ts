import { describe, expect, it, vi } from "vitest";

import type { ProductDetail, ProductSummary } from "~/domain/product";
import type { NewProductDraft } from "~/domain/product-draft";
import { ApiError } from "~/infrastructure/api/errors";

import type { ProductRepository } from "./manage-products";
import { createProduct, lookupBarcode } from "./scan-to-add";

const summary: ProductSummary = {
  id: 7,
  barcode: "8961002300022",
  name: "Cooking Oil 1L",
  category: { id: 1, name: "Grocery", tint: "grocery" },
  unit: "litre",
  price: "620.00",
  cost: "570.00",
  stock: "9.000",
  status: "low",
};

const detail: ProductDetail = {
  ...summary,
  categoryId: 1,
  lowStockAlert: "15.000",
  isArchived: false,
};

const draft: NewProductDraft = {
  barcode: "8961011200111",
  name: "Wafer Chocolate 40g",
  categoryId: 4,
  unit: "pcs",
  price: "60",
  cost: "48",
  stock: "24",
  lowStockAlert: "10",
};

function apiError(status: number, code: string) {
  return new ApiError(status, { error: { code, message: code } });
}

function fakeRepo(): ProductRepository {
  return {
    list: vi.fn(() => Promise.resolve({ count: 0, results: [] })),
    get: vi.fn(() => Promise.resolve(detail)),
    priceHistory: vi.fn(() => Promise.resolve([])),
    update: vi.fn(() => Promise.resolve(detail)),
    archive: vi.fn(() => Promise.resolve()),
    restore: vi.fn(() => Promise.resolve()),
    byBarcode: vi.fn(() => Promise.resolve(summary)),
    create: vi.fn(() => Promise.resolve(detail)),
  };
}

describe("lookupBarcode", () => {
  it("finds a product that is already in the catalogue", async () => {
    const repo = fakeRepo();

    await expect(lookupBarcode(repo, " 8961002300022\n")).resolves.toEqual({
      status: "known",
      product: summary,
    });
    expect(repo.byBarcode).toHaveBeenCalledWith("8961002300022");
  });

  it("reports a new barcode", async () => {
    const repo = fakeRepo();
    repo.byBarcode = () => Promise.reject(apiError(404, "unknown_barcode"));

    await expect(lookupBarcode(repo, "8961011200111")).resolves.toEqual({
      status: "unknown",
      barcode: "8961011200111",
    });
  });

  it("ignores an empty scan without calling the server", async () => {
    const repo = fakeRepo();

    await expect(lookupBarcode(repo, "  ")).resolves.toEqual({
      status: "empty",
    });
    expect(repo.byBarcode).not.toHaveBeenCalled();
  });

  it("reports offline and other failures", async () => {
    const repo = fakeRepo();
    repo.byBarcode = () => Promise.reject(new TypeError("Failed to fetch"));
    await expect(lookupBarcode(repo, "1234")).resolves.toEqual({
      status: "offline",
    });

    repo.byBarcode = () => Promise.reject(apiError(500, "server_error"));
    await expect(lookupBarcode(repo, "1234")).resolves.toEqual({
      status: "failed",
    });
  });
});

describe("createProduct", () => {
  it("creates the product with API-ready values", async () => {
    const repo = fakeRepo();

    await expect(createProduct(repo, draft)).resolves.toEqual({
      status: "done",
      value: detail,
    });
    expect(repo.create).toHaveBeenCalledWith({
      barcode: "8961011200111",
      name: "Wafer Chocolate 40g",
      categoryId: 4,
      unit: "pcs",
      price: "60.00",
      cost: "48.00",
      stock: "24.000",
      lowStockAlert: "10.000",
    });
  });

  it("reports a duplicate barcode", async () => {
    const repo = fakeRepo();
    repo.create = () => Promise.reject(apiError(409, "barcode_exists"));

    await expect(createProduct(repo, draft)).resolves.toEqual({
      status: "barcode_exists",
    });
  });

  it("stops before the server when a field is wrong", async () => {
    const repo = fakeRepo();

    await expect(createProduct(repo, { ...draft, price: "" })).resolves.toEqual(
      { status: "rejected", fields: { price: "required" } },
    );
    expect(repo.create).not.toHaveBeenCalled();
  });
});
