import { Link } from "react-router";

import type { DeviceCounter } from "~/infrastructure/session/device-store";
import { t } from "~/i18n/t";

import type { FirstSyncState } from "../useFirstSync";

import { ArrowIcon, bigButtonClass } from "./shared";

interface ActivateSuccessProps {
  counter: DeviceCounter;
  cashierCount: number | null;
  sync: FirstSyncState;
  onRetrySync: () => void;
}

type RowTone = "done" | "busy" | "problem";

const toneClasses: Record<RowTone, string> = {
  done: "text-success-text",
  busy: "text-text-secondary",
  problem: "text-warning",
};

function StatusRow(props: { label: string; value: string; tone: RowTone }) {
  return (
    <div className="flex justify-between gap-4">
      <span>{props.label}</span>
      <span className={`text-end font-semibold ${toneClasses[props.tone]}`}>
        {props.value}
      </span>
    </div>
  );
}

function catalogueRow(sync: FirstSyncState): { value: string; tone: RowTone } {
  const strings = t().activate.success;
  if (sync.status === "done") {
    return {
      value: strings.catalogueReady(sync.summary.products),
      tone: "done",
    };
  }
  if (sync.status === "failed") {
    return { value: strings.catalogueFailed, tone: "problem" };
  }
  const loaded = sync.progress?.phase === "products" ? sync.progress.loaded : 0;
  return { value: strings.catalogueDownloading(loaded), tone: "busy" };
}

function cashierValue(sync: FirstSyncState, cashierCount: number | null) {
  const strings = t().activate.success;
  const total = sync.status === "done" ? sync.summary.cashiers : cashierCount;
  return total === null
    ? strings.cashiersUnknown
    : strings.cashiersValue(total);
}

export function ActivateSuccess({
  counter,
  cashierCount,
  sync,
  onRetrySync,
}: ActivateSuccessProps) {
  const strings = t().activate.success;
  const catalogue = catalogueRow(sync);
  const ready = sync.status === "done";
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
        <div className="flex flex-col gap-2 rounded-xl bg-off-white px-4 py-3.5 text-sm text-ink-soft">
          <StatusRow label={strings.catalogue} {...catalogue} />
          <StatusRow
            label={strings.cashiers}
            value={cashierValue(sync, cashierCount)}
            tone="done"
          />
          <StatusRow
            label={strings.offline}
            value={ready ? strings.offlineReady : strings.offlineValue}
            tone={ready ? "done" : "busy"}
          />
          {sync.status === "failed" && (
            <button
              type="button"
              onClick={onRetrySync}
              className="self-start font-semibold text-blue underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none"
            >
              {strings.retry}
            </button>
          )}
        </div>
      </div>
      <Link to="/" className={bigButtonClass}>
        {strings.continue}
        <ArrowIcon />
      </Link>
    </div>
  );
}
