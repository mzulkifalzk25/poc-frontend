import type { ReactNode } from "react";

import { formatClockTime } from "~/domain/dates";
import { formatBillNumber } from "~/domain/bill-number";
import { formatMoney } from "~/domain/money";
import { formatQuantity } from "~/domain/product";
import type { BillRow, BillStatus } from "~/domain/sale";
import { t } from "~/i18n/t";
import { STORE_TIME_ZONE } from "~/infrastructure/store-time-zone";

import { DataTable, type Column } from "../DataTable";

const statusClasses: Record<BillStatus, string> = {
  paid: "bg-success-bg text-success-text",
  partially_refunded: "bg-warning-bg text-warning",
  refunded: "bg-error-bg text-error-text",
};

interface SalesTableProps {
  bills: BillRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  footer?: ReactNode;
}

function columns(props: SalesTableProps): Column<BillRow>[] {
  const strings = t().sales;
  return [
    {
      id: "bill",
      header: strings.columns.bill,
      render: (bill) => (
        <button
          type="button"
          aria-label={strings.openBill(formatBillNumber(bill.billNo))}
          aria-pressed={props.selectedId === bill.id}
          className="-ms-2 flex h-11 items-center rounded-input px-2 font-mono font-semibold hover:bg-off-white focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none aria-pressed:bg-gold/20"
          onClick={() => {
            props.onSelect(bill.id);
          }}
        >
          {formatBillNumber(bill.billNo)}
        </button>
      ),
    },
    {
      id: "time",
      header: strings.columns.time,
      render: (bill) => (
        <span className="font-mono">
          {formatClockTime(bill.time, STORE_TIME_ZONE)}
        </span>
      ),
    },
    {
      id: "cashier",
      header: strings.columns.cashier,
      render: (bill) => bill.cashier,
    },
    {
      id: "items",
      header: strings.columns.items,
      render: (bill) => (
        <span className="font-mono">{formatQuantity(bill.items)}</span>
      ),
    },
    {
      id: "payment",
      header: strings.columns.payment,
      render: (bill) => (bill.payment ? strings.methods[bill.payment] : "–"),
    },
    {
      id: "total",
      header: strings.columns.total,
      align: "end",
      render: (bill) => (
        <span className="font-mono font-semibold">
          {formatMoney(bill.total)}
        </span>
      ),
    },
    {
      id: "status",
      header: strings.columns.status,
      render: (bill) => (
        <span
          className={`rounded-pill px-[9px] py-1 text-xs font-bold ${statusClasses[bill.status]}`}
        >
          {strings.status[bill.status]}
        </span>
      ),
    },
  ];
}

export function SalesTable(props: SalesTableProps) {
  return (
    <DataTable
      label={t().sales.tableLabel}
      columns={columns(props)}
      rows={props.bills}
      rowKey={(bill) => bill.id}
      gridTemplate="1.4fr 0.8fr 1.4fr 0.6fr 0.9fr 1fr 1.1fr"
      footer={props.footer}
    />
  );
}
