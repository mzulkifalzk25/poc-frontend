import { describe, expect, it, vi } from "vitest";

import type { StoreSettings } from "~/domain/store-settings";
import { createCatalogueStore } from "~/infrastructure/db/catalogue-store";
import { META_KEYS } from "~/infrastructure/db/meta-keys";
import { createMetaStore } from "~/infrastructure/db/meta-store";
import { createPeopleStore } from "~/infrastructure/db/people-store";
import {
  freshDatabaseFactory,
  productRow,
} from "~/infrastructure/db/test-database";

import {
  isFirstSyncDone,
  runDeltaSync,
  runFirstSync,
  type CounterSyncApi,
  type SyncDeps,
  type SyncProgress,
} from "./sync-catalogue";

const freshDatabase = freshDatabaseFactory();

const settings: StoreSettings = {
  storeName: "Fresh Basket Mart",
  phone: "",
  address: "",
  taxRate: "0.00",
  pricesIncludeTax: false,
  blockWhenOutOfStock: false,
  receiptPaperMm: 80,
  receiptHeader: "",
  receiptFooter: "",
  receiptShowBarcode: true,
};

function fakeApi(): CounterSyncApi {
  return {
    products: vi.fn((since: string) =>
      Promise.resolve(
        since === "0"
          ? {
              products: [productRow(1), productRow(2)],
              categories: [{ id: 1, name: "Grocery", tint: "grocery" }],
              nextSince: "p1",
              hasMore: true,
            }
          : {
              products: [productRow(3, { isArchived: true })],
              categories: [],
              nextSince: "p2",
              hasMore: false,
            },
      ),
    ),
    stock: vi.fn(() =>
      Promise.resolve({
        levels: [{ productId: 1, qty: "84.000" }],
        nextSince: "s1",
      }),
    ),
    people: vi.fn(() =>
      Promise.resolve({
        people: [
          {
            id: 12,
            fullName: "Zainab Khan",
            initials: "ZK",
            pinVerifier: "pbkdf2_sha256$1$s$h",
            active: true,
            unlockedAt: null,
          },
        ],
        nextSince: "2026-09-26T10:00:00Z",
      }),
    ),
    bootstrap: vi.fn(() =>
      Promise.resolve({
        settings,
        lastBillSeq: 742,
        serverTime: "2026-09-26T10:00:00Z",
      }),
    ),
  };
}

function syncDeps(api: CounterSyncApi = fakeApi()): SyncDeps {
  const database = freshDatabase();
  return {
    api,
    catalogue: createCatalogueStore(database),
    people: createPeopleStore(database),
    meta: createMetaStore(database),
    now: () => new Date("2026-09-26T10:00:01Z"),
  };
}

describe("runFirstSync", () => {
  it("pages products from 0, then stock, people and settings", async () => {
    const deps = syncDeps();
    const progress: SyncProgress[] = [];

    const result = await runFirstSync(deps, (step) => progress.push(step));

    expect(result).toEqual({ products: 2, cashiers: 1 });
    expect(vi.mocked(deps.api.products).mock.calls).toEqual([["0"], ["p1"]]);
    expect(progress).toEqual([
      { phase: "products", loaded: 2 },
      { phase: "products", loaded: 3 },
      { phase: "stock" },
      { phase: "people" },
      { phase: "settings" },
    ]);
    await expect(deps.meta.get(META_KEYS.cursors)).resolves.toEqual({
      products: "p2",
      stock: "s1",
      people: "2026-09-26T10:00:00Z",
    });
    await expect(deps.meta.get(META_KEYS.settings)).resolves.toEqual(settings);
    await expect(isFirstSyncDone(deps.meta)).resolves.toBe(true);
  });

  it("continues the bill sequence above what the server has seen", async () => {
    const deps = syncDeps();
    await deps.meta.set(META_KEYS.billSeq, 700);

    await runFirstSync(deps);

    await expect(deps.meta.get(META_KEYS.billSeq)).resolves.toBe(742);
  });

  it("keeps a higher local sequence", async () => {
    const deps = syncDeps();
    await deps.meta.set(META_KEYS.billSeq, 800);

    await runFirstSync(deps);

    await expect(deps.meta.get(META_KEYS.billSeq)).resolves.toBe(800);
  });

  it("is not done when a step fails, so a shift cannot start", async () => {
    const api = fakeApi();
    api.people = () => Promise.reject(new TypeError("Failed to fetch"));
    const deps = syncDeps(api);

    await expect(runFirstSync(deps)).rejects.toThrow();
    await expect(isFirstSyncDone(deps.meta)).resolves.toBe(false);
    await expect(deps.meta.get(META_KEYS.cursors)).resolves.toBeNull();
  });
});

describe("runDeltaSync", () => {
  it("runs the first sync when it never finished", async () => {
    const deps = syncDeps();

    await runDeltaSync(deps);

    expect(vi.mocked(deps.api.products).mock.calls[0]).toEqual(["0"]);
    await expect(isFirstSyncDone(deps.meta)).resolves.toBe(true);
  });

  it("asks for changes since the cursors with a 10 s overlap", async () => {
    const deps = syncDeps();
    await runFirstSync(deps);
    vi.mocked(deps.api.products).mockClear();

    await runDeltaSync(deps);

    expect(vi.mocked(deps.api.products).mock.calls[0]).toEqual(["p2"]);
    expect(vi.mocked(deps.api.people).mock.calls.at(-1)).toEqual([
      "2026-09-26T09:59:50.000Z",
    ]);
  });

  it("removes archived products and deactivated cashiers locally", async () => {
    const api = fakeApi();
    const deps = syncDeps(api);
    await runFirstSync(deps);
    api.products = () =>
      Promise.resolve({
        products: [productRow(1, { isArchived: true })],
        categories: [],
        nextSince: "p3",
        hasMore: false,
      });
    api.people = () =>
      Promise.resolve({
        people: [
          {
            id: 12,
            fullName: "Zainab Khan",
            initials: "ZK",
            pinVerifier: null,
            active: false,
            unlockedAt: null,
          },
        ],
        nextSince: "2026-09-26T10:01:00Z",
      });

    const result = await runDeltaSync(deps);

    expect(result).toEqual({ products: 1, cashiers: 0 });
  });
});
