import { minutesBetween } from "./elapsed";

export type StaffRole = "owner" | "manager" | "cashier";

export interface StaffMember {
  id: number;
  fullName: string;
  initials: string;
  role: StaffRole;
  email: string | null;
  username: string | null;
  defaultCounterId: number | null;
  isActive: boolean;
  lastActiveAt: string | null;
}

export interface CashierDraft {
  fullName: string;
  email: string;
  username: string;
  password: string;
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

export function staffSummary(members: StaffMember[], now: Date) {
  return {
    owners: members.filter((member) => member.role === "owner").length,
    cashiers: members.filter((member) => member.role === "cashier").length,
    signedIn: members.filter((member) => isSignedInNow(member, now)).length,
  };
}

export type CashierField = "fullName" | "login" | "password";

export function cashierDraftErrors(
  draft: CashierDraft,
  isNew: boolean,
): Partial<Record<CashierField, "required">> {
  const errors: Partial<Record<CashierField, "required">> = {};
  if (draft.fullName.trim() === "") {
    errors.fullName = "required";
  }
  if (isNew && draft.email.trim() === "" && draft.username.trim() === "") {
    errors.login = "required";
  }
  if (isNew && draft.password.trim() === "") {
    errors.password = "required";
  }
  return errors;
}
