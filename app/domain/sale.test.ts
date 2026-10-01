import { describe, expect, it } from "vitest";

import { toCompletedBill, type BillDetail } from "./sale";

const detail: BillDetail = {
  id: "b1",
  billNo: "002000743",
  time: "2026-09-19T12:47:03Z",
  status: "paid",
  cashier: "Zainab Khan",
  counterName: "Counter 2",
  payment: {
    method: "cash",
    amount: "1350.00",
    tendered: "2000.00",
    changeGiven: "650.00",
  },
  items: [
    {
      lineNo: 1,
      name: "Rice",
      barcode: "896",
      qty: "2.000",
      unitPrice: "675.00",
      lineTotal: "1350.00",
    },
  ],
  totals: {
    subtotal: "1350.00",
    tax: "0.00",
    rounding: "0.00",
    total: "1350.00",
  },
  returns: [],
};

describe("toCompletedBill", () => {
  it("turns a server bill into the shape the receipt draws", () => {
    const bill = toCompletedBill(detail, "0.00");

    expect(bill.billNo).toBe("002000743");
    expect(bill.lines).toEqual([
      {
        productId: 1,
        barcode: "896",
        name: "Rice",
        unitPrice: "675.00",
        qty: 2,
      },
    ]);
    expect(bill.totals).toEqual({
      itemCount: 2,
      subtotal: 135000,
      tax: 0,
      rounding: 0,
      total: 135000,
    });
    expect(bill.payment).toMatchObject({
      method: "cash",
      amount: 135000,
      tendered: 200000,
      change: 65000,
    });
  });

  it("has no tendered cash for a card bill", () => {
    const card = {
      ...detail,
      payment: {
        method: "card",
        amount: "1350.00",
        tendered: null,
        changeGiven: null,
      },
    } as const;

    expect(toCompletedBill(card, "0.00").payment).toMatchObject({
      method: "card",
      tendered: null,
      change: null,
    });
  });
});
