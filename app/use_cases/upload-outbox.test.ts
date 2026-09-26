import { describe, expect, it, vi } from "vitest";

import { ApiError } from "~/infrastructure/api/errors";
import { createOutbox } from "~/infrastructure/db/outbox-store";
import type { AuditEventUpload, BillUpload } from "~/infrastructure/db/rows";
import {
  billUpload,
  freshDatabaseFactory,
} from "~/infrastructure/db/test-database";

import {
  BATCH_SIZE,
  uploadOutbox,
  type BatchResult,
  type UploadApi,
  type UploadDeps,
} from "./upload-outbox";

const freshDatabase = freshDatabaseFactory();

function created(ids: string[]): BatchResult[] {
  return ids.map((id) => ({ id, status: "created", errors: [] }));
}

function event(id: string): AuditEventUpload {
  return { id, action: "pin_failure", occurred_at: "2026-09-26T10:00:00Z" };
}

function setup(api: Partial<UploadApi> = {}) {
  const database = freshDatabase();
  const order: string[] = [];
  const fullApi: UploadApi = {
    sendBills: vi.fn((_counter: number, bills: BillUpload[]) => {
      order.push(`bills:${String(bills.length)}`);
      return Promise.resolve(created(bills.map((bill) => bill.id)));
    }),
    sendEvents: vi.fn((events: AuditEventUpload[]) => {
      order.push(`events:${String(events.length)}`);
      return Promise.resolve(created(events.map((item) => item.id)));
    }),
    ...api,
  };
  const deps: UploadDeps = {
    api: fullApi,
    bills: createOutbox(database.bills_outbox),
    audit: createOutbox(database.audit_outbox),
    counterId: () => Promise.resolve(2),
    uploadShifts: vi.fn(() => {
      order.push("shifts");
      return Promise.resolve();
    }),
    now: () => 10_000,
    random: () => 0.5,
  };
  return { database, deps, order };
}

async function queueBills(deps: UploadDeps, count: number) {
  const outbox = deps.bills as ReturnType<typeof createOutbox<BillUpload>>;
  for (let i = 0; i < count; i += 1) {
    await outbox.add(billUpload(`b${String(i).padStart(3, "0")}`), 1000 + i);
  }
}

describe("uploadOutbox", () => {
  it("sends shifts first, then bills in batches of 50, then audit events", async () => {
    const { deps, order, database } = setup();
    await queueBills(deps, 60);
    await (deps.audit as ReturnType<typeof createOutbox<AuditEventUpload>>).add(
      event("e1"),
      500,
    );

    await expect(uploadOutbox(deps)).resolves.toBe(61);

    expect(order).toEqual([
      "shifts",
      `bills:${String(BATCH_SIZE)}`,
      "bills:10",
      "events:1",
    ]);
    expect(await database.bills_outbox.count()).toBe(0);
    expect(await database.audit_outbox.count()).toBe(0);
  });

  it("removes duplicates, keeps rejected bills and retries missing ones", async () => {
    const { deps, database } = setup({
      sendBills: () =>
        Promise.resolve([
          { id: "b000", status: "duplicate", errors: [] },
          { id: "b001", status: "rejected", errors: ["items: bad qty"] },
        ] satisfies BatchResult[]),
    });
    await queueBills(deps, 3);

    await uploadOutbox(deps);

    expect(await database.bills_outbox.get("b000")).toBeUndefined();
    expect(await database.bills_outbox.get("b001")).toMatchObject({
      status: "rejected",
      errors: ["items: bad qty"],
    });
    expect(await database.bills_outbox.get("b002")).toMatchObject({
      status: "pending",
      attempts: 1,
      nextTryAt: 12_000,
    });
  });

  it("keeps bills and backs off when the network fails, and holds audit events back", async () => {
    const { deps, database } = setup({
      sendBills: () => Promise.reject(new TypeError("Failed to fetch")),
    });
    await queueBills(deps, 2);
    await (deps.audit as ReturnType<typeof createOutbox<AuditEventUpload>>).add(
      event("e1"),
      500,
    );

    await expect(uploadOutbox(deps)).resolves.toBe(0);

    expect(await database.bills_outbox.get("b000")).toMatchObject({
      attempts: 1,
      nextTryAt: 12_000,
    });
    expect(deps.api.sendEvents).not.toHaveBeenCalled();
    expect(await database.audit_outbox.count()).toBe(1);
  });

  it("waits as long as Retry-After says", async () => {
    const { deps, database } = setup({
      sendBills: () =>
        Promise.reject(
          new ApiError(429, {
            error: { code: "throttled", message: "Busy" },
            retry_after: 90,
          }),
        ),
    });
    await queueBills(deps, 1);

    await uploadOutbox(deps);

    expect(await database.bills_outbox.get("b000")).toMatchObject({
      nextTryAt: 100_000,
    });
  });

  it("stops everything when the PC was deactivated", async () => {
    const { deps } = setup({
      sendBills: () =>
        Promise.reject(
          new ApiError(401, {
            error: { code: "device_revoked", message: "Revoked" },
          }),
        ),
    });
    await queueBills(deps, 1);

    await expect(uploadOutbox(deps)).rejects.toThrow();
  });

  it("does nothing on a PC that is not activated", async () => {
    const { deps } = setup();
    deps.counterId = () => Promise.resolve(null);

    await expect(uploadOutbox(deps)).resolves.toBe(0);
    expect(deps.uploadShifts).not.toHaveBeenCalled();
  });
});
