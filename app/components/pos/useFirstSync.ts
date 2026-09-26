import { useCallback, useEffect, useState } from "react";

import {
  runFirstSync,
  type SyncDeps,
  type SyncProgress,
  type SyncSummary,
} from "~/use_cases/sync-catalogue";

export type FirstSyncState =
  | { status: "running"; progress: SyncProgress | null }
  | { status: "done"; summary: SyncSummary }
  | { status: "failed" };

export function useFirstSync(deps: SyncDeps, enabled = true) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<FirstSyncState>({
    status: "running",
    progress: null,
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;
    runFirstSync(deps, (progress) => {
      if (!cancelled) {
        setState({ status: "running", progress });
      }
    }).then(
      (summary) => {
        if (!cancelled) {
          setState({ status: "done", summary });
        }
      },
      () => {
        if (!cancelled) {
          setState({ status: "failed" });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [deps, enabled, attempt]);

  const retry = useCallback(() => {
    setState({ status: "running", progress: null });
    setAttempt((current) => current + 1);
  }, []);

  return { state, retry };
}
