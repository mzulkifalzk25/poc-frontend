import type { BillLine } from "~/domain/bill-line";
import type { CompletedBill } from "~/domain/completed-bill";

export interface ProductRow {
  id: number;
  barcode: string;
  name: string;
  nameLc: string;
  categoryId: number | null;
  unit: string;
  price: string;
  isArchived: boolean;
}

export interface CategoryRow {
  id: number;
  name: string;
  tint: string;
}

export interface StockRow {
  productId: number;
  qty: string;
}

export interface UserRow {
  id: number;
  fullName: string;
  nameKey: string;
  initials: string;
  pinVerifier: string;
  unlockedAt: string | null;
}

export type OutboxStatus = "pending" | "rejected";

export interface OutboxRow<P> {
  id: string;
  payload: P;
  status: OutboxStatus;
  attempts: number;
  nextTryAt: number;
  createdAt: number;
  errors: string[];
}

export interface BillUploadItem {
  line_no: number;
  product_id: number;
  barcode: string;
  name: string;
  qty: string;
  unit_price: string;
}

export interface BillUploadPayment {
  id: string;
  method: "cash" | "card" | "wallet";
  amount: string;
  tendered?: string;
  change_given?: string;
}

export interface BillUpload {
  id: string;
  bill_no: string;
  shift_id: string;
  cashier_id: number;
  sold_at: string;
  items: BillUploadItem[];
  payment: BillUploadPayment;
  totals: {
    item_count: number;
    subtotal: string;
    tax: string;
    rounding: string;
    total: string;
  };
}

export interface AuditEventUpload {
  id: string;
  action: "pin_failure" | "held_bill_deleted";
  occurred_at: string;
  entity_type?: string;
  entity_id?: string;
  detail?: Record<string, unknown>;
}

export interface ReturnUpload {
  id: string;
  shift_id: string;
  lines: { product_id: number; qty: string }[];
  reason: "expired_damaged" | "wrong_item" | "changed_mind" | "price_error";
  restock: boolean;
  refund: { method: "cash" | "card" | "wallet"; amount: string };
  original_bill_no?: string;
  returned_at: string;
}

export type ShiftSyncState =
  "open_pending" | "open_synced" | "close_pending" | "closed_synced";

export interface ShiftRow {
  id: string;
  counterId: number;
  cashierId: number;
  cashierName: string;
  openedAt: string;
  openingCash: string;
  status: "open" | "closed";
  closedAt: string | null;
  countedCash: string | null;
  syncState: ShiftSyncState;
  // Filled when the shift is closed on this PC, sent with /shifts/{id}/close.
  closeSummary?: Record<string, string | number> | null;
  unsyncedAtClose?: number | null;
  serverResult?: ShiftServerResult | null;
  // Refunds made in this shift (paisa); kept here so End of shift works after they upload.
  refunds?: { amount: number; paidFromDrawer: boolean }[];
}

export interface ShiftServerResult {
  expectedCash: string;
  difference: string;
  mismatch: boolean;
}

export interface HeldBillRow {
  id: string;
  shiftId: string;
  cashierId: number;
  title: string;
  lines: BillLine[];
  itemCount: number;
  total: string;
  heldAt: string;
}

// The full bill as sold on this PC, for reprints and returns (last 7 days).
export interface RecentBillRow {
  id: string;
  billNo: string;
  soldAt: string;
  shiftId: string;
  bill: CompletedBill;
}
