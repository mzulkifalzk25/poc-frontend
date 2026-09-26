import { normalizeName } from "~/domain/normalize-name";
import { isApiError } from "~/infrastructure/api/errors";
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
  | { status: "offline" };

export async function signInCashier(
  repo: CashierAuthRepository,
  typedName: string,
  pin: string,
): Promise<SignInCashierResult> {
  let roster: RosterEntry[];
  try {
    roster = await repo.fetchRoster();
  } catch (error) {
    if (error instanceof TypeError) {
      return { status: "offline" };
    }
    throw error;
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
    if (isApiError(error) && error.code === "pin_throttled") {
      return {
        status: "throttled",
        retryAfterSeconds: error.retryAfterSeconds ?? 30,
      };
    }
    if (isApiError(error) && error.code === "invalid_pin") {
      return { status: "invalid_pin" };
    }
    if (error instanceof TypeError) {
      return { status: "offline" };
    }
    throw error;
  }
}
