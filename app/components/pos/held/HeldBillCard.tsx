import type { ReactNode } from "react";

import { formatClockTime } from "~/domain/dates";
import { minutesBetween } from "~/domain/elapsed";
import { formatMoney } from "~/domain/money";
import { t } from "~/i18n/t";
import type { HeldBillRow } from "~/infrastructure/db/rows";

const TAG_TINTS = [
  "bg-category-dairy-bg text-category-dairy-ink",
  "bg-category-bakery-bg text-category-bakery-ink",
  "bg-category-grocery-bg text-category-grocery-ink",
  "bg-category-snacks-bg text-category-snacks-ink",
];
const PREVIEW_NAMES = 3;

interface HeldBillCardProps {
  bill: HeldBillRow;
  index: number;
  now: Date;
  timeZone: string;
  onRecall: () => void;
  deleteButton?: ReactNode;
}

function heldMeta(bill: HeldBillRow, now: Date, timeZone: string): string {
  const strings = t().held;
  const minutes = minutesBetween(bill.heldAt, now);
  const ago = minutes < 1 ? strings.justNow : strings.minutesAgo(minutes);
  return strings.meta(
    bill.itemCount,
    formatClockTime(bill.heldAt, timeZone),
    ago,
  );
}

export function HeldBillCard({
  bill,
  index,
  now,
  timeZone,
  onRecall,
  deleteButton,
}: HeldBillCardProps) {
  const strings = t().held;
  const names = bill.lines.map((line) => line.name);
  const title = bill.title || strings.untitled;
  return (
    <article
      aria-label={`${strings.tag(index)} ${title}`}
      className="flex items-center gap-[18px] rounded-lg border-[1.5px] border-border px-5 py-[18px]"
    >
      <span
        aria-hidden="true"
        className={`flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-card font-mono text-[15px] font-semibold ${TAG_TINTS[index % TAG_TINTS.length] ?? ""}`}
      >
        {strings.tag(index)}
      </span>
      <div className="flex min-w-0 flex-grow flex-col gap-1">
        <h3 className="text-[17px] font-bold">{title}</h3>
        <p className="text-[13px] text-text-secondary">
          {heldMeta(bill, now, timeZone)}
        </p>
        <p className="truncate text-[13px] text-ink-soft">
          {strings.preview(
            names.slice(0, PREVIEW_NAMES),
            Math.max(0, names.length - PREVIEW_NAMES),
          )}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2.5">
        <span className="font-heading text-2xl font-bold">
          {formatMoney(bill.total)}
        </span>
        <div className="flex gap-2">
          {deleteButton}
          <button
            type="button"
            onClick={onRecall}
            className="flex h-12 items-center rounded-lg bg-blue px-[22px] text-base font-bold text-white transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 focus-visible:outline-none active:brightness-90"
          >
            {strings.recall}
          </button>
        </div>
      </div>
    </article>
  );
}
