import type { ReactNode } from "react";

export interface Column<T> {
  id: string;
  header: ReactNode;
  align?: "start" | "end";
  className?: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  label: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  gridTemplate: string;
  footer?: ReactNode;
}

function alignClass(align: Column<unknown>["align"]): string {
  return align === "end" ? "text-end justify-self-end" : "text-start";
}

export function DataTable<T>({
  label,
  columns,
  rows,
  rowKey,
  gridTemplate,
  footer,
}: DataTableProps<T>) {
  const gridStyle = { gridTemplateColumns: gridTemplate };
  return (
    <div
      role="table"
      aria-label={label}
      className="flex flex-col overflow-hidden rounded-card border border-border bg-white"
    >
      <div
        role="row"
        style={gridStyle}
        className="grid h-12 items-center border-b border-border bg-off-white px-2 text-xs font-bold tracking-[0.05em] text-text-secondary uppercase"
      >
        {columns.map((column) => (
          <span
            key={column.id}
            role="columnheader"
            className={`${alignClass(column.align)} ${column.className ?? ""}`}
          >
            {column.header}
          </span>
        ))}
      </div>
      {rows.map((row) => (
        <div
          key={rowKey(row)}
          role="row"
          style={gridStyle}
          className="grid min-h-14 items-center border-b border-border px-2 text-sm"
        >
          {columns.map((column) => (
            <span
              key={column.id}
              role="cell"
              className={`min-w-0 ${alignClass(column.align)} ${column.className ?? ""}`}
            >
              {column.render(row)}
            </span>
          ))}
        </div>
      ))}
      {footer}
    </div>
  );
}
