import { useEffect } from "react";

import { OUTBOX_CHANGED } from "~/infrastructure/sync/outbox-events";
import { startPeriodicTask } from "~/infrastructure/sync/periodic-task";
import { uploadOutbox, type UploadDeps } from "~/use_cases/upload-outbox";

export const UPLOAD_INTERVAL_MS = 15_000;
export const RECONNECT_MAX_DELAY_MS = 60_000;

// One worker per counter: every 15 s, after each sale, and 0 to 60 s after coming back online.
export function useUploadWorker(deps: UploadDeps) {
  useEffect(
    () =>
      startPeriodicTask(() => uploadOutbox(deps), {
        intervalMs: UPLOAD_INTERVAL_MS,
        triggers: [OUTBOX_CHANGED],
        delayedTriggers: [
          { event: "online", maxDelayMs: RECONNECT_MAX_DELAY_MS },
        ],
      }),
    [deps],
  );
}
