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
