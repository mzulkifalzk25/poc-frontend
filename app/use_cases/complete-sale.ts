import {
  completeBill,
  type CompleteBillInput,
  type CompletedBill,
} from "~/domain/completed-bill";

export interface CompleteSaleDeps {
  recordSale: (bill: CompletedBill, now: number) => Promise<void>;
  onSaved: () => void;
  now: () => number;
}

export type CompleteSaleResult =
  { status: "saved"; bill: CompletedBill } | { status: "not_saved" };

// A sale never waits on the network: it is saved on this PC first and uploaded later.
export async function completeSale(
  deps: CompleteSaleDeps,
  input: CompleteBillInput,
): Promise<CompleteSaleResult> {
  const bill = completeBill(input);
  try {
    await deps.recordSale(bill, deps.now());
  } catch {
    return { status: "not_saved" };
  }
  deps.onSaved();
  return { status: "saved", bill };
}
