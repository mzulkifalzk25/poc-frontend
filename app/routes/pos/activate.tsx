import { useState } from "react";
import { redirect } from "react-router";

import { CashierPortalFrame } from "~/components/pos/CashierPortalFrame";
import { ActivateForm } from "~/components/pos/activate/ActivateForm";
import { ActivateHelp } from "~/components/pos/activate/ActivateHelp";
import { ActivateSuccess } from "~/components/pos/activate/ActivateSuccess";
import { t } from "~/i18n/t";
import { activationRepository } from "~/infrastructure/api/activation-repository";
import {
  getDeviceStatus,
  saveDeviceMeta,
  type DeviceCounter,
} from "~/infrastructure/session/device-store";
import { resolveActivateGuardRedirect } from "~/infrastructure/session/guards";
import {
  activateCounter,
  type ActivateCounterOutcome,
} from "~/use_cases/activate-counter";

export async function clientLoader() {
  const redirectTo = resolveActivateGuardRedirect(await getDeviceStatus());
  if (redirectTo) {
    throw redirect(redirectTo);
  }
  return null;
}

interface Activated {
  counter: DeviceCounter;
  cashierCount: number | null;
}

function errorMessage(outcome: ActivateCounterOutcome): string | null {
  const errors = t().activate.errors;
  switch (outcome.status) {
    case "success":
      return null;
    case "rate_limited":
      return errors.rateLimitedWait(outcome.retryAfterSeconds ?? 60);
    default:
      return errors[outcome.status];
  }
}

export default function ActivateRoute() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activated, setActivated] = useState<Activated | null>(null);

  async function handleSubmit(code: string) {
    setPending(true);
    setError(null);
    const outcome = await activateCounter(
      {
        repo: activationRepository,
        saveDevice: saveDeviceMeta,
        now: () => new Date(),
      },
      code,
    );
    setPending(false);
    if (outcome.status === "success") {
      setActivated(outcome);
    } else {
      setError(errorMessage(outcome));
    }
  }

  return (
    <CashierPortalFrame>
      <div className="flex min-h-[560px] w-[960px] overflow-hidden rounded-xl bg-white text-text shadow-[0_30px_80px_rgba(0,0,0,0.4)]">
        <div className="flex w-[520px] flex-col p-10">
          {activated ? (
            <ActivateSuccess
              counter={activated.counter}
              cashierCount={activated.cashierCount}
            />
          ) : (
            <ActivateForm
              pending={pending}
              error={error}
              onSubmit={(code) => {
                void handleSubmit(code);
              }}
            />
          )}
        </div>
        <ActivateHelp />
      </div>
    </CashierPortalFrame>
  );
}
