import { Outlet, redirect, useMatches } from "react-router";

import { CashierTopBar } from "~/components/pos/CashierTopBar";
import { hasActivatedDevice } from "~/infrastructure/session/device-store";
import { resolvePosGuardRedirect } from "~/infrastructure/session/guards";
import { getSession } from "~/infrastructure/session/session-store";

export async function clientLoader() {
  const activated = await hasActivatedDevice();
  const redirectTo = resolvePosGuardRedirect(activated, getSession());
  if (redirectTo) {
    throw redirect(redirectTo);
  }
  return null;
}

interface RouteHandle {
  title?: string;
}

export default function PosLayout() {
  const matches = useMatches();
  const handle = matches.at(-1)?.handle as RouteHandle | undefined;

  return (
    <div className="flex min-h-screen flex-col bg-off-white">
      <CashierTopBar title={handle?.title ?? "MartDesk"} />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
