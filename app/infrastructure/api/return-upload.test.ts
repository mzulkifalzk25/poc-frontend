import { describe, expect, it } from "vitest";

import { toReturnUpload } from "./return-upload";

describe("toReturnUpload", () => {
  it("sends lines by product, the refund as a string and the typed bill number", () => {
    expect(
      toReturnUpload({
        id: "ret-1",
        shiftId: "shift-1",
        lines: [
          {
            productId: 2,
            barcode: "8961002300022",
            name: "Cooking Oil 1L",
            unitPrice: "600.00",
            todayPrice: "620.00",
            qty: 1,
            source: "paid",
            changed: true,
            notOnBill: false,
          },
        ],
        itemCount: 1,
        reason: "price_error",
        restock: true,
        method: "wallet",
        refund: 60_000,
        billNo: "001000498",
        returnedAt: "2026-09-26T12:52:10.000Z",
      }),
    ).toEqual({
      id: "ret-1",
      shift_id: "shift-1",
      lines: [{ product_id: 2, qty: "1.000" }],
      reason: "price_error",
      restock: true,
      refund: { method: "wallet", amount: "600.00" },
      original_bill_no: "001000498",
      returned_at: "2026-09-26T12:52:10.000Z",
    });
  });
});
