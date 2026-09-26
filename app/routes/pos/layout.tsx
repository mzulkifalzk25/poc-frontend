import { Outlet, redirect, useLoaderData } from "react-router";

import { CurrentBillProvider } from "~/components/pos/bill/CurrentBillProvider";
import { CashierTopBar } from "~/components/pos/CashierTopBar";
import { SyncPill } from "~/components/pos/SyncPill";
import { useCounterSync } from "~/components/pos/useCounterSync";
import { useHeartbeat } from "~/components/pos/useHeartbeat";
import { useUploadWorker } from "~/components/pos/useUploadWorker";
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
import { loadStoreSettings } from "~/infrastructure/sync/scan-deps";
import { uploadDeps } from "~/infrastructure/sync/upload-deps";

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
  const settings = await loadStoreSettings();
  return { counter, shift, storeName: settings?.storeName ?? "" };
}

export default function PosLayout() {
  const { counter, shift, storeName } = useLoaderData<typeof clientLoader>();
  useCounterSync(counterSyncDeps);
  useHeartbeat(heartbeatDeps);
  useUploadWorker(uploadDeps);

  return (
    <div className="flex min-h-screen flex-col bg-off-white">
      <CashierTopBar
        storeName={storeName}
        counterName={counter?.name ?? null}
        cashierName={shift?.cashierName ?? null}
        statusPill={<SyncPill />}
      />
      <main className="flex-1">
        <CurrentBillProvider>
          <Outlet />
        </CurrentBillProvider>
      </main>
    </div>
  );
}
