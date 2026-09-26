import type { StoreSettings } from "~/domain/store-settings";
import type { ScanDeps } from "~/use_cases/scan-product";

import { catalogueStore } from "../db/catalogue-store";
import { META_KEYS } from "../db/meta-keys";
import { metaStore } from "../db/meta-store";

export async function loadStoreSettings(): Promise<StoreSettings | null> {
  return metaStore.get<StoreSettings>(META_KEYS.settings);
}

export const scanDeps: ScanDeps = {
  findByBarcode: catalogueStore.findByBarcode,
  getStock: catalogueStore.getStock,
  blockWhenOutOfStock: async () =>
    (await loadStoreSettings())?.blockWhenOutOfStock === true,
};
