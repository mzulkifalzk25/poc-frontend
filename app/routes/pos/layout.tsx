import { Outlet, redirect, useLoaderData, useMatches } from "react-router";

import { CashierTopBar } from "~/components/pos/CashierTopBar";
import {
  getDeviceCounter,
  getDeviceStatus,
} from "~/infrastructure/session/device-store";
import { resolvePosGuardRedirect } from "~/infrastructure/session/guards";
import { getSession } from "~/infrastructure/session/session-store";

export async function clientLoader() {
  const redirectTo = resolvePosGuardRedirect(
    await getDeviceStatus(),
    getSession(),
  );
  if (redirectTo) {
    throw redirect(redirectTo);
  }
  return { counter: await getDeviceCounter() };
}

interface RouteHandle {
  title?: string;
}

export default function PosLayout() {
  const { counter } = useLoaderData<typeof clientLoader>();
  const matches = useMatches();
  const handle = matches.at(-1)?.handle as RouteHandle | undefined;

  return (
    <div className="flex min-h-screen flex-col bg-off-white">
      <CashierTopBar
        title={handle?.title ?? "MartDesk"}
        counterName={counter?.name ?? null}
      />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
