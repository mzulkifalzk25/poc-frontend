import type { ReactNode } from "react";
import { Link } from "react-router";

import { formatQuantity, type StockStatus } from "~/domain/product";
import { levelFraction, type StockRow } from "~/domain/stock";
import { t } from "~/i18n/t";

import { DataTable, type Column } from "../DataTable";

const badgeClasses: Record<StockStatus, string> = {
  in_stock: "bg-success-bg text-success-text",
  low: "bg-warning-bg text-warning",
  out: "bg-error-bg text-error-text",
  negative: "bg-error text-white",
  archived: "bg-border text-text-secondary",
};

const barClasses: Record<StockStatus, string> = {
  in_stock: "bg-success",
  low: "bg-gold",
  out: "bg-error",
  negative: "bg-error",
  archived: "bg-border",
};

interface StockTableProps {
  rows: StockRow[];
  adjustHref: (row: StockRow) => string;
  footer: ReactNode;
}

function columns(adjustHref: (row: StockRow) => string): Column<StockRow>[] {
  const strings = t().inventory;
  return [
    {
      id: "product",
      header: strings.columns.product,
      render: (row) => (
        <span className="truncate font-semibold">{row.name}</span>
      ),
    },
    {
      id: "level",
      header: strings.columns.level,
      render: (row) => (
        <span className="flex items-center gap-3">
          <span className="min-w-10 font-mono font-semibold">
            {formatQuantity(row.stock)}
          </span>
          <span
            aria-hidden="true"
            className="h-2 w-28 overflow-hidden rounded-pill bg-off-white"
          >
            <span
              className={`block h-full rounded-pill ${barClasses[row.status]}`}
              style={{
                width: `${String(Math.round(levelFraction(row.stock, row.lowStockAlert) * 100))}%`,
              }}
            />
          </span>
        </span>
      ),
    },
    {
      id: "alert",
      header: strings.columns.alertAt,
      render: (row) => (
        <span className="font-mono">{formatQuantity(row.lowStockAlert)}</span>
      ),
    },
    {
      id: "status",
      header: strings.columns.status,
      render: (row) => (
        <span
          className={`rounded-pill px-[9px] py-1 text-xs font-bold ${badgeClasses[row.status]}`}
        >
          {t().products.status[row.status]}
        </span>
      ),
    },
    {
      id: "adjust",
      header: "",
      align: "end",
      render: (row) => (
        <Link
          to={adjustHref(row)}
          aria-label={strings.adjustName(row.name)}
          className="flex h-11 items-center rounded-input px-3 text-sm font-semibold text-blue hover:bg-off-white focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none"
        >
          {strings.adjust}
        </Link>
      ),
    },
  ];
}

export function StockTable({ rows, adjustHref, footer }: StockTableProps) {
  return (
    <DataTable
      label={t().inventory.tableLabel}
      columns={columns(adjustHref)}
      rows={rows}
      rowKey={(row) => row.id}
      gridTemplate="2.2fr 2fr 0.8fr 1fr 0.9fr"
      footer={footer}
    />
  );
}
