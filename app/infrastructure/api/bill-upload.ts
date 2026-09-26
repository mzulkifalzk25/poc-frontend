import type { CompletedBill } from "~/domain/completed-bill";
import { fromPaisa } from "~/domain/paisa";

import type { BillUpload } from "../db/rows";

function quantity(qty: number): string {
  return qty.toFixed(3);
}

// The contract's /bills/batch shape: strings for money and quantities, one line per product.
export function toBillUpload(bill: CompletedBill): BillUpload {
  const { payment, totals } = bill;
  return {
    id: bill.id,
    bill_no: bill.billNo,
    shift_id: bill.shiftId,
    cashier_id: bill.cashierId,
    sold_at: bill.soldAt,
    items: bill.lines.map((line, index) => ({
      line_no: index + 1,
      product_id: line.productId,
      barcode: line.barcode,
      name: line.name,
      qty: quantity(line.qty),
      unit_price: line.unitPrice,
    })),
    payment: {
      id: payment.id,
      method: payment.method,
      amount: fromPaisa(payment.amount),
      ...(payment.tendered === null
        ? {}
        : { tendered: fromPaisa(payment.tendered) }),
      ...(payment.change === null
        ? {}
        : { change_given: fromPaisa(payment.change) }),
    },
    totals: {
      item_count: totals.itemCount,
      subtotal: fromPaisa(totals.subtotal),
      tax: fromPaisa(totals.tax),
      rounding: fromPaisa(totals.rounding),
      total: fromPaisa(totals.total),
    },
  };
}
