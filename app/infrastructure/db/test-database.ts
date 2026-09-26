import Dexie from "dexie";
import { afterEach } from "vitest";

import { MartDeskDatabase } from "./database";
import type { CompletedBill } from "~/domain/completed-bill";

import type { BillUpload, ProductRow, RecentBillRow } from "./rows";

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

export function completedBill(
  id: string,
  overrides: Partial<CompletedBill> = {},
): CompletedBill {
  return {
    id,
    billNo: "002000743",
    shiftId: "shift-1",
    cashierId: 12,
    cashierName: "Zainab Khan",
    counterName: "Counter 2",
    soldAt: "2026-09-26T12:47:03.000Z",
    lines: [
      {
        productId: 4,
        barcode: "8961004500044",
        name: "Fresh Milk 1L",
        unitPrice: "290.00",
        qty: 2,
      },
      {
        productId: 1,
        barcode: "8961001200011",
        name: "Basmati Rice 5kg",
        unitPrice: "1650.00",
        qty: 1,
      },
    ],
    totals: {
      itemCount: 3,
      subtotal: 223000,
      tax: 0,
      rounding: 0,
      total: 223000,
    },
    taxRate: "0.00",
    payment: {
      id: `${id}-pay`,
      method: "cash",
      amount: 223000,
      tendered: 500000,
      change: 277000,
    },
    ...overrides,
  };
}

export function recentBillRow(bill: CompletedBill): RecentBillRow {
  return {
    id: bill.id,
    billNo: bill.billNo,
    soldAt: bill.soldAt,
    shiftId: bill.shiftId,
    bill,
  };
}
