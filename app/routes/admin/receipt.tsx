import { useEffect } from "react";
import { Link, redirect, useLoaderData } from "react-router";

import { ReceiptView } from "~/components/pos/receipt/ReceiptView";
import { toCompletedBill } from "~/domain/sale";
import { t } from "~/i18n/t";
import { salesRepository } from "~/infrastructure/api/sales-repository";
import { settingsRepository } from "~/infrastructure/api/settings-repository";
import { printPage } from "~/infrastructure/print";
import { resolveAdminGuardRedirect } from "~/infrastructure/session/guards";
import { getSession } from "~/infrastructure/session/session-store";
import { STORE_TIME_ZONE } from "~/infrastructure/store-time-zone";

export async function clientLoader({ request }: { request: Request }) {
  const redirectTo = resolveAdminGuardRedirect(getSession());
  if (redirectTo) {
    throw redirect(redirectTo);
  }
  const id = new URL(request.url).searchParams.get("bill") ?? "";
  try {
    const [detail, settings] = await Promise.all([
      salesRepository.detail(id),
      settingsRepository.load(),
    ]);
    return { bill: toCompletedBill(detail, settings.taxRate), settings };
  } catch {
    return { bill: null, settings: null };
  }
}

const buttonClass =
  "flex h-12 items-center justify-center rounded-lg px-5 text-[15px] font-bold transition focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none";

// A copy of a past bill: opens the browser print dialog once, like the counter's receipt.
export default function AdminReceiptRoute() {
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
          {t().sales.receipt.notFound}
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
          to="/admin/sales"
          className={`${buttonClass} bg-blue text-white hover:brightness-95 active:brightness-90`}
        >
          {t().sales.receipt.back}
        </Link>
      </div>
    </main>
  );
}
