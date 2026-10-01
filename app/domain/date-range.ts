// Calendar dates are "YYYY-MM-DD" strings in the store's time zone.
export interface DateRange {
  from: string;
  to: string;
}

function parts(iso: string): [number, number, number] {
  const [year, month, day] = iso.split("-").map(Number);
  return [year ?? 0, month ?? 1, day ?? 1];
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function utc(iso: string): Date {
  const [year, month, day] = parts(iso);
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDays(iso: string, days: number): string {
  const date = utc(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIso(date);
}

export function startOfMonth(iso: string): string {
  const [year, month] = parts(iso);
  return toIso(new Date(Date.UTC(year, month - 1, 1)));
}

export function endOfMonth(iso: string): string {
  const [year, month] = parts(iso);
  return toIso(new Date(Date.UTC(year, month, 0)));
}

export function addMonths(iso: string, months: number): string {
  const [year, month] = parts(iso);
  return toIso(new Date(Date.UTC(year, month - 1 + months, 1)));
}

export function daysBetween(range: DateRange): number {
  return (
    Math.round(
      (utc(range.to).getTime() - utc(range.from).getTime()) / 86_400_000,
    ) + 1
  );
}

export type ReportPreset = "today" | "7d" | "30d" | "custom";

export function reportRange(preset: ReportPreset, today: string): DateRange {
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "7d":
      return { from: addDays(today, -6), to: today };
    case "30d":
    case "custom":
      return { from: addDays(today, -29), to: today };
  }
}

export type MoneyPreset = "this_month" | "last_month" | "last_12" | "custom";

export function moneyRange(preset: MoneyPreset, today: string): DateRange {
  switch (preset) {
    case "this_month":
    case "custom":
      return { from: startOfMonth(today), to: today };
    case "last_month": {
      const previous = addMonths(today, -1);
      return { from: startOfMonth(previous), to: endOfMonth(previous) };
    }
    case "last_12":
      return { from: addMonths(today, -11), to: today };
  }
}

// How a report range is bucketed: hours for one day, days up to two weeks, else weeks.
export function summaryGroup(range: DateRange): "hour" | "day" | "week" {
  const days = daysBetween(range);
  if (days === 1) {
    return "hour";
  }
  return days <= 14 ? "day" : "week";
}

function format(iso: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-GB", {
    ...options,
    timeZone: "UTC",
  }).format(utc(iso.length === 7 ? `${iso}-01` : iso));
}

export const weekdayShort = (iso: string) => format(iso, { weekday: "short" });
export const dayMonth = (iso: string) =>
  format(iso, { day: "numeric", month: "short" });
export const monthShort = (iso: string) => format(iso, { month: "short" });
export const monthLong = (iso: string) => format(iso, { month: "long" });
export const dayOfMonth = (iso: string) => format(iso, { day: "numeric" });

// "20–26 Aug", "27 Aug–2 Sep" or "19 Sep" for one day.
export function periodLabel(start: string, end: string): string {
  if (start === end) {
    return dayMonth(start);
  }
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  return sameMonth
    ? `${dayOfMonth(start)}–${dayMonth(end)}`
    : `${dayMonth(start)}–${dayMonth(end)}`;
}

const MAX_MONEY_DAYS = 93;
const MAX_MONEY_MONTHS = 24;

// Days up to about three months, else months; null when the range is not allowed.
export function moneyGroup(range: DateRange): "day" | "month" | null {
  const days = daysBetween(range);
  if (days < 1) {
    return null;
  }
  if (days <= MAX_MONEY_DAYS) {
    return "day";
  }
  const [fromYear, fromMonth] = parts(range.from);
  const [toYear, toMonth] = parts(range.to);
  const months = (toYear - fromYear) * 12 + toMonth - fromMonth;
  return months < MAX_MONEY_MONTHS ? "month" : null;
}
