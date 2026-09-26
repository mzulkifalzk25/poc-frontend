import { useState } from "react";
import { redirect, useLoaderData, useNavigate } from "react-router";

import { CashierPortalFrame } from "~/components/pos/CashierPortalFrame";
import {
  StartShiftPanel,
  type StatusLine,
} from "~/components/pos/shift/StartShiftPanel";
import {
  useFirstSync,
  type FirstSyncState,
} from "~/components/pos/useFirstSync";
import { minutesBetween } from "~/domain/elapsed";
import { t } from "~/i18n/t";
import { counterClock } from "~/infrastructure/clock";
import { catalogueStore } from "~/infrastructure/db/catalogue-store";
import { META_KEYS } from "~/infrastructure/db/meta-keys";
import { metaStore } from "~/infrastructure/db/meta-store";
import { shiftStore } from "~/infrastructure/db/shift-store";
import {
  getDeviceCounter,
  getDeviceStatus,
} from "~/infrastructure/session/device-store";
import { resolvePosGuardRedirect } from "~/infrastructure/session/guards";
import { getSession, setSession } from "~/infrastructure/session/session-store";
import { counterSyncDeps } from "~/infrastructure/sync/counter-sync-deps";
import {
  startShiftDeps,
  uploadShiftsDeps,
} from "~/infrastructure/sync/shift-deps";
import { startShift, type StartShiftResult } from "~/use_cases/start-shift";
import { isFirstSyncDone } from "~/use_cases/sync-catalogue";
import { uploadPendingShifts } from "~/use_cases/upload-shifts";

export async function clientLoader() {
  const session = getSession();
  const redirectTo = resolvePosGuardRedirect(await getDeviceStatus(), session);
  if (redirectTo || !session) {
    throw redirect(redirectTo ?? "/");
  }
  const counter = await getDeviceCounter();
  const open = counter ? await shiftStore.current(counter.id) : null;
  if (open?.cashierId === session.userId) {
    throw redirect("/pos");
  }
  return {
    cashierId: session.userId,
    cashierName: session.fullName,
    counterName: counter?.name ?? "",
    firstSyncDone: await isFirstSyncDone(metaStore),
    products: await catalogueStore.countLive(),
    lastSyncAt: await metaStore.get<string>(META_KEYS.lastSyncAt),
  };
}

type LoaderData = Awaited<ReturnType<typeof clientLoader>>;

function catalogueLine(data: LoaderData, sync: FirstSyncState): StatusLine {
  const strings = t().startShift;
  const label = strings.catalogue;
  if (data.firstSyncDone) {
    return {
      label,
      value: strings.catalogueReady(data.products),
      tone: "ready",
    };
  }
  if (sync.status === "done") {
    return {
      label,
      value: strings.catalogueReady(sync.summary.products),
      tone: "ready",
    };
  }
  if (sync.status === "failed") {
    return { label, value: strings.catalogueFailed, tone: "problem" };
  }
  const loaded = sync.progress?.phase === "products" ? sync.progress.loaded : 0;
  return { label, value: strings.catalogueDownloading(loaded), tone: "busy" };
}

function lastSyncedLine(lastSyncAt: string | null): StatusLine {
  const strings = t().startShift;
  if (!lastSyncAt) {
    return { label: strings.lastSynced, value: strings.notYet, tone: "busy" };
  }
  const minutes = minutesBetween(lastSyncAt, new Date());
  return {
    label: strings.lastSynced,
    value: minutes < 1 ? strings.justNow : strings.minutesAgo(minutes),
    tone: "busy",
  };
}

function errorText(result: StartShiftResult): string | null {
  const errors = t().startShift.errors;
  switch (result.status) {
    case "started":
    case "resumed":
      return null;
    case "other_open":
      return errors.other_open(result.cashierName);
    default:
      return errors[result.status];
  }
}

export default function PosSignInRoute() {
  const data = useLoaderData<typeof clientLoader>();
  const navigate = useNavigate();
  const firstSync = useFirstSync(counterSyncDeps, !data.firstSyncDone);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const synced = data.firstSyncDone || firstSync.state.status === "done";

  async function handleStart(openingCash: string) {
    setPending(true);
    const result = await startShift(startShiftDeps, {
      cashierId: data.cashierId,
      cashierName: data.cashierName,
      openingCash,
    });
    setPending(false);
    setError(errorText(result));
    if (result.status === "started" || result.status === "resumed") {
      uploadPendingShifts(uploadShiftsDeps).catch(() => undefined);
      void navigate("/pos");
    }
  }

  return (
    <CashierPortalFrame>
      <StartShiftPanel
        heading={t().startShift.who(data.cashierName, data.counterName)}
        statusLines={[
          catalogueLine(data, firstSync.state),
          lastSyncedLine(
            firstSync.state.status === "done"
              ? counterClock.now().toISOString()
              : data.lastSyncAt,
          ),
          {
            label: t().startShift.scanner,
            value: t().startShift.scannerValue,
            tone: "busy",
          },
        ]}
        canStart={synced}
        pending={pending}
        error={error}
        onStart={(cash) => void handleStart(cash)}
        onSignOut={() => {
          setSession(null);
          void navigate("/");
        }}
        onRetrySync={
          !data.firstSyncDone && firstSync.state.status === "failed"
            ? firstSync.retry
            : undefined
        }
      />
    </CashierPortalFrame>
  );
}
