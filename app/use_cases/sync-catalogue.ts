import type { StoreSettings } from "~/domain/store-settings";
import { FIRST_CURSOR } from "~/domain/sync-cursor";
import type { CatalogueStore } from "~/infrastructure/db/catalogue-store";
import { META_KEYS, type SyncCursors } from "~/infrastructure/db/meta-keys";
import type { MetaStore } from "~/infrastructure/db/meta-store";
import type {
  PeopleStore,
  PersonUpdate,
} from "~/infrastructure/db/people-store";
import type {
  CategoryRow,
  ProductRow,
  StockRow,
} from "~/infrastructure/db/rows";

export interface ProductPage {
  products: ProductRow[];
  categories: CategoryRow[];
  nextSince: string;
  hasMore: boolean;
}

export interface CounterSyncApi {
  products: (since: string) => Promise<ProductPage>;
  stock: (since: string) => Promise<{ levels: StockRow[]; nextSince: string }>;
  people: (
    since: string,
  ) => Promise<{ people: PersonUpdate[]; nextSince: string }>;
  bootstrap: () => Promise<{
    settings: StoreSettings;
    lastBillSeq: number;
    serverTime: string;
  }>;
}

export interface SyncDeps {
  api: CounterSyncApi;
  catalogue: Pick<
    CatalogueStore,
    "applyProducts" | "applyCategories" | "applyStock" | "countLive"
  >;
  people: Pick<PeopleStore, "applyPeople" | "list">;
  meta: MetaStore;
  now: () => Date;
}

export type SyncProgress =
  | { phase: "products"; loaded: number }
  | { phase: "stock" }
  | { phase: "people" }
  | { phase: "settings" };

export interface SyncSummary {
  products: number;
  cashiers: number;
}

const START: SyncCursors = {
  products: FIRST_CURSOR,
  stock: FIRST_CURSOR,
  people: FIRST_CURSOR,
};

async function pullProducts(
  deps: SyncDeps,
  since: string,
  onProgress: (p: SyncProgress) => void,
) {
  let cursor = since;
  let loaded = 0;
  for (;;) {
    const page = await deps.api.products(cursor);
    await deps.catalogue.applyCategories(page.categories);
    await deps.catalogue.applyProducts(page.products);
    loaded += page.products.length;
    cursor = page.nextSince;
    onProgress({ phase: "products", loaded });
    if (!page.hasMore) {
      return cursor;
    }
  }
}

async function pullSettings(deps: SyncDeps) {
  const boot = await deps.api.bootstrap();
  const localSeq = (await deps.meta.get<number>(META_KEYS.billSeq)) ?? 0;
  await deps.meta.set(META_KEYS.settings, boot.settings);
  await deps.meta.set(META_KEYS.billSeq, Math.max(localSeq, boot.lastBillSeq));
  return boot.serverTime;
}

// Products, then stock, then people, then settings; cursors are saved only at the end.
async function pullAll(
  deps: SyncDeps,
  from: SyncCursors,
  onProgress: (p: SyncProgress) => void,
) {
  const products = await pullProducts(deps, from.products, onProgress);
  onProgress({ phase: "stock" });
  const stock = await deps.api.stock(from.stock);
  await deps.catalogue.applyStock(stock.levels);
  onProgress({ phase: "people" });
  const people = await deps.api.people(from.people);
  await deps.people.applyPeople(people.people);
  onProgress({ phase: "settings" });
  const serverTime = await pullSettings(deps);
  const cursors: SyncCursors = {
    products,
    stock: stock.nextSince,
    people: people.nextSince,
  };
  await deps.meta.set(META_KEYS.cursors, cursors);
  await deps.meta.set(META_KEYS.lastSyncAt, deps.now().toISOString());
  return serverTime;
}

async function summary(deps: SyncDeps): Promise<SyncSummary> {
  return {
    products: await deps.catalogue.countLive(),
    cashiers: (await deps.people.list()).length,
  };
}

export async function isFirstSyncDone(meta: MetaStore): Promise<boolean> {
  return (await meta.get<boolean>(META_KEYS.firstSyncDone)) === true;
}

export async function runFirstSync(
  deps: SyncDeps,
  onProgress: (progress: SyncProgress) => void = () => undefined,
): Promise<SyncSummary> {
  await pullAll(deps, START, onProgress);
  await deps.meta.set(META_KEYS.firstSyncDone, true);
  return summary(deps);
}
