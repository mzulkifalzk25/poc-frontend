import { isApiError } from "~/infrastructure/api/errors";
import { setSession } from "~/infrastructure/session/session-store";

export interface CashierLoginResult {
  access: string;
  refresh: string;
  userId: number;
  fullName: string;
}

export interface CashierAuthRepository {
  login: (login: string, password: string) => Promise<CashierLoginResult>;
}

export type SignInCashierResult =
  | { status: "success" }
  | { status: "invalid_credentials" }
  | { status: "throttled"; retryAfterSeconds: number }
  | { status: "device_revoked" }
  | { status: "offline" };

function failureOf(error: unknown): SignInCashierResult {
  if (error instanceof TypeError) {
    return { status: "offline" };
  }
  if (isApiError(error)) {
    if (error.code === "device_revoked") {
      return { status: "device_revoked" };
    }
    if (error.code === "login_throttled") {
      return {
        status: "throttled",
        retryAfterSeconds: error.retryAfterSeconds ?? 30,
      };
    }
    if (error.status === 401) {
      return { status: "invalid_credentials" };
    }
  }
  throw error;
}

// A cashier signs in exactly like the owner, over the network, but only on
// an activated counter PC: the repository sends the device token too, and
// the token that comes back is bound to this counter.
export async function signInCashier(
  repo: CashierAuthRepository,
  login: string,
  password: string,
  remember: boolean,
): Promise<SignInCashierResult> {
  try {
    const result = await repo.login(login, password);
    setSession(
      {
        role: "cashier",
        accessToken: result.access,
        refreshToken: result.refresh,
        userId: result.userId,
        fullName: result.fullName,
      },
      remember,
    );
    return { status: "success" };
  } catch (error) {
    return failureOf(error);
  }
}
