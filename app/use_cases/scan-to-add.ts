import { cleanBarcode } from "~/domain/barcode";
import type { ProductDetail, ProductSummary } from "~/domain/product";
import {
  validateNewProduct,
  type FieldErrors,
  type NewProductDraft,
} from "~/domain/product-draft";
import { isApiError } from "~/infrastructure/api/errors";

import { runAdminWrite, type WriteOutcome } from "./admin-write";
import type { ProductRepository } from "./manage-products";

export const UNKNOWN_BARCODE = "unknown_barcode";
export const BARCODE_EXISTS = "barcode_exists";

export type BarcodeLookup =
  | { status: "known"; product: ProductSummary }
  | { status: "unknown"; barcode: string }
  | { status: "empty" }
  | { status: "offline" }
  | { status: "failed" };

export async function lookupBarcode(
  repo: ProductRepository,
  raw: string,
): Promise<BarcodeLookup> {
  const barcode = cleanBarcode(raw);
  if (barcode === "") {
    return { status: "empty" };
  }
  try {
    return { status: "known", product: await repo.byBarcode(barcode) };
  } catch (error) {
    if (isApiError(error) && error.code === UNKNOWN_BARCODE) {
      return { status: "unknown", barcode };
    }
    return { status: error instanceof TypeError ? "offline" : "failed" };
  }
}

export type CreateProductOutcome =
  | WriteOutcome<ProductDetail>
  | { status: "rejected"; fields: FieldErrors<NewProductDraft> }
  | { status: "barcode_exists" };

export async function createProduct(
  repo: ProductRepository,
  draft: NewProductDraft,
): Promise<CreateProductOutcome> {
  const validation = validateNewProduct(draft);
  if (!validation.ok) {
    return { status: "rejected", fields: validation.fields };
  }
  const outcome = await runAdminWrite(() => repo.create(validation.payload));
  if (outcome.status === "conflict" && outcome.code === BARCODE_EXISTS) {
    return { status: "barcode_exists" };
  }
  return outcome;
}
