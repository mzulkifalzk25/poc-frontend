import {
  validateAdjustment,
  type AdjustDraft,
  type AdjustError,
  type AdjustPayload,
} from "~/domain/adjustment";
import type { StockMovement, StockPage, StockQuery } from "~/domain/stock";

import { runAdminWrite, type WriteOutcome } from "./admin-write";

export const STOCK_PAGE_SIZE = 10;

export interface AdjustResult {
  before: string;
  after: string;
}

export interface StockRepository {
  list: (query: StockQuery) => Promise<StockPage>;
  recentAdjustments: (limit: number) => Promise<StockMovement[]>;
  adjust: (
    productId: number,
    payload: AdjustPayload,
    key: string,
  ) => Promise<AdjustResult>;
}

export type AdjustOutcome =
  WriteOutcome<AdjustResult> | { status: "rejected"; error: AdjustError };

// One key per dialog: a retry of the same save never applies twice.
export async function adjustStock(
  repo: StockRepository,
  productId: number,
  draft: AdjustDraft,
  key: string,
): Promise<AdjustOutcome> {
  const validation = validateAdjustment(draft);
  if (!validation.ok) {
    return { status: "rejected", error: validation.error };
  }
  return runAdminWrite(() => repo.adjust(productId, validation.payload, key));
}
