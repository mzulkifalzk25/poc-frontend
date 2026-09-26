import type { ReactNode } from "react";

import { receivedPaisa } from "~/components/pos/bill/received";
import { formatPaisa } from "~/domain/money";
import {
  checkDrawer,
  type DrawerCheck,
  type ShiftTotals,
} from "~/domain/shift-totals";
import { t } from "~/i18n/t";

interface DrawerCountCardProps {
  openingCash: number;
  totals: ShiftTotals;
  expected: number;
  counted: string;
  onCounted: (text: string) => void;
  footer: ReactNode;
}

function Row({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <p
      className={`flex justify-between ${strong ? "border-t border-border pt-2 font-semibold" : ""}`}
    >
      <span className={strong ? "" : "text-text-secondary"}>{label}</span>
      <span className="font-mono font-semibold">{value}</span>
    </p>
  );
}

function differenceText(check: DrawerCheck): string {
  const strings = t().endShift;
  const amount = formatPaisa(check.difference);
  if (check.status === "balanced") {
    return strings.balanced(amount);
  }
  return check.status === "over" ? strings.over(amount) : strings.short(amount);
}

export function DrawerCountCard({
  openingCash,
  totals,
  expected,
  counted,
  onCounted,
  footer,
}: DrawerCountCardProps) {
  const strings = t().endShift;
  const countedPaisa = receivedPaisa(counted);
  const check =
    countedPaisa === null ? null : checkDrawer(countedPaisa, expected);
  return (
    <section
      aria-label={strings.countDrawer}
      className="flex flex-col gap-4 rounded-[18px] border border-border bg-white p-6"
    >
      <h2 className="font-heading text-xl font-bold">{strings.countDrawer}</h2>
      <div className="flex flex-col gap-2 text-[15px]">
        <Row label={strings.openingCash} value={formatPaisa(openingCash)} />
        <Row
          label={strings.cashSales}
          value={formatPaisa(totals.byMethod.cash)}
        />
        <Row
          label={strings.cashRefunds(totals.cashRefundCount)}
          value={`− ${formatPaisa(totals.cashRefunds)}`}
        />
        <Row label={strings.expected} value={formatPaisa(expected)} strong />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="counted-cash" className="text-sm font-semibold">
          {strings.counted}
        </label>
        <div className="flex h-16 items-center gap-2.5 rounded-lg border-2 border-blue bg-white px-4 focus-within:ring-2 focus-within:ring-blue focus-within:ring-offset-2">
          <span
            aria-hidden="true"
            className="font-mono font-semibold text-text-secondary"
          >
            Rs
          </span>
          <input
            id="counted-cash"
            inputMode="decimal"
            autoComplete="off"
            value={counted}
            className="min-w-0 flex-grow bg-transparent font-mono text-[26px] font-semibold outline-none"
            onChange={(event) => {
              onCounted(event.target.value);
            }}
          />
        </div>
      </div>
      {check && (
        <p
          role="status"
          className={`flex items-center justify-between rounded-lg px-4 py-3.5 font-semibold ${check.status === "balanced" ? "bg-[#E1ECF6] text-blue" : "bg-warning-bg text-warning"}`}
        >
          <span>{strings.difference}</span>
          <span className="font-mono text-[22px]">{differenceText(check)}</span>
        </p>
      )}
      <div className="mt-auto">{footer}</div>
    </section>
  );
}
