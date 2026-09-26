import { formatAmount, formatPaisa } from "~/domain/money";
import { checkCash, type PaymentMethod } from "~/domain/payment";
import { t } from "~/i18n/t";

import { receivedPaisa } from "./received";

const METHODS: PaymentMethod[] = ["cash", "card", "wallet"];
const NOTE_CHIPS = [100_000, 500_000, 1_000_000];

interface PaymentSectionProps {
  method: PaymentMethod;
  received: string;
  total: number;
  onMethod: (method: PaymentMethod) => void;
  onReceived: (text: string) => void;
}

function choiceClass(selected: boolean): string {
  return `rounded-lg border-[1.5px] font-bold transition focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none ${
    selected
      ? "border-navy bg-navy text-white"
      : "border-border-strong bg-white text-navy hover:bg-off-white active:bg-border"
  }`;
}

function CashPanel({
  received,
  total,
  onReceived,
}: Pick<PaymentSectionProps, "received" | "total" | "onReceived">) {
  const strings = t().billing.payment;
  const paisa = receivedPaisa(received);
  const check = paisa === null ? null : checkCash(total, paisa);
  const chips = [
    { label: strings.exact, value: total },
    ...NOTE_CHIPS.map((value) => ({ label: formatAmount(value / 100), value })),
  ];
  return (
    <div className="flex flex-col gap-2.5">
      <div
        role="group"
        aria-label={strings.quickCash}
        className="grid grid-cols-4 gap-2"
      >
        {chips.map((chip) => (
          <button
            key={chip.label}
            type="button"
            aria-pressed={paisa === chip.value}
            className={`h-11 font-mono text-sm ${choiceClass(paisa === chip.value)}`}
            onClick={() => {
              onReceived(String(chip.value / 100));
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>
      <label className="flex items-center justify-between gap-3 text-[15px]">
        <span className="text-text-secondary">{strings.received}</span>
        <span className="flex h-11 w-44 items-center gap-2 rounded-input border-[1.5px] border-border-strong bg-white px-3 focus-within:border-blue focus-within:ring-2 focus-within:ring-blue">
          <span
            aria-hidden="true"
            className="font-mono text-sm text-text-secondary"
          >
            Rs
          </span>
          <input
            inputMode="decimal"
            autoComplete="off"
            value={received}
            aria-label={strings.received}
            className="min-w-0 flex-grow bg-transparent text-end font-mono text-xl font-semibold outline-none"
            onChange={(event) => {
              onReceived(event.target.value);
            }}
          />
        </span>
      </label>
      {check && (
        <div
          className={`flex items-baseline justify-between rounded-lg px-3.5 py-3 ${check.status === "short" ? "bg-warning-bg text-warning" : "bg-[#E1ECF6] text-blue"}`}
        >
          <span className="text-[15px] font-semibold">
            {check.status === "short"
              ? strings.stillToCollect
              : strings.changeDue}
          </span>
          <output className="font-mono text-[26px] font-semibold">
            {formatPaisa(
              check.status === "short" ? check.missing : check.change,
            )}
          </output>
        </div>
      )}
    </div>
  );
}

export function PaymentSection({
  method,
  received,
  total,
  onMethod,
  onReceived,
}: PaymentSectionProps) {
  const strings = t().billing.payment;
  return (
    <>
      <div
        role="radiogroup"
        aria-label={strings.method}
        className="grid grid-cols-3 gap-2"
      >
        {METHODS.map((item) => (
          <button
            key={item}
            type="button"
            role="radio"
            aria-checked={method === item}
            className={`h-12 text-[15px] ${choiceClass(method === item)}`}
            onClick={() => {
              onMethod(item);
            }}
          >
            {strings.methods[item]}
          </button>
        ))}
      </div>
      {method === "cash" ? (
        <CashPanel received={received} total={total} onReceived={onReceived} />
      ) : (
        <p className="rounded-lg bg-off-white px-4 py-[22px] text-center text-[15px] leading-normal text-ink-soft">
          {strings.terminal}
        </p>
      )}
    </>
  );
}
