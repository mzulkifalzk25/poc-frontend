import { formatClockTime, formatDayMonth } from "~/domain/dates";
import type { ActivityRow } from "~/domain/activity";
import { t } from "~/i18n/t";
import { STORE_TIME_ZONE } from "~/infrastructure/store-time-zone";

import { DataTable, type Column } from "../DataTable";

function columns(): Column<ActivityRow>[] {
  const strings = t().activity;
  return [
    {
      id: "time",
      header: strings.columns.time,
      render: (row) => (
        <span className="font-mono text-[13px]">
          {formatDayMonth(row.occurredAt, STORE_TIME_ZONE)}{" "}
          {formatClockTime(row.occurredAt, STORE_TIME_ZONE)}
        </span>
      ),
    },
    {
      id: "who",
      header: strings.columns.who,
      render: (row) => row.user ?? strings.system,
    },
    {
      id: "action",
      header: strings.columns.action,
      render: (row) => <span className="font-semibold">{row.action}</span>,
    },
    {
      id: "details",
      header: strings.columns.details,
      render: (row) => (
        <span className="text-text-secondary">{row.detail}</span>
      ),
    },
    {
      id: "flag",
      header: strings.columns.flag,
      render: (row) => (
        <span
          className={`rounded-pill px-[9px] py-1 text-xs font-bold ${row.flag === "review" ? "bg-warning-bg text-warning" : "bg-border text-ink-soft"}`}
        >
          {strings.flags[row.flag]}
        </span>
      ),
    },
  ];
}

export function ActivityTable({ rows }: { rows: ActivityRow[] }) {
  return (
    <DataTable
      label={t().activity.tableLabel}
      columns={columns()}
      rows={rows}
      rowKey={(row) => row.id}
      gridTemplate="1.1fr 1.2fr 1.4fr 3fr 0.8fr"
    />
  );
}
