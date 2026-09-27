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

export interface CounterDraft {
  name: string;
  code: string;
}

export interface ActivationCode {
  counterId: number;
  code: string;
  expiresAt: string;
}

export function counterDraftErrors(
  draft: CounterDraft,
): Partial<Record<keyof CounterDraft, "required" | "code">> {
  const errors: Partial<Record<keyof CounterDraft, "required" | "code">> = {};
  if (draft.name.trim() === "") {
    errors.name = "required";
  }
  if (!/^[0-9]{3}$/.test(draft.code)) {
    errors.code = "code";
  }
  return errors;
}

// A live PC is deactivated; any other counter gets a new activation code.
export function counterAction(counter: Counter): "deactivate" | "newCode" {
  return counter.status === "activated" ? "deactivate" : "newCode";
}

export function secondsLeft(expiresAt: string, now: Date): number {
  return Math.max(
    0,
    Math.floor((Date.parse(expiresAt) - now.getTime()) / 1000),
  );
}
