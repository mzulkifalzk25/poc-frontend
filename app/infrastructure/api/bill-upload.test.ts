import { describe, expect, it } from "vitest";

import { completedBill } from "../db/test-database";
import { toBillUpload } from "./bill-upload";

describe("toBillUpload", () => {
  it("sends the contract shape with string money and quantities", () => {
    expect(toBillUpload(completedBill("bill-1"))).toEqual({
      id: "bill-1",
      bill_no: "002000743",
      shift_id: "shift-1",
      cashier_id: 12,
      sold_at: "2026-09-26T12:47:03.000Z",
      items: [
        {
          line_no: 1,
          product_id: 4,
          barcode: "8961004500044",
          name: "Fresh Milk 1L",
          qty: "2.000",
          unit_price: "290.00",
        },
        {
          line_no: 2,
          product_id: 1,
          barcode: "8961001200011",
          name: "Basmati Rice 5kg",
          qty: "1.000",
          unit_price: "1650.00",
        },
      ],
      payment: {
        id: "bill-1-pay",
        method: "cash",
        amount: "2230.00",
        tendered: "5000.00",
        change_given: "2770.00",
      },
      totals: {
        item_count: 3,
        subtotal: "2230.00",
        tax: "0.00",
        rounding: "0.00",
        total: "2230.00",
      },
    });
  });

  it("leaves tendered and change out for card and wallet", () => {
    const upload = toBillUpload(
      completedBill("bill-2", {
        payment: {
          id: "p",
          method: "card",
          amount: 223000,
          tendered: null,
          change: null,
        },
      }),
    );

    expect(upload.payment).toEqual({
      id: "p",
      method: "card",
      amount: "2230.00",
    });
  });
});
