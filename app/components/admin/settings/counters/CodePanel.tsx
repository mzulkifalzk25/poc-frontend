import { useEffect, useState } from "react";

import { Button } from "~/components/ui/Button";
import { secondsLeft } from "~/domain/counter";
import { t } from "~/i18n/t";

import type { ShownCode } from "./useCounters";

interface CodePanelProps {
  code: ShownCode;
  pending: boolean;
  onRevoke: () => void;
  notify: (message: string, failed?: boolean) => void;
}

function clock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes)}:${String(seconds % 60).padStart(2, "0")}`;
}

function useSecondsLeft(expiresAt: string): number {
  const [left, setLeft] = useState(() => secondsLeft(expiresAt, new Date()));
  useEffect(() => {
    const timer = setInterval(() => {
      setLeft(secondsLeft(expiresAt, new Date()));
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [expiresAt]);
  return left;
}

export function CodePanel({ code, pending, onRevoke, notify }: CodePanelProps) {
  const strings = t().settings.counters.code;
  const left = useSecondsLeft(code.expiresAt);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code.code);
      notify(strings.copied);
    } catch {
      notify(strings.copyFailed, true);
    }
  }

  return (
    <section
      aria-label={strings.title(code.counterName)}
      className="flex flex-col gap-3 rounded-lg border border-[#BFE5D2] bg-success-bg p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-bold text-success-text">
          {strings.title(code.counterName)}
        </h3>
        <span className="text-[13px] text-success-text">
          {left > 0
            ? `${strings.validity} · ${strings.left(clock(left))}`
            : strings.expired}
        </span>
      </div>
      <p
        className={`font-mono text-[34px] font-semibold tracking-[0.12em] ${left > 0 ? "text-navy" : "text-text-secondary line-through"}`}
      >
        {code.code}
      </p>
      <p className="text-sm text-ink-soft">{strings.help}</p>
      <div className="flex flex-wrap gap-2.5">
        <Button disabled={left === 0} onClick={() => void copy()}>
          {strings.copy}
        </Button>
        <Button variant="secondary" disabled={pending} onClick={onRevoke}>
          {strings.revoke}
        </Button>
      </div>
    </section>
  );
}
