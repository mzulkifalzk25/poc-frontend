import { minutesBetween } from "~/domain/elapsed";
import { SIGNED_IN_WINDOW_MINUTES } from "~/domain/staff";
import { t } from "~/i18n/t";

const HOUR = 60;
const DAY = 24 * HOUR;

export function lastActiveLabel(lastActiveAt: string | null, now: Date) {
  const strings = t().staff.lastActive;
  if (lastActiveAt === null) {
    return strings.never;
  }
  const minutes = minutesBetween(lastActiveAt, now);
  if (minutes < SIGNED_IN_WINDOW_MINUTES) {
    return strings.now;
  }
  if (minutes < HOUR) {
    return strings.minutes(minutes);
  }
  if (minutes < DAY) {
    return strings.hours(Math.floor(minutes / HOUR));
  }
  const days = Math.floor(minutes / DAY);
  return days === 1 ? strings.yesterday : strings.days(days);
}
