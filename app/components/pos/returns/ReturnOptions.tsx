import type { PaymentMethod } from "~/domain/payment";
import { RETURN_REASONS, type ReturnReason } from "~/domain/return";
import { t } from "~/i18n/t";

const METHODS: PaymentMethod[] = ["cash", "card", "wallet"];

interface ReturnOptionsProps {
  method: PaymentMethod;
  reason: ReturnReason;
  restock: boolean;
  onMethod: (method: PaymentMethod) => void;
  onReason: (reason: ReturnReason) => void;
  onRestock: (restock: boolean) => void;
}

const focus =
  "transition focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none";

function methodClass(selected: boolean) {
  return `h-[52px] rounded-lg border-[1.5px] px-1.5 text-sm leading-tight ${focus} ${
    selected
      ? "border-blue bg-[#E1ECF6] font-bold text-blue"
      : "border-border-strong bg-white font-semibold text-navy hover:bg-off-white active:bg-border"
  }`;
}

function reasonClass(selected: boolean) {
  return `h-12 rounded-lg border-[1.5px] text-sm ${focus} ${
    selected
      ? "border-navy bg-navy font-bold text-white"
      : "border-border-strong bg-white font-semibold text-navy hover:bg-off-white active:bg-border"
  }`;
}

export function ReturnOptions(props: ReturnOptionsProps) {
  const strings = t().returns;
  return (
    <>
      <div className="flex flex-col gap-2">
        <p id="cashback-label" className="text-sm font-semibold">
          {strings.cashback}
        </p>
        <div
          role="radiogroup"
          aria-labelledby="cashback-label"
          className="grid grid-cols-[1.5fr_1fr_1fr] gap-2"
        >
          {METHODS.map((method) => (
            <button
              key={method}
              type="button"
              role="radio"
              aria-checked={props.method === method}
              className={methodClass(props.method === method)}
              onClick={() => {
                props.onMethod(method);
              }}
            >
              {strings.methods[method]}
            </button>
          ))}
        </div>
        <p className="text-xs leading-normal text-text-secondary">
          {strings.methodNotes[props.method]}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <p id="reason-label" className="text-sm font-semibold">
          {strings.reason}
        </p>
        <div
          role="radiogroup"
          aria-labelledby="reason-label"
          className="grid grid-cols-2 gap-2"
        >
          {RETURN_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              role="radio"
              aria-checked={props.reason === reason}
              className={reasonClass(props.reason === reason)}
              onClick={() => {
                props.onReason(reason);
              }}
            >
              {strings.reasons[reason]}
            </button>
          ))}
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-2.5 text-[15px]">
        <input
          type="checkbox"
          checked={props.restock}
          className="h-[22px] w-[22px] accent-blue focus-visible:ring-2 focus-visible:ring-blue"
          onChange={(event) => {
            props.onRestock(event.target.checked);
          }}
        />
        <span>{strings.restock}</span>
      </label>
      <p className="mt-auto text-center text-xs leading-normal text-text-secondary">
        {strings.noApproval}
      </p>
    </>
  );
}
