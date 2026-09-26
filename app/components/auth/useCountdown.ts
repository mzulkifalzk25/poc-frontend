import { useCallback, useEffect, useState } from "react";

interface CountdownState {
  deadline: number;
  now: number;
}

export interface Countdown {
  secondsRemaining: number | null;
  start: (seconds: number) => void;
  clear: () => void;
}

export function useCountdown(): Countdown {
  const [state, setState] = useState<CountdownState | null>(null);
  const deadline = state?.deadline;

  useEffect(() => {
    if (deadline === undefined) {
      return;
    }
    const interval = setInterval(() => {
      setState((current) => current && { ...current, now: Date.now() });
    }, 250);
    return () => {
      clearInterval(interval);
    };
  }, [deadline]);

  const start = useCallback((seconds: number) => {
    const now = Date.now();
    setState({ deadline: now + seconds * 1000, now });
  }, []);

  const clear = useCallback(() => {
    setState(null);
  }, []);

  const remaining = state ? Math.ceil((state.deadline - state.now) / 1000) : 0;
  return { secondsRemaining: remaining > 0 ? remaining : null, start, clear };
}
