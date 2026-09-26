import { Link } from "react-router";

import type { DeviceCounter } from "~/infrastructure/session/device-store";
import { t } from "~/i18n/t";

import { ArrowIcon, bigButtonClass } from "./shared";

interface ActivateSuccessProps {
  counter: DeviceCounter;
  cashierCount: number | null;
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span>{label}</span>
      <span className="text-end font-semibold text-success-text">{value}</span>
    </div>
  );
}

export function ActivateSuccess({
  counter,
  cashierCount,
}: ActivateSuccessProps) {
  const strings = t().activate.success;
  return (
    <div className="flex flex-1 flex-col justify-between">
      <div className="flex flex-col gap-[22px]">
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
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading text-[30px] font-bold tracking-[-0.02em]">
            {strings.title(counter.name)}
          </h1>
          <p className="text-[15px] leading-normal text-text-secondary">
            {strings.codeLinePrefix}{" "}
            <span className="font-mono font-semibold text-text">
              {counter.code}
            </span>
            {strings.codeLineSuffix(counter.code)}
          </p>
        </div>
        <div className="flex flex-col gap-2 rounded-xl bg-off-white px-4 py-3.5 text-sm text-[#34445A]">
          <StatusRow label={strings.catalogue} value={strings.catalogueValue} />
          <StatusRow
            label={strings.cashiers}
            value={
              cashierCount === null
                ? strings.cashiersUnknown
                : strings.cashiersValue(cashierCount)
            }
          />
          <StatusRow label={strings.offline} value={strings.offlineValue} />
        </div>
      </div>
      <Link to="/" className={bigButtonClass}>
        {strings.continue}
        <ArrowIcon />
      </Link>
    </div>
  );
}
