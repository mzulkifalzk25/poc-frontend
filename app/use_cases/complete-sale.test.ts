import { describe, expect, it, vi } from "vitest";

import type { CompleteBillInput } from "~/domain/completed-bill";

import { completeSale } from "./complete-sale";

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
  ],
  taxRule: { taxRate: "0.00", pricesIncludeTax: false },
  method: "card",
  received: null,
};

describe("completeSale", () => {
  it("saves the bill on this PC and then asks for an upload", async () => {
    const order: string[] = [];
    const deps = {
      recordSale: vi.fn(() => {
        order.push("saved");
        return Promise.resolve();
      }),
      onSaved: () => order.push("upload"),
      now: () => 1000,
    };

    const result = await completeSale(deps, input);

    expect(result).toMatchObject({
      status: "saved",
      bill: { id: "bill-1", totals: { total: 25000 } },
    });
    expect(deps.recordSale).toHaveBeenCalledWith(
      expect.objectContaining({ id: "bill-1" }),
      1000,
    );
    expect(order).toEqual(["saved", "upload"]);
  });

  it("reports a bill that could not be saved and does not ask for an upload", async () => {
    const onSaved = vi.fn();

    const result = await completeSale(
      {
        recordSale: () => Promise.reject(new Error("QuotaExceededError")),
        onSaved,
        now: () => 1000,
      },
      input,
    );

    expect(result).toEqual({ status: "not_saved" });
    expect(onSaved).not.toHaveBeenCalled();
  });
});
