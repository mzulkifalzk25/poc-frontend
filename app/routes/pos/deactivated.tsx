import { useState } from "react";
import { redirect, useLoaderData, useNavigate } from "react-router";

import { Logo } from "~/components/ui/Logo";
import { t } from "~/i18n/t";
import {
  clearDeviceMeta,
  getDeviceCounter,
  getDeviceStatus,
} from "~/infrastructure/session/device-store";
import { resolveDeactivatedGuardRedirect } from "~/infrastructure/session/guards";

export async function clientLoader() {
  const redirectTo = resolveDeactivatedGuardRedirect(await getDeviceStatus());
  if (redirectTo) {
    throw redirect(redirectTo);
  }
  return { counter: await getDeviceCounter() };
}

const warningIcon = (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M5.6 5.6l12.8 12.8" />
  </svg>
);

export default function DeactivatedRoute() {
  const { counter } = useLoaderData<typeof clientLoader>();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const strings = t().deactivated;

  async function handleReactivate() {
    setPending(true);
    await clearDeviceMeta();
    void navigate("/pos/activate", { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#C9D3E0] via-[#E4E9F0] to-[#B8C4D4] p-6">
      <main className="flex w-[592px] flex-col items-center gap-5 rounded-xl bg-off-white px-11 py-10 text-center shadow-2xl">
        <div className="flex items-center gap-3">
          <Logo variant="navy" size={44} />
          <span className="font-heading text-3xl font-bold">
            Mart<span className="text-gold">Desk</span>
          </span>
        </div>
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-error-bg text-error">
          {warningIcon}
        </span>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {strings.title}
        </h1>
        <div className="flex flex-col gap-2 text-[15px] leading-normal text-text-secondary">
          <p>{strings.body}</p>
          {counter && (
            <p className="font-semibold text-text">
              {strings.counterLine(counter.name, counter.code)}
            </p>
          )}
          <p>{strings.unsyncedNote}</p>
        </div>
        <p className="w-full rounded-input bg-warning-bg px-3.5 py-2.5 text-sm text-warning">
          {strings.nextStep}
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            void handleReactivate();
          }}
          className="flex h-[50px] w-full items-center justify-center rounded-input bg-blue text-base font-semibold text-white transition hover:brightness-[.92] focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 focus-visible:outline-none active:brightness-[.85] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {strings.reactivate}
        </button>
      </main>
    </div>
  );
}
