import type { ReactNode } from "react";

import { formatBillNumber } from "~/domain/bill-number";
import { formatPaisa } from "~/domain/money";
import { t } from "~/i18n/t";

interface CurrentBillPanelProps {
  billNo: string | null;
  itemCount: number;
  total: number;
  children?: ReactNode;
}

export function CurrentBillPanel({
  billNo,
  itemCount,
  total,
  children,
}: CurrentBillPanelProps) {
  const strings = t().billing;
  return (
    <aside
      aria-label={strings.currentBill}
      className="flex w-[440px] flex-shrink-0 flex-col gap-3.5 border-s border-border bg-white px-6 py-[22px]"
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-heading text-[22px] font-bold">
            {strings.currentBill}
          </h2>
          {billNo && (
            <span className="font-mono text-[13px] text-text-secondary">
              {formatBillNumber(billNo)}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1.5 rounded-lg bg-border px-3.5 py-2">
          <span className="font-mono text-[26px] font-semibold">
            {itemCount}
          </span>
          <span className="text-[13px] font-semibold text-text-secondary">
            {strings.items}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1 rounded-lg bg-navy px-5 py-[18px] text-white">
        <span className="text-[13px] font-semibold tracking-[0.06em] text-[#C3D0DF] uppercase">
          {strings.totalToPay}
        </span>
        <output
          aria-label={strings.totalToPay}
          className="font-heading text-[54px] leading-[1.05] font-bold tracking-[-0.02em]"
        >
          {formatPaisa(total)}
        </output>
      </div>
      {children}
    </aside>
  );
}
