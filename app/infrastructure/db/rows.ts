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

// Returns are defined in Step F6; the outbox only needs the client id.
export type ReturnUpload = { id: string } & Record<string, unknown>;

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
