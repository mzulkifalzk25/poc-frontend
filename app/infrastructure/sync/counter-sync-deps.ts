import type { SyncDeps } from "~/use_cases/sync-catalogue";

import { counterSyncApi } from "../api/counter-sync-api";
import { catalogueStore } from "../db/catalogue-store";
import { metaStore } from "../db/meta-store";
import { peopleStore } from "../db/people-store";

export const counterSyncDeps: SyncDeps = {
  api: counterSyncApi,
  catalogue: catalogueStore,
  people: peopleStore,
  meta: metaStore,
  now: () => new Date(),
};
