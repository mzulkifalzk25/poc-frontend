import { describe, expect, it } from "vitest";

import { completeBill, type CompleteBillInput } from "./completed-bill";

const input: CompleteBillInput = {
  id: "bill-1",
  paymentId: "pay-1",
  billNo: "002000743",
  shiftId: "shift-1",
  cashierId: 12,
  cashierName: "Zainab Khan",
  counterName: "Counter 2",
  soldAt: "2026-09-26T12:47:03.000Z",
  lines: [
    {
      productId: 8,
      barcode: "8961008900088",
      name: "Soap",
      unitPrice: "50.00",
      qty: 5,
    },
    {
      productId: 4,
      barcode: "8961004500044",
      name: "Milk",
      unitPrice: "290.00",
      qty: 1,
    },
  ],
  taxRule: { taxRate: "0.00", pricesIncludeTax: false },
  method: "cash",
  received: 100000,
};

describe("completeBill", () => {
  it("fixes the totals and keeps the cash tendered and change", () => {
    const bill = completeBill(input);

    expect(bill.totals).toEqual({
      itemCount: 6,
      subtotal: 54000,
      tax: 0,
      rounding: 0,
      total: 54000,
    });
    expect(bill.payment).toEqual({
      id: "pay-1",
      method: "cash",
      amount: 54000,
      tendered: 100000,
      change: 46000,
    });
    expect(bill.lines).toEqual(input.lines);
    expect(bill.lines).not.toBe(input.lines);
  });

  it("records card and wallet without tendered or change", () => {
    const bill = completeBill({ ...input, method: "wallet", received: null });

    expect(bill.payment).toEqual({
      id: "pay-1",
      method: "wallet",
      amount: 54000,
      tendered: null,
      change: null,
    });
  });

  it("refuses a cash bill that is not covered or an empty bill", () => {
    expect(() => completeBill({ ...input, received: 50000 })).toThrow();
    expect(() => completeBill({ ...input, lines: [] })).toThrow();
  });
});
