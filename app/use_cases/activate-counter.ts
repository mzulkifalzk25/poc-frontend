import { isApiError } from "~/infrastructure/api/errors";
import type {
  DeviceCounter,
  DeviceMeta,
} from "~/infrastructure/session/device-store";

export interface ActivationResult {
  deviceToken: string;
  counter: DeviceCounter;
}

export interface ActivationRepository {
  activate: (code: string) => Promise<ActivationResult>;
  countCashiers: () => Promise<number>;
}

export interface ActivateCounterDeps {
  repo: ActivationRepository;
  saveDevice: (meta: DeviceMeta) => Promise<void>;
  now: () => Date;
}

export type ActivateCounterOutcome =
  | { status: "success"; counter: DeviceCounter; cashierCount: number | null }
  | { status: "code_invalid" }
  | { status: "code_expired" }
  | { status: "code_used" }
  | { status: "rate_limited"; retryAfterSeconds: number | null }
  | { status: "offline" };

const ERROR_OUTCOMES: Partial<Record<string, ActivateCounterOutcome>> = {
  code_invalid: { status: "code_invalid" },
  code_expired: { status: "code_expired" },
  code_used: { status: "code_used" },
};

function toFailure(error: unknown): ActivateCounterOutcome {
  if (error instanceof TypeError) {
    return { status: "offline" };
  }
  if (isApiError(error) && error.status === 429) {
    return {
      status: "rate_limited",
      retryAfterSeconds: error.retryAfterSeconds ?? null,
    };
  }
  const outcome = isApiError(error) ? ERROR_OUTCOMES[error.code] : undefined;
  if (outcome) {
    return outcome;
  }
  throw error;
}

async function countCashiersSafely(
  repo: ActivationRepository,
): Promise<number | null> {
  try {
    return await repo.countCashiers();
  } catch {
    return null;
  }
}

export async function activateCounter(
  deps: ActivateCounterDeps,
  code: string,
): Promise<ActivateCounterOutcome> {
  let result: ActivationResult;
  try {
    result = await deps.repo.activate(code);
  } catch (error) {
    return toFailure(error);
  }
  await deps.saveDevice({
    token: result.deviceToken,
    counter: result.counter,
    activatedAt: deps.now().toISOString(),
    revokedAt: null,
  });
  const cashierCount = await countCashiersSafely(deps.repo);
  return { status: "success", counter: result.counter, cashierCount };
}
