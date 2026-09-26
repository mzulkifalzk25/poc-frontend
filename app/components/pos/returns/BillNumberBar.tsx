import { formatBillNumber } from "~/domain/bill-number";
import { t } from "~/i18n/t";
import type { BillLookup } from "~/use_cases/lookup-bill";

export type LookupState = BillLookup | { status: "looking" };

interface BillNumberBarProps {
  value: string;
  lookup: LookupState;
  onChange: (value: string) => void;
  onLookup: () => void;
}

function hint(lookup: LookupState): { text: string; warn: boolean } {
  const strings = t().returns.billHints;
  switch (lookup.status) {
    case "empty":
      return { text: strings.empty, warn: false };
    case "looking":
      return { text: strings.looking, warn: false };
    case "found":
      return { text: strings.found, warn: false };
    case "invalid":
      return { text: strings.invalid, warn: true };
    case "not_found":
      return {
        text: strings.notFound(formatBillNumber(lookup.billNo)),
        warn: true,
      };
    case "unavailable":
      return {
        text: strings.unavailable(formatBillNumber(lookup.billNo)),
        warn: true,
      };
  }
}

// A receipt barcode can be scanned straight into this field (the scanner presses Enter).
export function BillNumberBar({
  value,
  lookup,
  onChange,
  onLookup,
}: BillNumberBarProps) {
  const strings = t().returns;
  const note = hint(lookup);
  return (
    <div className="flex h-14 flex-shrink-0 items-center gap-3.5 rounded-card border border-border bg-white px-4">
      <label
        htmlFor="return-bill-no"
        className="text-sm font-semibold whitespace-nowrap"
      >
        {strings.billLabel}{" "}
        <span className="font-medium text-text-secondary">
          {strings.billOptional}
        </span>
      </label>
      <input
        id="return-bill-no"
        autoComplete="off"
        value={value}
        placeholder={strings.billPlaceholder}
        aria-describedby="return-bill-hint"
        className="h-[38px] w-[200px] rounded-lg border-[1.5px] border-border-strong px-3 font-mono text-base font-semibold text-text outline-none focus:border-blue focus:ring-2 focus:ring-blue"
        onChange={(event) => {
          onChange(event.target.value);
        }}
        onBlur={onLookup}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onLookup();
          }
        }}
      />
      <p
        id="return-bill-hint"
        role="status"
        className={`text-[13px] leading-snug ${note.warn ? "font-semibold text-warning" : "text-text-secondary"}`}
      >
        {note.text}
      </p>
    </div>
  );
}
