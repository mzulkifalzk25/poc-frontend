import { useCallback, useEffect, useMemo, useState } from "react";

export interface CursorPage<R, X> {
  rows: R[];
  nextCursor: string | null;
  extra: X;
}

export type CursorState<R, X> =
  | { status: "loading" }
  | { status: "error" }
  | ({ status: "ready"; loadingMore: boolean } & CursorPage<R, X>);

// First page for the filters (`queryKey` changes start over), then "Load more" appends.
export function useCursorPages<R, X>(
  queryKey: string,
  load: (cursor: string | null) => Promise<CursorPage<R, X>>,
) {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<{
    key: string;
    state: CursorState<R, X>;
  } | null>(null);
  const key = `${queryKey}#${String(attempt)}`;

  useEffect(() => {
    let cancelled = false;
    load(null).then(
      (page) => {
        if (!cancelled) {
          setSettled({
            key,
            state: { status: "ready", loadingMore: false, ...page },
          });
        }
      },
      () => {
        if (!cancelled) {
          setSettled({ key, state: { status: "error" } });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [key, load]);

  const state = useMemo<CursorState<R, X>>(
    () => (settled?.key === key ? settled.state : { status: "loading" }),
    [settled, key],
  );

  const loadMore = useCallback(async () => {
    if (state.status !== "ready" || state.nextCursor === null) {
      return;
    }
    const current = state;
    setSettled({ key, state: { ...current, loadingMore: true } });
    try {
      const page = await load(current.nextCursor);
      setSettled({
        key,
        state: {
          status: "ready",
          loadingMore: false,
          ...page,
          rows: [...current.rows, ...page.rows],
        },
      });
    } catch {
      setSettled({ key, state: { ...current, loadingMore: false } });
    }
  }, [state, key, load]);

  return {
    state,
    loadMore,
    reload: () => {
      setAttempt((value) => value + 1);
    },
  };
}
