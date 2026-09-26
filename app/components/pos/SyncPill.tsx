import { useEffect, useState } from "react";

import { useOnlineStatus } from "~/components/ui/useOnlineStatus";
import { t } from "~/i18n/t";
import {
  watchOutboxStatus,
  type OutboxStatus,
} from "~/infrastructure/sync/outbox-status";

type Tone = "online" | "offline" | "problem";

const toneClasses: Record<Tone, { pill: string; dot: string }> = {
  online: { pill: "bg-[#1B3F63] text-[#B5EBD2]", dot: "bg-success" },
  offline: { pill: "bg-[#4A3512] text-[#FFD89A]", dot: "bg-[#F5A524]" },
  problem: { pill: "bg-error-bg text-error-text", dot: "bg-error" },
};

function Pill({ tone, text }: { tone: Tone; text: string }) {
  return (
    <span
      role="status"
      className={`flex h-9 items-center gap-2 rounded-pill px-3.5 text-[13px] font-semibold whitespace-nowrap ${toneClasses[tone].pill}`}
    >
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full ${toneClasses[tone].dot}`}
      />
      {text}
    </span>
  );
}

export function SyncPillView({
  online,
  status,
}: {
  online: boolean;
  status: OutboxStatus;
}) {
  const strings = t().syncStatus;
  const text = !online
    ? strings.offline(status.pending)
    : status.pending > 0
      ? strings.syncing(status.pending)
      : strings.synced;
  return (
    <>
      <Pill tone={online ? "online" : "offline"} text={text} />
      {status.rejected > 0 && (
        <Pill tone="problem" text={strings.rejected(status.rejected)} />
      )}
    </>
  );
}

export function SyncPill() {
  const online = useOnlineStatus();
  const [status, setStatus] = useState<OutboxStatus>({
    pending: 0,
    rejected: 0,
  });
  useEffect(() => watchOutboxStatus(setStatus), []);
  return <SyncPillView online={online} status={status} />;
}
