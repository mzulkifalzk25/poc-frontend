// "12 Sep" in the store's time zone, from a UTC ISO timestamp.
export function formatDayMonth(isoUtc: string, timeZone: string): string {
  const date = new Date(isoUtc);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp: ${isoUtc}`);
  }
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    timeZone,
  }).formatToParts(date);
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("day")} ${part("month")}`;
}

function parts(
  isoUtc: string,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
) {
  const date = new Date(isoUtc);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp: ${isoUtc}`);
  }
  const list = new Intl.DateTimeFormat("en-US", {
    ...options,
    timeZone,
  }).formatToParts(date);
  return (type: string) => list.find((item) => item.type === type)?.value ?? "";
}

// "19 Sep 2026" in the store's time zone.
export function formatDayMonthYear(isoUtc: string, timeZone: string): string {
  const part = parts(isoUtc, timeZone, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `${part("day")} ${part("month")} ${part("year")}`;
}

// "17:47" (24-hour) in the store's time zone.
export function formatClockTime(isoUtc: string, timeZone: string): string {
  const part = parts(isoUtc, timeZone, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return `${part("hour")}:${part("minute")}`;
}
