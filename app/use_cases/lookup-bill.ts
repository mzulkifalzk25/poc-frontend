import type { CompletedBill } from "~/domain/completed-bill";
import type { BillPrices, PaidPrice } from "~/domain/return";
import { isApiError } from "~/infrastructure/api/errors";

export interface RemoteBillLine {
  productId: number;
  unitPrice: string;
  returnableQty: number;
}

export interface LookupBillDeps {
  findLocal: (billNo: string) => Promise<CompletedBill | null>;
  fetchRemote: ((billNo: string) => Promise<RemoteBillLine[]>) | null;
}

export type BillLookup =
  | { status: "found"; source: "this_counter" | "server"; bill: BillPrices }
  | { status: "not_found" | "unavailable"; billNo: string }
  | { status: "invalid" }
  | { status: "empty" };

export function normalizeBillNo(typed: string): string | null {
  const digits = typed.replace(/[\s-]/g, "");
  return /^\d{9}$/.test(digits) ? digits : null;
}

function localPrices(bill: CompletedBill): Map<number, PaidPrice> {
  return new Map(
    bill.lines.map((line) => [
      line.productId,
      { unitPrice: line.unitPrice, returnableQty: null },
    ]),
  );
}

async function remoteLookup(
  deps: LookupBillDeps,
  billNo: string,
): Promise<BillLookup> {
  if (!deps.fetchRemote) {
    return { status: "unavailable", billNo };
  }
  try {
    const lines = await deps.fetchRemote(billNo);
    const prices = new Map(
      lines.map((line) => [
        line.productId,
        { unitPrice: line.unitPrice, returnableQty: line.returnableQty },
      ]),
    );
    return { status: "found", source: "server", bill: { billNo, prices } };
  } catch (error) {
    if (isApiError(error) && error.status === 404) {
      return { status: "not_found", billNo };
    }
    return { status: "unavailable", billNo };
  }
}

// This counter's recent bills first, then the server; a miss never stops the return.
export async function lookupBill(
  deps: LookupBillDeps,
  typed: string,
): Promise<BillLookup> {
  if (typed.trim() === "") {
    return { status: "empty" };
  }
  const billNo = normalizeBillNo(typed);
  if (!billNo) {
    return { status: "invalid" };
  }
  const local = await deps.findLocal(billNo);
  if (local) {
    return {
      status: "found",
      source: "this_counter",
      bill: { billNo, prices: localPrices(local) },
    };
  }
  return remoteLookup(deps, billNo);
}
