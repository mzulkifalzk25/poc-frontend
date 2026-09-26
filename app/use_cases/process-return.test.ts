import { describe, expect, it, vi } from "vitest";

import { processReturn } from "./process-return";

const input = {
  id: "ret-1",
  shiftId: "shift-1",
  lines: [
    {
      productId: 6,
      barcode: "8961006700066",
      name: "Eggs (dozen)",
      unitPrice: "420.00",
      qty: 2,
    },
  ],
  bill: null,
  typedBillNo: null,
  taxRule: { taxRate: "0.00", pricesIncludeTax: false },
  reason: "changed_mind" as const,
  restock: true,
  method: "cash" as const,
  returnedAt: "2026-09-26T12:52:10.000Z",
};

describe("processReturn", () => {
  it("saves on this PC and then asks for an upload, with no PIN or approval", async () => {
    const order: string[] = [];
    const deps = {
      recordReturn: vi.fn(() => {
        order.push("saved");
        return Promise.resolve();
      }),
      onSaved: () => order.push("upload"),
      now: () => 1000,
    };

    const result = await processReturn(deps, input);

    expect(result).toMatchObject({
      status: "saved",
      ret: { refund: 84_000, itemCount: 2 },
    });
    expect(order).toEqual(["saved", "upload"]);
  });

  it("reports a return that could not be saved", async () => {
    const onSaved = vi.fn();

    await expect(
      processReturn(
        {
          recordReturn: () => Promise.reject(new Error("full")),
          onSaved,
          now: () => 1,
        },
        input,
      ),
    ).resolves.toEqual({ status: "not_saved" });
    expect(onSaved).not.toHaveBeenCalled();
  });
});
