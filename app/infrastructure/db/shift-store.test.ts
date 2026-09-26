import { describe, expect, it } from "vitest";

import type { ShiftRow } from "./rows";
import { createShiftStore } from "./shift-store";
import { freshDatabaseFactory } from "./test-database";

const freshDatabase = freshDatabaseFactory();

function shift(id: string, overrides: Partial<ShiftRow> = {}): ShiftRow {
  return {
    id,
    counterId: 2,
    cashierId: 12,
    cashierName: "Zainab Khan",
    openedAt: "2026-09-26T04:00:00Z",
    openingCash: "5000.00",
    status: "open",
    closedAt: null,
    countedCash: null,
    syncState: "open_pending",
    ...overrides,
  };
}

describe("shift store", () => {
  it("finds the open shift of this counter", async () => {
    const store = createShiftStore(freshDatabase());
    await store.save(
      shift("old", { status: "closed", syncState: "closed_synced" }),
    );
    await store.save(shift("other", { counterId: 3 }));
    await store.save(shift("now"));

    await expect(store.current(2)).resolves.toMatchObject({ id: "now" });
    await expect(store.current(9)).resolves.toBeNull();
  });

  it("lists shifts still waiting to upload", async () => {
    const store = createShiftStore(freshDatabase());
    await store.save(shift("a"));
    await store.save(shift("b", { syncState: "open_synced" }));
    await store.update("b", { status: "closed", syncState: "close_pending" });

    const waiting = await store.waitingUpload();

    expect(waiting.map((row) => row.id).sort()).toEqual(["a", "b"]);
  });
});
