export const MIN_BACKOFF_MS = 2_000;
export const MAX_BACKOFF_MS = 300_000;

// Doubles from 2 s up to 5 min; jitter keeps 40 counters from retrying in step.
export function backoffDelayMs(attempts: number, random: number): number {
  const base = Math.min(
    MAX_BACKOFF_MS,
    MIN_BACKOFF_MS * 2 ** Math.max(0, attempts),
  );
  return Math.max(MIN_BACKOFF_MS, Math.round(base / 2 + (random * base) / 2));
}

// The server's Retry-After wins when it sends one.
export function retryDelayMs(
  attempts: number,
  random: number,
  retryAfterSeconds: number | null,
): number {
  if (retryAfterSeconds !== null && retryAfterSeconds > 0) {
    return Math.max(MIN_BACKOFF_MS, retryAfterSeconds * 1000);
  }
  return backoffDelayMs(attempts, random);
}
