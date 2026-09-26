import { Outlet, redirect, useLoaderData, useMatches } from "react-router";

import { CashierTopBar } from "~/components/pos/CashierTopBar";
import { useCounterSync } from "~/components/pos/useCounterSync";
import { useHeartbeat } from "~/components/pos/useHeartbeat";
import { counterClock } from "~/infrastructure/clock";
import {
  getDeviceCounter,
  getDeviceStatus,
} from "~/infrastructure/session/device-store";
import { shiftStore } from "~/infrastructure/db/shift-store";
import {
  resolvePosGuardRedirect,
  resolveShiftRedirect,
} from "~/infrastructure/session/guards";
import { getSession } from "~/infrastructure/session/session-store";
import { counterSyncDeps } from "~/infrastructure/sync/counter-sync-deps";
import { heartbeatDeps } from "~/infrastructure/sync/heartbeat-deps";

export async function clientLoader() {
  const redirectTo = resolvePosGuardRedirect(
    await getDeviceStatus(),
    getSession(),
  );
  if (redirectTo) {
    throw redirect(redirectTo);
  }
  const counter = await getDeviceCounter();
  const shift = counter ? await shiftStore.current(counter.id) : null;
  const shiftRedirect = resolveShiftRedirect(
    shift?.cashierId ?? null,
    getSession(),
  );
  if (shiftRedirect) {
    throw redirect(shiftRedirect);
  }
  await counterClock.load();
  return { counter, shift };
}

interface RouteHandle {
  title?: string;
}

export default function PosLayout() {
  const { counter } = useLoaderData<typeof clientLoader>();
  const matches = useMatches();
  const handle = matches.at(-1)?.handle as RouteHandle | undefined;
  useCounterSync(counterSyncDeps);
  useHeartbeat(heartbeatDeps);

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
