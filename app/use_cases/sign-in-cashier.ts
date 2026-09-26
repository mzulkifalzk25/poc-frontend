import { normalizeName } from "~/domain/normalize-name";
import {
  afterFailure,
  applyUnlock,
  NO_DELAY,
  secondsRemaining,
  serverDelay,
  type PinDelayState,
} from "~/domain/pin-delay";
import { DEVICE_REVOKED, isApiError } from "~/infrastructure/api/errors";
import type { AuditEventUpload } from "~/infrastructure/db/rows";
import { setSession } from "~/infrastructure/session/session-store";

export interface RosterEntry {
  id: number;
  fullName: string;
}

export interface CashierPinLoginResult {
  access: string;
  refresh: string;
  fullName: string;
}

export interface CashierAuthRepository {
  fetchRoster: () => Promise<RosterEntry[]>;
  pinLogin: (userId: number, pin: string) => Promise<CashierPinLoginResult>;
}

export interface LocalCashier extends RosterEntry {
  pinVerifier: string | null;
  unlockedAt: string | null;
}

export interface CashierSignInDeps {
  repo: CashierAuthRepository;
  localRoster: {
    findByName: (typed: string) => Promise<LocalCashier | null>;
    count: () => Promise<number>;
  };
  verifyPin: (pin: string, verifier: string) => Promise<boolean>;
  delays: {
    get: (userId: number) => Promise<PinDelayState>;
    set: (userId: number, state: PinDelayState) => Promise<void>;
  };
  queueAudit: (event: AuditEventUpload) => Promise<void>;
  now: () => Date;
  newId: () => string;
}

export type SignInCashierResult =
  | { status: "success"; offline: boolean }
  | { status: "name_not_found" }
  | { status: "invalid_pin" }
  | { status: "throttled"; retryAfterSeconds: number }
  | { status: "device_revoked" }
  | { status: "offline" };

type Resolved = { cashier: LocalCashier } | { failure: SignInCashierResult };

function failureOf(error: unknown): SignInCashierResult {
  if (error instanceof TypeError) {
    return { status: "offline" };
  }
  if (isApiError(error) && error.code === DEVICE_REVOKED) {
    return { status: "device_revoked" };
  }
  throw error;
}

// The Dexie roster works offline; the server roster is only a fallback before the first sync.
async function resolveCashier(
  deps: CashierSignInDeps,
  typed: string,
): Promise<Resolved> {
  const local = await deps.localRoster.findByName(typed);
  if (local) {
    return { cashier: local };
  }
  if ((await deps.localRoster.count()) > 0) {
    return { failure: { status: "name_not_found" } };
  }
  try {
    const roster = await deps.repo.fetchRoster();
    const match = roster.find(
      (entry) => normalizeName(entry.fullName) === normalizeName(typed),
    );
    return match
      ? { cashier: { ...match, pinVerifier: null, unlockedAt: null } }
      : { failure: { status: "name_not_found" } };
  } catch (error) {
    return { failure: failureOf(error) };
  }
}

function startSession(
  cashier: RosterEntry,
  tokens: { access: string; refresh: string } | null,
) {
  setSession({
    role: "cashier",
    accessToken: tokens?.access ?? "",
    refreshToken: tokens?.refresh ?? "",
    userId: cashier.id,
    fullName: cashier.fullName,
    offline: tokens === null,
  });
}

async function recordFailure(
  deps: CashierSignInDeps,
  cashier: LocalCashier,
  state: PinDelayState,
  queue: boolean,
): Promise<SignInCashierResult> {
  const now = deps.now();
  const next = afterFailure(state, now);
  await deps.delays.set(cashier.id, next);
  const wait = secondsRemaining(next, now);
  if (queue) {
    await deps.queueAudit({
      id: deps.newId(),
      action: "pin_failure",
      occurred_at: now.toISOString(),
      entity_type: "user",
      entity_id: String(cashier.id),
      detail: { fail_count: next.failCount, retry_after: wait, offline: true },
    });
  }
  return wait > 0
    ? { status: "throttled", retryAfterSeconds: wait }
    : { status: "invalid_pin" };
}

async function signInOffline(
  deps: CashierSignInDeps,
  cashier: LocalCashier,
  pin: string,
  state: PinDelayState,
): Promise<SignInCashierResult> {
  if (!cashier.pinVerifier) {
    return { status: "offline" };
  }
  if (!(await deps.verifyPin(pin, cashier.pinVerifier))) {
    return recordFailure(deps, cashier, state, true);
  }
  await deps.delays.set(cashier.id, NO_DELAY);
  startSession(cashier, null);
  return { status: "success", offline: true };
}

async function onServerRefusal(
  deps: CashierSignInDeps,
  cashier: LocalCashier,
  state: PinDelayState,
  error: unknown,
): Promise<SignInCashierResult> {
  if (
    !isApiError(error) ||
    !["invalid_pin", "pin_throttled"].includes(error.code)
  ) {
    return failureOf(error);
  }
  // Contract v4.1: a wrong PIN that starts a delay carries retry_after too.
  const wait =
    error.retryAfterSeconds ?? (error.code === "pin_throttled" ? 30 : 0);
  if (wait <= 0) {
    return recordFailure(deps, cashier, state, false);
  }
  await deps.delays.set(cashier.id, serverDelay(state, wait, deps.now()));
  return { status: "throttled", retryAfterSeconds: wait };
}

export async function signInCashier(
  deps: CashierSignInDeps,
  typedName: string,
  pin: string,
): Promise<SignInCashierResult> {
  const resolved = await resolveCashier(deps, typedName);
  if ("failure" in resolved) {
    return resolved.failure;
  }
  const { cashier } = resolved;
  const state = applyUnlock(
    await deps.delays.get(cashier.id),
    cashier.unlockedAt,
  );
  const wait = secondsRemaining(state, deps.now());
  if (wait > 0) {
    return { status: "throttled", retryAfterSeconds: wait };
  }
  try {
    const tokens = await deps.repo.pinLogin(cashier.id, pin);
    await deps.delays.set(cashier.id, NO_DELAY);
    startSession({ id: cashier.id, fullName: tokens.fullName }, tokens);
    return { status: "success", offline: false };
  } catch (error) {
    if (error instanceof TypeError) {
      return signInOffline(deps, cashier, pin, state);
    }
    return onServerRefusal(deps, cashier, state, error);
  }
}
