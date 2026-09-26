import { useEffect } from "react";

import { startPeriodicTask } from "~/infrastructure/sync/periodic-task";
import { sendHeartbeat, type HeartbeatDeps } from "~/use_cases/heartbeat";

export const HEARTBEAT_INTERVAL_MS = 15_000;

export function useHeartbeat(deps: HeartbeatDeps) {
  useEffect(
    () =>
      startPeriodicTask(() => sendHeartbeat(deps), {
        intervalMs: HEARTBEAT_INTERVAL_MS,
        triggers: ["online"],
      }),
    [deps],
  );
}
