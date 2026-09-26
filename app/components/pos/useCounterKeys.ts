import { useEffect, useEffectEvent } from "react";

export type CounterKey = "F2" | "F4" | "F9" | "Escape";

export type CounterKeyHandlers = Partial<Record<CounterKey, () => void>>;

const KEYS: readonly string[] = ["F2", "F4", "F9", "Escape"];

function isCounterKey(key: string): key is CounterKey {
  return KEYS.includes(key);
}

// F2 scan box, F4 hold, F9 pay, Esc closes search; works wherever the focus is.
export function useCounterKeys(handlers: CounterKeyHandlers) {
  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (!isCounterKey(event.key)) {
      return;
    }
    const handler = handlers[event.key];
    if (handler) {
      event.preventDefault();
      handler();
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, []);
}
