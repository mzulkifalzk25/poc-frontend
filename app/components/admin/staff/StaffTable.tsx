import type { ReactNode } from "react";

import { Button } from "~/components/ui/Button";
import { CATEGORY_TINTS } from "~/domain/category";
import type { Counter } from "~/domain/counter";
import type { StaffMember } from "~/domain/staff";
import { t } from "~/i18n/t";

import { tintClass } from "../categoryTint";
import { DataTable, type Column } from "../DataTable";
import { lastActiveLabel } from "./lastActive";

interface StaffTableProps {
  members: StaffMember[];
  counters: Counter[];
  now: Date;
  onManage: (member: StaffMember) => void;
  statusExtra?: (member: StaffMember) => ReactNode;
}

function avatarClass(id: number): string {
  return tintClass(CATEGORY_TINTS[id % CATEGORY_TINTS.length] ?? "blue");
}

function NameCell({ member }: { member: StaffMember }) {
  return (
    <span className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${avatarClass(member.id)}`}
      >
        {member.initials}
      </span>
      <span className="font-semibold">{member.fullName}</span>
    </span>
  );
}

function StatusPill({ active }: { active: boolean }) {
  const strings = t().staff.status;
  return (
    <span
      className={`rounded-pill px-[9px] py-1 text-xs font-bold ${
        active ? "bg-[#E1ECF6] text-blue" : "bg-error-bg text-error-text"
      }`}
    >
      {active ? strings.active : strings.deactivated}
    </span>
  );
}

function counterLabel(member: StaffMember, counters: Counter[]): string {
  const strings = t().staff;
  if (member.role !== "cashier") {
    return strings.allCounters;
  }
  const counter = counters.find((item) => item.id === member.defaultCounterId);
  return counter?.name ?? strings.noCounter;
}

export function StaffTable(props: StaffTableProps) {
  const { counters, now, onManage, statusExtra } = props;
  const strings = t().staff;
  const columns: Column<StaffMember>[] = [
    {
      id: "name",
      header: strings.columns.name,
      className: "ps-3",
      render: (member) => <NameCell member={member} />,
    },
    {
      id: "role",
      header: strings.columns.role,
      render: (member) => t().adminNav.roles[member.role],
    },
    {
      id: "counter",
      header: strings.columns.counter,
      render: (member) => counterLabel(member, counters),
    },
    {
      id: "lastActive",
      header: strings.columns.lastActive,
      render: (member) => lastActiveLabel(member.lastActiveAt, now),
    },
    {
      id: "status",
      header: strings.columns.status,
      render: (member) => (
        <span className="flex flex-wrap items-center gap-2">
          <StatusPill active={member.isActive} />
          {statusExtra?.(member)}
        </span>
      ),
    },
    {
      id: "manage",
      header: "",
      align: "end",
      className: "pe-3",
      render: (member) =>
        member.role === "cashier" && (
          <Button
            variant="secondary"
            size="sm"
            aria-label={strings.manageName(member.fullName)}
            onClick={() => {
              onManage(member);
            }}
          >
            {strings.manage}
          </Button>
        ),
    },
  ];
  return (
    <DataTable
      label={strings.tableLabel}
      columns={columns}
      rows={props.members}
      rowKey={(member) => member.id}
      gridTemplate="2.2fr 1.1fr 1.2fr 1.1fr 1.3fr 104px"
    />
  );
}
