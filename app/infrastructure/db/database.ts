import Dexie, { type EntityTable } from "dexie";

import type {
  AuditEventUpload,
  BillUpload,
  CategoryRow,
  HeldBillRow,
  OutboxRow,
  ProductRow,
  RecentBillRow,
  ReturnUpload,
  ShiftRow,
  StockRow,
  UserRow,
} from "./rows";

export interface MetaRow {
  key: string;
  value: unknown;
}

// Store names follow the contract (section 5), so they stay snake_case.
export class MartDeskDatabase extends Dexie {
  meta!: EntityTable<MetaRow, "key">;
  products!: EntityTable<ProductRow, "id">;
  categories!: EntityTable<CategoryRow, "id">;
  stock!: EntityTable<StockRow, "productId">;
  users!: EntityTable<UserRow, "id">;
  bills_outbox!: EntityTable<OutboxRow<BillUpload>, "id">;
  shifts!: EntityTable<ShiftRow, "id">;
  held_bills!: EntityTable<HeldBillRow, "id">;
  recent_bills!: EntityTable<RecentBillRow, "id">;
  returns_outbox!: EntityTable<OutboxRow<ReturnUpload>, "id">;
  audit_outbox!: EntityTable<OutboxRow<AuditEventUpload>, "id">;

  constructor(name = "martdesk") {
    super(name);
    this.version(1).stores({ meta: "key" });
    this.version(2).stores({
      products: "id, barcode, nameLc, categoryId",
      categories: "id",
      stock: "productId",
      users: "id, nameKey",
      bills_outbox: "id, status, nextTryAt, createdAt",
      shifts: "id, status, syncState",
      held_bills: "id, shiftId, heldAt",
      recent_bills: "id, billNo, soldAt",
      returns_outbox: "id, status, nextTryAt, createdAt",
      audit_outbox: "id, status, nextTryAt, createdAt",
    });
  }
}

export const db = new MartDeskDatabase();
