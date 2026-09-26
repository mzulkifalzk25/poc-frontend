import { normalizeName } from "~/domain/normalize-name";
import { DEVICE_REVOKED, isApiError } from "~/infrastructure/api/errors";
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

export type SignInCashierResult =
  | { status: "success" }
  | { status: "name_not_found" }
  | { status: "invalid_pin" }
  | { status: "throttled"; retryAfterSeconds: number }
  | { status: "device_revoked" }
  | { status: "offline" };

function toFailure(error: unknown): SignInCashierResult {
  if (error instanceof TypeError) {
    return { status: "offline" };
  }
  if (!isApiError(error)) {
    throw error;
  }
  if (error.code === DEVICE_REVOKED) {
    return { status: "device_revoked" };
  }
  if (error.code === "pin_throttled") {
    return {
      status: "throttled",
      retryAfterSeconds: error.retryAfterSeconds ?? 30,
    };
  }
  if (error.code === "invalid_pin") {
    return { status: "invalid_pin" };
  }
  throw error;
}

export async function signInCashier(
  repo: CashierAuthRepository,
  typedName: string,
  pin: string,
): Promise<SignInCashierResult> {
  let roster: RosterEntry[];
  try {
    roster = await repo.fetchRoster();
  } catch (error) {
    return toFailure(error);
  }

  const normalized = normalizeName(typedName);
  const match = roster.find(
    (entry) => normalizeName(entry.fullName) === normalized,
  );
  if (!match) {
    return { status: "name_not_found" };
  }

  try {
    const result = await repo.pinLogin(match.id, pin);
    setSession(
      {
        role: "cashier",
        accessToken: result.access,
        refreshToken: result.refresh,
        userId: match.id,
        fullName: result.fullName,
      },
      false,
    );
    return { status: "success" };
  } catch (error) {
    return toFailure(error);
  }
}
