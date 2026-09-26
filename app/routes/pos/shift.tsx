import { useState } from "react";
import { Link, useLoaderData, useNavigate, useRevalidator } from "react-router";

import { useCurrentBill } from "~/components/pos/bill/CurrentBillProvider";
import { DrawerCountCard } from "~/components/pos/shift/DrawerCountCard";
import { ShiftClosedDialog } from "~/components/pos/shift/ShiftClosedDialog";
import { ShiftSummaryCard } from "~/components/pos/shift/ShiftSummaryCard";
import { UnsyncedBanner } from "~/components/pos/shift/UnsyncedBanner";
import { formatClockTime, formatWeekdayDayMonth } from "~/domain/dates";
import { toPaisa } from "~/domain/paisa";
import { expectedCash, shiftTotals } from "~/domain/shift-totals";
import { t } from "~/i18n/t";
import { recentBillStore } from "~/infrastructure/db/recent-bill-store";
import { shiftStore } from "~/infrastructure/db/shift-store";
import { getDeviceCounter } from "~/infrastructure/session/device-store";
import type { ShiftServerResult } from "~/infrastructure/db/rows";
import { setSession } from "~/infrastructure/session/session-store";
import { STORE_TIME_ZONE } from "~/infrastructure/store-time-zone";
import { countUnsyncedSales } from "~/infrastructure/sync/heartbeat-deps";
import { closeShiftDeps } from "~/infrastructure/sync/shift-deps";
import { uploadDeps } from "~/infrastructure/sync/upload-deps";
import { closeShift } from "~/use_cases/close-shift";
import { uploadOutbox } from "~/use_cases/upload-outbox";

export async function clientLoader() {
  const counter = await getDeviceCounter();
  const shift = counter ? await shiftStore.current(counter.id) : null;
  const bills = shift ? await recentBillStore.forShift(shift.id) : [];
  // Refunds join this list with Returns (Step F6).
  const totals = shiftTotals(
    bills.map((row) => ({
      method: row.bill.payment.method,
      total: row.bill.totals.total,
    })),
    [],
  );
  const openingCash = shift ? toPaisa(shift.openingCash) : 0;
  return {
    shift,
    totals,
    openingCash,
    expected: expectedCash(openingCash, totals),
    unsynced: await countUnsyncedSales(),
  };
}

export default function ShiftRoute() {
  const data = useLoaderData<typeof clientLoader>();
  const revalidator = useRevalidator();
  const strings = t().endShift;
  const [counted, setCounted] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [closed, setClosed] = useState<{
    server: ShiftServerResult | null;
  } | null>(null);
  const { dispatch } = useCurrentBill();
  const navigate = useNavigate();

  async function handleClose() {
    if (!data.shift) {
      return;
    }
    setClosing(true);
    const result = await closeShift(closeShiftDeps, {
      shift: data.shift,
      counted,
      totals: data.totals,
      expected: data.expected,
      unsyncedCount: data.unsynced,
    });
    setClosing(false);
    if (result.status === "closed") {
      setClosed({ server: result.server });
    } else {
      setCloseError(strings.invalidCounted);
    }
  }

  function signOut() {
    dispatch({ type: "clear" });
    setSession(null);
    void navigate("/");
  }

  async function syncNow() {
    setSyncing(true);
    await uploadOutbox(uploadDeps).catch(() => 0);
    setSyncing(false);
    void revalidator.revalidate();
  }

  return (
    <div className="flex flex-col gap-5 px-[120px] py-8">
      <header className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-[34px] font-bold tracking-[-0.02em]">
            {strings.title}
          </h1>
          {data.shift && (
            <p className="text-[15px] text-text-secondary">
              {strings.subtitle(
                formatWeekdayDayMonth(data.shift.openedAt, STORE_TIME_ZONE),
                formatClockTime(data.shift.openedAt, STORE_TIME_ZONE),
              )}
            </p>
          )}
        </div>
        <Link
          to="/pos"
          className="flex h-12 items-center rounded-lg border border-border-strong bg-white px-5 text-[15px] font-semibold transition hover:bg-off-white focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none active:bg-border"
        >
          {strings.back}
        </Link>
      </header>
      {data.unsynced > 0 && (
        <UnsyncedBanner
          count={data.unsynced}
          syncing={syncing}
          onSyncNow={() => void syncNow()}
        />
      )}
      <div className="grid grid-cols-[1.2fr_1fr] gap-5">
        <ShiftSummaryCard totals={data.totals} />
        <DrawerCountCard
          openingCash={data.openingCash}
          totals={data.totals}
          expected={data.expected}
          counted={counted}
          onCounted={(text) => {
            setCounted(text);
            setCloseError(null);
          }}
          footer={
            <button
              type="button"
              disabled={closing || counted.trim() === ""}
              onClick={() => void handleClose()}
              className="flex h-16 w-full items-center justify-center rounded-lg bg-blue text-[19px] font-bold text-white transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 focus-visible:outline-none active:brightness-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {closing ? strings.closing : strings.close}
            </button>
          }
        />
      </div>
      {closeError && (
        <p
          role="alert"
          className="rounded-lg bg-error-bg px-4 py-3 font-semibold text-error-text"
        >
          {closeError}
        </p>
      )}
      {closed && (
        <ShiftClosedDialog
          counted={counted}
          expected={data.expected}
          server={closed.server}
          onSignOut={signOut}
        />
      )}
    </div>
  );
}
