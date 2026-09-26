import { useEffect } from "react";
import { Link, redirect, useLoaderData } from "react-router";

import { ReceiptView } from "~/components/pos/receipt/ReceiptView";
import { t } from "~/i18n/t";
import { recentBillStore } from "~/infrastructure/db/recent-bill-store";
import { printPage } from "~/infrastructure/print";
import { getDeviceStatus } from "~/infrastructure/session/device-store";
import { resolvePosGuardRedirect } from "~/infrastructure/session/guards";
import { getSession } from "~/infrastructure/session/session-store";
import { STORE_TIME_ZONE } from "~/infrastructure/store-time-zone";
import { loadStoreSettings } from "~/infrastructure/sync/scan-deps";

export async function clientLoader({ request }: { request: Request }) {
  const redirectTo = resolvePosGuardRedirect(
    await getDeviceStatus(),
    getSession(),
  );
  if (redirectTo) {
    throw redirect(redirectTo);
  }
  const id = new URL(request.url).searchParams.get("bill") ?? "";
  const row = await recentBillStore.get(id);
  return { bill: row?.bill ?? null, settings: await loadStoreSettings() };
}

const buttonClass =
  "flex h-12 items-center justify-center rounded-lg px-5 text-[15px] font-bold transition focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none";

// Opens the browser print dialog once; the buttons are hidden on paper.
export default function ReceiptRoute() {
  const { bill, settings } = useLoaderData<typeof clientLoader>();
  const strings = t().receipt;

  useEffect(() => {
    if (bill) {
      printPage();
    }
  }, [bill]);

  return (
    <main className="receipt-page flex min-h-screen flex-col items-center gap-6 bg-off-white px-4 py-10">
      {bill ? (
        <div className="shadow-[0_10px_30px_rgba(15,39,66,0.18)] print:shadow-none">
          <ReceiptView
            bill={bill}
            settings={settings}
            timeZone={STORE_TIME_ZONE}
          />
        </div>
      ) : (
        <p
          role="alert"
          className="rounded-lg bg-error-bg px-4 py-3 font-semibold text-error-text"
        >
          {strings.notFound}
        </p>
      )}
      <div className="no-print flex gap-3">
        {bill && (
          <button
            type="button"
            className={`${buttonClass} border-[1.5px] border-navy bg-white text-text hover:bg-off-white`}
            onClick={() => {
              printPage();
            }}
          >
            {strings.printAgain}
          </button>
        )}
        <Link
          to="/pos"
          className={`${buttonClass} bg-blue text-white hover:brightness-95 active:brightness-90`}
        >
          {strings.back}
        </Link>
      </div>
    </main>
  );
}
