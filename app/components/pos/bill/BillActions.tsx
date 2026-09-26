import { t } from "~/i18n/t";

interface BillActionsProps {
  canPay: boolean;
  canHold: boolean;
  canClear: boolean;
  onPay: () => void;
  onHold?: () => void;
  onClear: () => void;
}

const secondaryClass =
  "h-12 rounded-lg border border-border-strong bg-white text-[15px] font-semibold transition hover:bg-off-white focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none active:bg-border disabled:cursor-not-allowed disabled:opacity-50";

function Key({ label }: { label: string }) {
  return (
    <kbd className="rounded-md bg-white/20 px-2 py-[3px] font-mono text-[13px] font-semibold">
      {label}
    </kbd>
  );
}

export function BillActions(props: BillActionsProps) {
  const strings = t().billing.payment;
  return (
    <div className="mt-auto flex flex-col gap-2.5">
      <button
        type="button"
        disabled={!props.canPay}
        onClick={props.onPay}
        className="flex h-[72px] items-center justify-center gap-3 rounded-lg bg-blue text-[22px] font-bold text-white transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 focus-visible:outline-none active:brightness-90 disabled:cursor-not-allowed disabled:bg-border disabled:text-text-secondary"
      >
        {strings.pay}
        <Key label="F9" />
      </button>
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          disabled={!props.canHold || !props.onHold}
          onClick={props.onHold}
          className={`${secondaryClass} text-text`}
        >
          {strings.hold} · F4
        </button>
        <button
          type="button"
          disabled={!props.canClear}
          onClick={props.onClear}
          className={`${secondaryClass} text-error-text hover:bg-error-bg`}
        >
          {strings.clear}
        </button>
      </div>
    </div>
  );
}
