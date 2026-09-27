export type CounterStatus =
  "not_activated" | "code_ready" | "activated" | "deactivated";

export interface Counter {
  id: number;
  name: string;
  code: string;
  status: CounterStatus;
  codeExpiresAt: string | null;
  lastSeenAt: string | null;
  nextBillNo: string;
  unsyncedCount: number | null;
  hasOpenShift: boolean;
  hasBills: boolean;
}
