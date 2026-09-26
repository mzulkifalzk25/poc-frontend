import { describe, expect, it, vi } from "vitest";

import type { DraftLine } from "~/domain/bill";
import type { HeldBillRow } from "~/infrastructure/db/rows";

import {
  deleteHeldBill,
  holdBill,
  recallBill,
  type DeleteHeldDeps,
  type HeldBillDeps,
} from "./held-bills";

const lines: DraftLine[] = [
  {
    productId: 4,
    barcode: "8961004500044",
    name: "Fresh Milk 1L",
    unitPrice: "290.00",
    qty: 2,
  },
  {
    productId: 7,
    barcode: "8961007800077",
    name: "Bread Loaf",
    unitPrice: "150.00",
    qty: 1,
  },
];

function fakeDeps() {
  const rows = new Map<string, HeldBillRow>();
  const deps: HeldBillDeps = {
    save: vi.fn((bill: HeldBillRow) => {
      rows.set(bill.id, bill);
      return Promise.resolve();
    }),
    get: (id) => Promise.resolve(rows.get(id) ?? null),
    remove: vi.fn((id: string) => {
      rows.delete(id);
      return Promise.resolve();
    }),
  };
  return { deps, rows };
}

const input = {
  id: "held-1",
  shiftId: "shift-1",
  cashierId: 12,
  title: "  Went to fetch her wallet ",
  lines,
  taxRule: { taxRate: "0.00", pricesIncludeTax: false },
  heldAt: "2026-09-26T12:47:00.000Z",
};

describe("holdBill", () => {
  it("keeps the lines, count and total on this counter", async () => {
    const { deps } = fakeDeps();

    const result = await holdBill(deps, input);

    expect(result).toEqual({
      status: "held",
      bill: {
        id: "held-1",
        shiftId: "shift-1",
        cashierId: 12,
        title: "Went to fetch her wallet",
        lines: lines.map((line) => ({ ...line, qty: String(line.qty) })),
        itemCount: 3,
        total: "730.00",
        heldAt: "2026-09-26T12:47:00.000Z",
      },
    });
  });

  it("does not hold an empty bill", async () => {
    const { deps } = fakeDeps();

    await expect(holdBill(deps, { ...input, lines: [] })).resolves.toEqual({
      status: "empty",
    });
    expect(deps.save).not.toHaveBeenCalled();
  });
});

describe("recallBill", () => {
  it("brings the held lines back with their scanned prices and removes the held bill", async () => {
    const { deps, rows } = fakeDeps();
    await holdBill(deps, input);

    await expect(recallBill(deps, "held-1", [])).resolves.toEqual({
      status: "recalled",
      lines,
    });
    expect(rows.size).toBe(0);
  });

  it("refuses while another bill is being scanned", async () => {
    const { deps, rows } = fakeDeps();
    await holdBill(deps, input);

    await expect(
      recallBill(deps, "held-1", lines.slice(0, 1)),
    ).resolves.toEqual({ status: "busy" });
    expect(rows.size).toBe(1);
  });

  it("reports a held bill that is gone", async () => {
    const { deps } = fakeDeps();

    await expect(recallBill(deps, "nope", [])).resolves.toEqual({
      status: "missing",
    });
  });
});

describe("deleteHeldBill", () => {
  it("removes the held bill and queues a held_bill_deleted event together", async () => {
    const { deps: store } = fakeDeps();
    await holdBill(store, input);
    const removeWithEvent = vi.fn(() => Promise.resolve());
    const onQueued = vi.fn();
    const deps: DeleteHeldDeps = {
      get: store.get,
      removeWithEvent,
      onQueued,
      now: () => new Date("2026-09-26T13:00:00.000Z"),
      newId: () => "event-1",
    };

    await expect(deleteHeldBill(deps, "held-1")).resolves.toBe(true);

    expect(removeWithEvent).toHaveBeenCalledWith(
      "held-1",
      {
        id: "event-1",
        action: "held_bill_deleted",
        occurred_at: "2026-09-26T13:00:00.000Z",
        entity_type: "held_bill",
        entity_id: "held-1",
        detail: {
          title: "Went to fetch her wallet",
          total: "730.00",
          item_count: 3,
        },
      },
      Date.parse("2026-09-26T13:00:00.000Z"),
    );
    expect(onQueued).toHaveBeenCalledOnce();
  });

  it("does nothing for a held bill that is gone", async () => {
    const removeWithEvent = vi.fn(() => Promise.resolve());

    await expect(
      deleteHeldBill(
        {
          get: () => Promise.resolve(null),
          removeWithEvent,
          onQueued: vi.fn(),
          now: () => new Date(),
          newId: () => "e",
        },
        "nope",
      ),
    ).resolves.toBe(false);
    expect(removeWithEvent).not.toHaveBeenCalled();
  });
});
