import type { CompletedBill } from "./completed-bill";
import { toPaisa } from "./paisa";
import type { PaymentMethod } from "./payment";

export type BillStatus = "paid" | "partially_refunded" | "refunded";

export interface BillRow {
  id: string;
  billNo: string;
  time: string;
  cashier: string;
  items: string;
  payment: PaymentMethod | null;
  total: string;
  status: BillStatus;
}

export interface BillDetail {
  id: string;
  billNo: string;
  time: string;
  status: BillStatus;
  cashier: string;
  counterName: string;
  payment: {
    method: PaymentMethod;
    amount: string;
    tendered: string | null;
    changeGiven: string | null;
  } | null;
  items: {
    lineNo: number;
    name: string;
    barcode: string;
    qty: string;
    unitPrice: string;
    lineTotal: string;
  }[];
  totals: { subtotal: string; tax: string; rounding: string; total: string };
  returns: { id: string; refundTotal: string; refundMethod: string }[];
}

export interface SalesQuery {
  date: string;
  cashierId: number | null;
  payment: PaymentMethod | null;
  search: string;
}

export interface SalesPage {
  bills: BillRow[];
  nextCursor: string | null;
  count: number;
  total: string;
}

// The receipt reprint draws from the same shape as a bill just paid at the counter.
export function toCompletedBill(
  detail: BillDetail,
  taxRate: string,
): CompletedBill {
  const payment = detail.payment;
  return {
    id: detail.id,
    billNo: detail.billNo,
    shiftId: "",
    cashierId: 0,
    cashierName: detail.cashier,
    counterName: detail.counterName,
    soldAt: detail.time,
    lines: detail.items.map((item) => ({
      productId: item.lineNo,
      barcode: item.barcode,
      name: item.name,
      unitPrice: item.unitPrice,
      qty: Number(item.qty),
    })),
    totals: {
      itemCount: detail.items.reduce((sum, item) => sum + Number(item.qty), 0),
      subtotal: toPaisa(detail.totals.subtotal),
      tax: toPaisa(detail.totals.tax),
      rounding: toPaisa(detail.totals.rounding),
      total: toPaisa(detail.totals.total),
    },
    taxRate,
    payment: {
      id: detail.id,
      method: payment?.method ?? "cash",
      amount: toPaisa(payment?.amount ?? detail.totals.total),
      tendered: payment?.tendered ? toPaisa(payment.tendered) : null,
      change: payment?.changeGiven ? toPaisa(payment.changeGiven) : null,
    },
  };
}
