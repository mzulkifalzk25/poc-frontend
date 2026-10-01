export const ACTIVITY_TYPES = [
  "all",
  "price",
  "refund",
  "held_bill",
  "stock",
  "shift",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface ActivityRow {
  id: number;
  occurredAt: string;
  user: string | null;
  action: string;
  detail: string;
  flag: "info" | "review";
}

export interface ActivityHeader {
  heldBillsDeletedToday: number;
  refundsToday: number;
  priceChangesToday: number;
}

export interface ActivityQuery {
  type: ActivityType;
  from: string;
  to: string;
}

export interface ActivityPage {
  rows: ActivityRow[];
  nextCursor: string | null;
  header: ActivityHeader;
}

export function activityTypeFrom(value: string | null): ActivityType {
  return ACTIVITY_TYPES.find((type) => type === value) ?? "all";
}
