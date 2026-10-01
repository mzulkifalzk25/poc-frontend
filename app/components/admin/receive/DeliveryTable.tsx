import { formatMoney } from "~/domain/money";
import {
  costChange,
  lineTotal,
  type CostChange,
  type DeliveryLine,
} from "~/domain/delivery";
import { t } from "~/i18n/t";

import { DataTable, type Column } from "../DataTable";
import { monoFieldClass } from "../FormField";

interface DeliveryTableProps {
  lines: DeliveryLine[];
  onChange: (productId: number, changes: Partial<DeliveryLine>) => void;
  onRemove: (productId: number) => void;
}

const changeTone: Record<CostChange["kind"], string> = {
  new: "bg-border text-ink-soft",
  same: "bg-border text-ink-soft",
  higher: "bg-warning-bg text-warning",
  lower: "bg-success-bg text-success-text",
};

function changeText(change: CostChange): string {
  const strings = t().receive.change;
  switch (change.kind) {
    case "new":
      return strings.new;
    case "same":
      return strings.same;
    case "higher":
      return strings.higher(String(change.diff));
    case "lower":
      return strings.lower(String(change.diff));
  }
}

const smallField = `${monoFieldClass} h-10 w-24 px-2.5 text-sm`;

function columns(props: DeliveryTableProps): Column<DeliveryLine>[] {
  const strings = t().receive;
  return [
    {
      id: "product",
      header: strings.columns.product,
      render: (line) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-semibold">{line.name}</span>
          <span className="font-mono text-xs text-text-secondary">
            {line.barcode}
          </span>
        </span>
      ),
    },
    {
      id: "qty",
      header: strings.columns.qty,
      render: (line) => (
        <input
          aria-label={strings.qtyName(line.name)}
          inputMode="decimal"
          className={smallField}
          value={line.qty}
          onChange={(event) => {
            props.onChange(line.productId, { qty: event.target.value });
          }}
        />
      ),
    },
    {
      id: "cost",
      header: strings.columns.cost,
      render: (line) => (
        <input
          aria-label={strings.costName(line.name)}
          inputMode="decimal"
          className={smallField}
          value={line.unitCost}
          onChange={(event) => {
            props.onChange(line.productId, { unitCost: event.target.value });
          }}
        />
      ),
    },
    {
      id: "change",
      header: strings.columns.change,
      render: (line) => {
        const change = costChange(line.unitCost, line.lastCost);
        return (
          <span
            className={`rounded-pill px-2.5 py-1 text-xs font-bold ${changeTone[change.kind]}`}
          >
            {changeText(change)}
          </span>
        );
      },
    },
    {
      id: "total",
      header: strings.columns.total,
      align: "end",
      render: (line) => (
        <span className="font-mono font-semibold">
          {formatMoney(lineTotal(line))}
        </span>
      ),
    },
    {
      id: "remove",
      header: "",
      align: "end",
      render: (line) => (
        <button
          type="button"
          aria-label={strings.remove(line.name)}
          className="flex h-11 w-11 items-center justify-center rounded-input text-text-secondary hover:bg-off-white focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none"
          onClick={() => {
            props.onRemove(line.productId);
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      ),
    },
  ];
}

export function DeliveryTable(props: DeliveryTableProps) {
  return (
    <DataTable
      label={t().receive.tableLabel}
      columns={columns(props)}
      rows={props.lines}
      rowKey={(line) => line.productId}
      gridTemplate="2.2fr 1fr 1fr 1.2fr 1fr 0.5fr"
    />
  );
}
