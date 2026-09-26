import type {
  PriceChange,
  ProductDetail,
  ProductPage,
  ProductQuery,
} from "~/domain/product";
import {
  validateProductEdit,
  type FieldErrors,
  type ProductEditDraft,
  type ProductEditPayload,
} from "~/domain/product-draft";

import { runAdminWrite, type WriteOutcome } from "./admin-write";

export const PRODUCT_PAGE_SIZE = 10;

export interface ProductRepository {
  list: (query: ProductQuery) => Promise<ProductPage>;
  get: (id: number) => Promise<ProductDetail>;
  priceHistory: (id: number) => Promise<PriceChange[]>;
  update: (id: number, payload: ProductEditPayload) => Promise<ProductDetail>;
  archive: (id: number) => Promise<void>;
  restore: (id: number) => Promise<void>;
}

export type UpdateProductOutcome<T> =
  WriteOutcome<ProductDetail> | { status: "rejected"; fields: FieldErrors<T> };

export async function updateProduct(
  repo: ProductRepository,
  id: number,
  draft: ProductEditDraft,
): Promise<UpdateProductOutcome<ProductEditDraft>> {
  const validation = validateProductEdit(draft);
  if (!validation.ok) {
    return { status: "rejected", fields: validation.fields };
  }
  return runAdminWrite(() => repo.update(id, validation.payload));
}

export type ArchiveAction = "archive" | "restore";

// "Delete" in the UI archives: past bills and reports keep the product.
export function setProductArchived(
  repo: ProductRepository,
  id: number,
  action: ArchiveAction,
): Promise<WriteOutcome<ArchiveAction>> {
  return runAdminWrite(async () => {
    await (action === "archive" ? repo.archive(id) : repo.restore(id));
    return action;
  });
}
