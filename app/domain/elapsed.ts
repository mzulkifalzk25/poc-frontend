export function minutesBetween(fromIso: string, now: Date): number {
  const from = Date.parse(fromIso);
  if (Number.isNaN(from)) {
    throw new Error(`Invalid timestamp: ${fromIso}`);
  }
  return Math.max(0, Math.floor((now.getTime() - from) / 60_000));
}
