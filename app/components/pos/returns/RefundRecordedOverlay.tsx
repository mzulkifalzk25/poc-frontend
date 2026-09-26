import { Link } from "react-router";

import { formatPaisa } from "~/domain/money";
import { drawerEffect, type CompletedReturn } from "~/domain/return";
import { t } from "~/i18n/t";

interface RefundRecordedOverlayProps {
  ret: CompletedReturn;
  onNewReturn: () => void;
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex justify-between">
      <span>{label}</span>
      <span className="font-mono font-semibold">{value}</span>
    </p>
  );
}

export function RefundRecordedOverlay({
  ret,
  onNewReturn,
}: RefundRecordedOverlayProps) {
  const strings = t().returns;
  const drawer = drawerEffect(ret.method, ret.refund);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="refund-recorded"
        className="flex w-[440px] max-w-full flex-col gap-[18px] rounded-[20px] bg-white p-7 text-text shadow-[0_24px_60px_rgba(15,39,66,0.35)]"
      >
        <div className="flex flex-col items-center gap-2.5 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-bg">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#20A86B"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12l5 5 9-10" />
            </svg>
          </span>
          <h2
            id="refund-recorded"
            className="font-heading text-[26px] font-bold"
          >
            {strings.recorded}
          </h2>
          <p className="text-[15px] text-text-secondary">
            {strings.recordedSummary(
              formatPaisa(ret.refund),
              strings.methods[ret.method],
            )}
          </p>
        </div>
        <div className="flex flex-col gap-2 rounded-lg bg-off-white px-4 py-3.5 text-sm text-ink-soft">
          <Line label={strings.itemsReturned} value={String(ret.itemCount)} />
          <Line
            label={strings.stock}
            value={
              ret.restock ? strings.stockBack(ret.itemCount) : strings.stockNot
            }
          />
          <Line
            label={strings.drawer}
            value={
              drawer === 0
                ? strings.drawerNone
                : strings.drawerOut(formatPaisa(-drawer))
            }
          />
        </div>
        <p className="text-center text-[13px] text-text-secondary">
          {strings.saved}
        </p>
        <div className="flex gap-2.5">
          <Link
            to="/pos"
            className="flex h-[52px] flex-grow items-center justify-center rounded-lg border-[1.5px] border-navy bg-white text-base font-bold transition hover:bg-off-white focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none active:bg-border"
          >
            {strings.backToBilling}
          </Link>
          <button
            type="button"
            autoFocus
            onClick={onNewReturn}
            className="h-[52px] flex-grow rounded-lg bg-blue text-base font-bold text-white transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 focus-visible:outline-none active:brightness-90"
          >
            {strings.newReturn}
          </button>
        </div>
      </section>
    </div>
  );
}
