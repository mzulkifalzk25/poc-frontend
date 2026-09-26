import { correctedTime } from "~/domain/clock";

import { META_KEYS } from "./db/meta-keys";
import { metaStore, type MetaStore } from "./db/meta-store";

export function createCounterClock(meta: MetaStore, localNowMs: () => number) {
  let offsetMs: number | null = null;
  return {
    load: async () => {
      offsetMs = (await meta.get<number>(META_KEYS.clockOffsetMs)) ?? 0;
      return offsetMs;
    },
    record: async (next: number) => {
      offsetMs = next;
      await meta.set(META_KEYS.clockOffsetMs, next);
    },
    offset: () => offsetMs ?? 0,
    // Local time corrected by the last known server offset (sold_at, returned_at).
    now: () => correctedTime(localNowMs(), offsetMs ?? 0),
  };
}

export type CounterClock = ReturnType<typeof createCounterClock>;

export const counterClock = createCounterClock(metaStore, () => Date.now());
