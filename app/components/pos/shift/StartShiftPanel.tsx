import { useState } from "react";

import { t } from "~/i18n/t";

import { ArrowIcon, bigButtonClass } from "../activate/shared";

export type StatusTone = "ready" | "busy" | "problem";

export interface StatusLine {
  label: string;
  value: string;
  tone: StatusTone;
}

interface StartShiftPanelProps {
  heading: string;
  statusLines: StatusLine[];
  canStart: boolean;
  pending: boolean;
  error: string | null;
  onStart: (openingCash: string) => void;
  onSignOut: () => void;
  onRetrySync?: () => void;
}

const toneClasses: Record<StatusTone, string> = {
  ready: "text-blue",
  busy: "text-text-secondary",
  problem: "text-warning",
};

function StatusList({
  lines,
  onRetry,
}: {
  lines: StatusLine[];
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-white p-3.5 text-[13px] text-ink-soft">
      {lines.map((line) => (
        <div key={line.label} className="flex justify-between gap-4">
          <span>{line.label}</span>
          <span className={`text-end font-semibold ${toneClasses[line.tone]}`}>
            {line.value}
          </span>
        </div>
      ))}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="self-end font-semibold text-blue hover:underline focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none"
        >
          {t().startShift.retry}
        </button>
      )}
    </div>
  );
}

export function StartShiftPanel(props: StartShiftPanelProps) {
  const strings = t().startShift;
  const [cash, setCash] = useState("");
  return (
    <form
      className="flex min-h-[560px] w-[440px] max-w-full flex-col justify-between rounded-xl bg-off-white p-9 text-text shadow-[0_30px_80px_rgba(0,0,0,0.4)]"
      onSubmit={(event) => {
        event.preventDefault();
        props.onStart(cash);
      }}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-[22px] font-bold">
            {strings.title}
          </h1>
          <p className="text-sm text-text-secondary">{props.heading}</p>
          <button
            type="button"
            onClick={props.onSignOut}
            className="self-start text-[13px] font-semibold text-blue hover:underline focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none"
          >
            {strings.notYou}
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="opening-cash" className="text-sm font-semibold">
            {strings.cashLabel}
          </label>
          <div className="flex h-[60px] items-center gap-2.5 rounded-lg border-[1.5px] border-border-strong bg-white px-4 focus-within:border-blue focus-within:ring-2 focus-within:ring-blue">
            <span
              aria-hidden="true"
              className="font-mono font-semibold text-text-secondary"
            >
              Rs
            </span>
            <input
              id="opening-cash"
              inputMode="decimal"
              autoComplete="off"
              autoFocus
              value={cash}
              aria-invalid={props.error ? true : undefined}
              className="min-w-0 flex-grow bg-transparent font-mono text-2xl font-semibold outline-none"
              onChange={(event) => {
                setCash(event.target.value);
              }}
            />
          </div>
          <p className="text-xs leading-normal text-text-secondary">
            {strings.cashHint}
          </p>
        </div>
        <StatusList lines={props.statusLines} onRetry={props.onRetrySync} />
        {props.error && (
          <p
            role="alert"
            className="rounded-input bg-error-bg px-3.5 py-2.5 text-sm font-semibold text-error-text"
          >
            {props.error}
          </p>
        )}
      </div>
      <button
        type="submit"
        className={`${bigButtonClass} mt-6`}
        disabled={!props.canStart || props.pending}
      >
        {props.pending ? strings.starting : strings.start}
        <ArrowIcon />
      </button>
    </form>
  );
}
