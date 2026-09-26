import {
  billTotals,
  type BillTotals,
  type DraftLine,
  type TaxRule,
} from "./bill";
import { canPay, checkCash, type PaymentMethod } from "./payment";

// Amounts are paisa. For cash, the amount paid is the total; tendered and change are kept.
export interface CompletedPayment {
  id: string;
  method: PaymentMethod;
  amount: number;
  tendered: number | null;
  change: number | null;
}

export interface CompletedBill {
  id: string;
  billNo: string;
  shiftId: string;
  cashierId: number;
  cashierName: string;
  counterName: string;
  soldAt: string;
  lines: DraftLine[];
  totals: BillTotals;
  taxRate: string;
  payment: CompletedPayment;
}

export interface CompleteBillInput {
  id: string;
  paymentId: string;
  billNo: string;
  shiftId: string;
  cashierId: number;
  cashierName: string;
  counterName: string;
  soldAt: string;
  lines: DraftLine[];
  taxRule: TaxRule;
  method: PaymentMethod;
  received: number | null;
}

function paymentOf(input: CompleteBillInput, total: number): CompletedPayment {
  if (input.method !== "cash" || input.received === null) {
    return {
      id: input.paymentId,
      method: input.method,
      amount: total,
      tendered: null,
      change: null,
    };
  }
  const cash = checkCash(total, input.received);
  const change = cash.status === "covered" ? cash.change : 0;
  return {
    id: input.paymentId,
    method: "cash",
    amount: total,
    tendered: input.received,
    change,
  };
}

export function completeBill(input: CompleteBillInput): CompletedBill {
  const totals = billTotals(input.lines, input.taxRule);
  if (!canPay(totals.itemCount, input.method, totals.total, input.received)) {
    throw new Error("The bill cannot be paid yet");
  }
  return {
    id: input.id,
    billNo: input.billNo,
    shiftId: input.shiftId,
    cashierId: input.cashierId,
    cashierName: input.cashierName,
    counterName: input.counterName,
    soldAt: input.soldAt,
    lines: input.lines.map((line) => ({ ...line })),
    totals,
    taxRate: input.taxRule.taxRate,
    payment: paymentOf(input, totals.total),
  };
}
