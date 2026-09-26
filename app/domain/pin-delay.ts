export const FREE_FAILURES = 3;
export const DELAYS_SECONDS = [30, 60, 300] as const;

export interface PinDelayState {
  failCount: number;
  nextAllowedAt: string | null;
  lastFailedAt: string | null;
}

export const NO_DELAY: PinDelayState = {
  failCount: 0,
  nextAllowedAt: null,
  lastFailedAt: null,
};

// Three free wrong PINs, then 30 s, 1 min and 5 min (the cap), as on the server.
export function delaySeconds(failCount: number): number {
  const extra = failCount - FREE_FAILURES;
  if (extra <= 0) {
    return 0;
  }
  return DELAYS_SECONDS[Math.min(extra, DELAYS_SECONDS.length) - 1] ?? 0;
}

export function afterFailure(state: PinDelayState, now: Date): PinDelayState {
  const failCount = state.failCount + 1;
  const delay = delaySeconds(failCount);
  return {
    failCount,
    nextAllowedAt: delay
      ? new Date(now.getTime() + delay * 1000).toISOString()
      : null,
    lastFailedAt: now.toISOString(),
  };
}

export function secondsRemaining(state: PinDelayState, now: Date): number {
  if (!state.nextAllowedAt) {
    return 0;
  }
  return Math.max(
    0,
    Math.ceil((Date.parse(state.nextAllowedAt) - now.getTime()) / 1000),
  );
}

// The owner's unlock (unlocked_at from people sync) clears failures made before it.
export function applyUnlock(
  state: PinDelayState,
  unlockedAt: string | null,
): PinDelayState {
  if (!unlockedAt || !state.lastFailedAt) {
    return state;
  }
  return Date.parse(unlockedAt) >= Date.parse(state.lastFailedAt)
    ? NO_DELAY
    : state;
}

export function serverDelay(
  state: PinDelayState,
  retryAfterSeconds: number,
  now: Date,
): PinDelayState {
  return {
    failCount: Math.max(state.failCount, FREE_FAILURES + 1),
    nextAllowedAt: new Date(
      now.getTime() + retryAfterSeconds * 1000,
    ).toISOString(),
    lastFailedAt: now.toISOString(),
  };
}
