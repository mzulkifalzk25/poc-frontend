import { minutesBetween } from "./elapsed";

export type StaffRole = "owner" | "manager" | "cashier";

export interface StaffMember {
  id: number;
  fullName: string;
  initials: string;
  role: StaffRole;
  defaultCounterId: number | null;
  isActive: boolean;
  lastActiveAt: string | null;
  pinDelayUntil: string | null;
}

export interface CashierDraft {
  fullName: string;
  pin: string;
  defaultCounterId: number | null;
}

// A signed-in counter sends a heartbeat every 15 s, which stamps `lastActiveAt`.
export const SIGNED_IN_WINDOW_MINUTES = 2;

export function isSignedInNow(member: StaffMember, now: Date): boolean {
  return (
    member.isActive &&
    member.lastActiveAt !== null &&
    minutesBetween(member.lastActiveAt, now) < SIGNED_IN_WINDOW_MINUTES
  );
}

export function isPinDelayed(member: StaffMember, now: Date): boolean {
  return (
    member.pinDelayUntil !== null &&
    Date.parse(member.pinDelayUntil) > now.getTime()
  );
}

export function staffSummary(members: StaffMember[], now: Date) {
  return {
    owners: members.filter((member) => member.role === "owner").length,
    cashiers: members.filter((member) => member.role === "cashier").length,
    signedIn: members.filter((member) => isSignedInNow(member, now)).length,
  };
}

export type CashierField = "fullName" | "pin";

export function cashierDraftErrors(
  draft: CashierDraft,
  isNew: boolean,
): Partial<Record<CashierField, "required" | "pin">> {
  const errors: Partial<Record<CashierField, "required" | "pin">> = {};
  if (draft.fullName.trim() === "") {
    errors.fullName = "required";
  }
  if (isNew && !/^[0-9]{4}$/.test(draft.pin)) {
    errors.pin = "pin";
  }
  return errors;
}
