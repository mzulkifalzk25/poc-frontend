import { Button } from "~/components/ui/Button";
import { formatBillNumber } from "~/domain/bill-number";
import { counterAction, type Counter } from "~/domain/counter";
import { minutesBetween } from "~/domain/elapsed";
import { t } from "~/i18n/t";

import { DataTable, type Column } from "../../DataTable";

interface CountersTableProps {
  counters: Counter[];
  now: Date;
  pending: boolean;
  onNewCode: (counter: Counter) => void;
  onDeactivate: (counter: Counter) => void;
}

function seenLabel(counter: Counter, now: Date): string {
  const strings = t().settings.counters.seen;
  if (counter.status === "code_ready") {
    return strings.codeReady;
  }
  if (counter.status === "not_activated") {
    return strings.noCode;
  }
  if (counter.status === "deactivated") {
    return strings.deactivated;
  }
  if (counter.lastSeenAt === null) {
    return strings.notSeen;
  }
  const minutes = minutesBetween(counter.lastSeenAt, now);
  if (minutes < 1) {
    return strings.justNow;
  }
  if (minutes < 60) {
    return strings.minutes(minutes);
  }
  return minutes < 24 * 60
    ? strings.hours(Math.floor(minutes / 60))
    : strings.days(Math.floor(minutes / (24 * 60)));
}

const pillClasses: Record<Counter["status"], string> = {
  activated: "bg-success-bg text-success-text",
  not_activated: "bg-border text-ink-soft",
  code_ready: "bg-border text-ink-soft",
  deactivated: "bg-error-bg text-error-text",
};

function StatusCell({ counter, now }: { counter: Counter; now: Date }) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span
        className={`rounded-pill px-[9px] py-1 text-xs font-bold ${pillClasses[counter.status]}`}
      >
        {t().settings.counters.status[counter.status]}
      </span>
      <span className="text-[13px] text-text-secondary">
        {seenLabel(counter, now)}
      </span>
    </span>
  );
}

export function CountersTable(props: CountersTableProps) {
  const { now, pending } = props;
  const strings = t().settings.counters;
  const columns: Column<Counter>[] = [
    {
      id: "name",
      header: strings.columns.counter,
      className: "ps-3 font-semibold",
      render: (counter) => counter.name,
    },
    {
      id: "code",
      header: strings.columns.code,
      className: "font-mono",
      render: (counter) => counter.code,
    },
    {
      id: "status",
      header: strings.columns.status,
      render: (counter) => <StatusCell counter={counter} now={now} />,
    },
    {
      id: "next",
      header: strings.columns.next,
      className: "font-mono",
      render: (counter) => formatBillNumber(counter.nextBillNo),
    },
    {
      id: "action",
      header: "",
      align: "end",
      className: "pe-3",
      render: (counter) => {
        const deactivate = counterAction(counter) === "deactivate";
        const label = deactivate ? strings.deactivate : strings.newCode;
        return (
          <Button
            variant={deactivate ? "secondary" : "outline"}
            size="sm"
            disabled={pending}
            aria-label={strings.actionFor(label, counter.name)}
            onClick={() => {
              (deactivate ? props.onDeactivate : props.onNewCode)(counter);
            }}
          >
            {label}
          </Button>
        );
      },
    },
  ];
  return (
    <DataTable
      label={strings.tableLabel}
      columns={columns}
      rows={props.counters}
      rowKey={(counter) => counter.id}
      gridTemplate="1.3fr 0.7fr 2fr 1.2fr 140px"
    />
  );
}
