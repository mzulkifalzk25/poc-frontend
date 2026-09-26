export const CLOCK_SKEW_LIMIT_MS = 5 * 60 * 1000;

// Server time minus the local time halfway through the request.
export function clockOffsetMs(
  serverTimeIso: string,
  sentAtMs: number,
  receivedAtMs: number,
): number {
  const server = Date.parse(serverTimeIso);
  if (Number.isNaN(server)) {
    throw new Error(`Invalid server time: ${serverTimeIso}`);
  }
  return Math.round(server - (sentAtMs + receivedAtMs) / 2);
}

export function correctedTime(localNowMs: number, offsetMs: number): Date {
  return new Date(localNowMs + offsetMs);
}

export function isClockSkewed(offsetMs: number): boolean {
  return Math.abs(offsetMs) > CLOCK_SKEW_LIMIT_MS;
}
