import Dexie from "dexie";
import { afterEach } from "vitest";

import { MartDeskDatabase } from "./database";
import type { BillUpload, ProductRow } from "./rows";

// Test helper: a fresh fake-indexeddb database per test, deleted afterwards.
export function freshDatabaseFactory(): () => MartDeskDatabase {
  let current: MartDeskDatabase | null = null;
  afterEach(async () => {
    if (current) {
      current.close();
      await Dexie.delete(current.name);
      current = null;
    }
  });
  return () => {
    current = new MartDeskDatabase(`test-${crypto.randomUUID()}`);
    return current;
  };
}

export function productRow(
  id: number,
  overrides: Partial<ProductRow> = {},
): ProductRow {
  const name = overrides.name ?? `Product ${String(id)}`;
  return {
    id,
    barcode: `89610${String(id).padStart(8, "0")}`,
    name,
    nameLc: name.toLowerCase(),
    categoryId: 1,
    unit: "pcs",
    price: "100.00",
    isArchived: false,
    ...overrides,
  };
}

export function billUpload(
  id: string,
  overrides: Partial<BillUpload> = {},
): BillUpload {
  return {
    id,
    bill_no: "002000743",
    shift_id: "shift-1",
    cashier_id: 12,
    sold_at: "2026-09-26T10:00:00.000Z",
    items: [
      {
        line_no: 1,
        product_id: 1,
        barcode: "8961000000001",
        name: "Product 1",
        qty: "1.000",
        unit_price: "100.00",
      },
    ],
    payment: {
      id: `${id}-pay`,
      method: "cash",
      amount: "100.00",
      tendered: "100.00",
      change_given: "0.00",
    },
    totals: {
      item_count: 1,
      subtotal: "100.00",
      tax: "0.00",
      rounding: "0.00",
      total: "100.00",
    },
    ...overrides,
  };
}
