import { useCallback, useEffect, useState } from "react";

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "ready"; data: T };

interface Settled<T> {
  load: () => Promise<T>;
  attempt: number;
  state: AsyncState<T>;
}

export interface AsyncData<T> {
  state: AsyncState<T>;
  reload: () => void;
}

// `load` must be stable (wrap it in useCallback); a new function starts a new request.
export function useAsyncData<T>(load: () => Promise<T>): AsyncData<T> {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const settle = (state: AsyncState<T>) => {
      if (!cancelled) {
        setSettled({ load, attempt, state });
      }
    };
    load().then(
      (data) => {
        settle({ status: "ready", data });
      },
      (error: unknown) => {
        settle({ status: "error", error });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [load, attempt]);

  const reload = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  const isCurrent = settled?.load === load && settled.attempt === attempt;
  return {
    state: isCurrent ? settled.state : { status: "loading" },
    reload,
  };
}
