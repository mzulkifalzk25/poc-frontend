import { formatPaisa } from "~/domain/money";
import type { ShiftTotals } from "~/domain/shift-totals";
import { t } from "~/i18n/t";

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-off-white px-4 py-3.5">
      <p className="text-[13px] text-text-secondary">{label}</p>
      <p className="font-heading text-[30px] font-bold">{value}</p>
    </div>
  );
}

function Line({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <p
      className={`flex h-[52px] items-center justify-between border-b border-border text-base last:border-b-0 ${warning ? "text-warning" : ""}`}
    >
      <span>{label}</span>
      <span className="font-mono font-semibold">{value}</span>
    </p>
  );
}

export function ShiftSummaryCard({ totals }: { totals: ShiftTotals }) {
  const strings = t().endShift;
  return (
    <section
      aria-label={strings.yourShift}
      className="flex flex-col gap-4 rounded-[18px] border border-border bg-white p-6"
    >
      <h2 className="font-heading text-xl font-bold">{strings.yourShift}</h2>
      <div className="grid grid-cols-2 gap-3">
        <Tile
          label={strings.bills}
          value={totals.bills.toLocaleString("en-US")}
        />
        <Tile
          label={strings.totalSales}
          value={formatPaisa(totals.totalSales)}
        />
      </div>
      <div className="flex flex-col">
        <Line label={strings.cash} value={formatPaisa(totals.byMethod.cash)} />
        <Line label={strings.card} value={formatPaisa(totals.byMethod.card)} />
        <Line
          label={strings.wallet}
          value={formatPaisa(totals.byMethod.wallet)}
        />
        <Line
          label={strings.refunds(totals.refundCount)}
          value={`− ${formatPaisa(totals.refundAmount)}`}
          warning
        />
      </div>
    </section>
  );
}
