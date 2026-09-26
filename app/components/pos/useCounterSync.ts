import { useEffect } from "react";

import { startPeriodicTask } from "~/infrastructure/sync/periodic-task";
import { runDeltaSync, type SyncDeps } from "~/use_cases/sync-catalogue";

export const DELTA_SYNC_INTERVAL_MS = 60_000;

// Keeps the counter's catalogue, stock, people and settings fresh while it is open.
export function useCounterSync(deps: SyncDeps) {
  useEffect(
    () =>
      startPeriodicTask(() => runDeltaSync(deps), {
        intervalMs: DELTA_SYNC_INTERVAL_MS,
        triggers: ["online", "focus"],
      }),
    [deps],
  );
}
