import type { ReactNode } from "react";

import { formatPaisa } from "~/domain/money";
import { t } from "~/i18n/t";

interface ReturnSummaryProps {
  refund: number;
  itemCount: number;
  detail?: string;
  children?: ReactNode;
}

export function ReturnSummary({
  refund,
  itemCount,
  detail,
  children,
}: ReturnSummaryProps) {
  const strings = t().returns;
  return (
    <aside
      aria-label={strings.summary}
      className="flex w-[440px] flex-shrink-0 flex-col gap-4 border-s border-border bg-white px-6 py-[22px]"
    >
      <h2 className="font-heading text-[22px] font-bold">{strings.summary}</h2>
      <div className="rounded-lg bg-navy px-5 py-[18px] text-white">
        <p className="text-[13px] font-semibold tracking-[0.06em] text-[#C3D0DF] uppercase">
          {strings.payBack}
        </p>
        <output
          aria-label={strings.payBack}
          className="block font-heading text-[48px] leading-[1.1] font-bold tracking-[-0.02em]"
        >
          {formatPaisa(refund)}
        </output>
        <p className="mt-1 text-[13px] text-[#C3D0DF]">
          {detail
            ? `${strings.items(itemCount)} · ${detail}`
            : strings.items(itemCount)}
        </p>
      </div>
      {children}
    </aside>
  );
}
