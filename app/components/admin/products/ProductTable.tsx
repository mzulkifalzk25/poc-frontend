import type { ReactNode } from "react";
import { Link } from "react-router";

import { formatMoney } from "~/domain/money";
import {
  formatQuantity,
  productInitials,
  type ProductSummary,
} from "~/domain/product";
import { t } from "~/i18n/t";

import { tintClass } from "../categoryTint";
import { DataTable, type Column } from "../DataTable";

type BadgeKind = ProductSummary["status"] | "archived";

const badgeClasses: Record<BadgeKind, string> = {
  in_stock: "bg-success-bg text-success-text",
  low: "bg-warning-bg text-warning",
  out: "bg-error-bg text-error-text",
  archived: "bg-border text-text-secondary",
};

const iconButtonClass =
  "flex h-11 w-11 items-center justify-center rounded-input transition hover:bg-off-white focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none active:bg-border";

function Icon({ path }: { path: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

interface ProductTableProps {
  products: ProductSummary[];
  archived: boolean;
  editHref: (product: ProductSummary) => string;
  onArchive?: (product: ProductSummary) => void;
  footer: ReactNode;
}

function nameCell(product: ProductSummary) {
  return (
    <span className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[9px] text-[13px] font-bold ${tintClass(product.category?.tint ?? "")}`}
      >
        {productInitials(product.name)}
      </span>
      <span className="truncate font-semibold">{product.name}</span>
    </span>
  );
}

function categoryCell(product: ProductSummary) {
  const strings = t().products;
  return (
    <span
      className={`rounded-pill px-2.5 py-[5px] text-xs font-bold ${tintClass(product.category?.tint ?? "")}`}
    >
      {product.category?.name ?? strings.noCategory}
    </span>
  );
}

function stockCell(product: ProductSummary, archived: boolean) {
  const kind: BadgeKind = archived ? "archived" : product.status;
  return (
    <span className="flex items-center gap-2.5 ps-6">
      <span className="min-w-7 font-mono font-semibold">
        {formatQuantity(product.stock)}
      </span>
      <span
        className={`rounded-pill px-[9px] py-1 text-xs font-bold ${badgeClasses[kind]}`}
      >
        {t().products.status[kind]}
      </span>
    </span>
  );
}

function buildColumns(props: ProductTableProps): Column<ProductSummary>[] {
  const strings = t().products;
  return [
    { id: "product", header: strings.columns.product, render: nameCell },
    {
      id: "barcode",
      header: strings.columns.barcode,
      className: "font-mono text-[13px] text-ink-soft",
      render: (product) => product.barcode,
    },
    { id: "category", header: strings.columns.category, render: categoryCell },
    {
      id: "price",
      header: strings.columns.price,
      align: "end",
      className: "font-mono font-semibold",
      render: (product) => formatMoney(product.price),
    },
    {
      id: "cost",
      header: strings.columns.cost,
      align: "end",
      className: "font-mono text-text-secondary",
      render: (product) => (product.cost ? formatMoney(product.cost) : "—"),
    },
    {
      id: "stock",
      header: <span className="ps-6">{strings.columns.stock}</span>,
      render: (product) => stockCell(product, props.archived),
    },
    {
      id: "actions",
      header: <span className="sr-only">{strings.columns.actions}</span>,
      align: "end",
      render: (product) => <RowActions product={product} {...props} />,
    },
  ];
}

function RowActions({
  product,
  editHref,
  onArchive,
}: ProductTableProps & { product: ProductSummary }) {
  const strings = t().products;
  return (
    <span className="flex justify-end gap-1">
      <Link
        to={editHref(product)}
        aria-label={strings.edit(product.name)}
        className={`${iconButtonClass} text-ink-soft`}
      >
        <Icon path="M4 20h4L19 9l-4-4L4 16v4z" />
      </Link>
      {onArchive && (
        <button
          type="button"
          aria-label={strings.remove(product.name)}
          className={`${iconButtonClass} text-error-text hover:bg-error-bg`}
          onClick={() => {
            onArchive(product);
          }}
        >
          <Icon path="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
        </button>
      )}
    </span>
  );
}

export function ProductTable(props: ProductTableProps) {
  return (
    <DataTable
      label={t().products.tableLabel}
      columns={buildColumns(props)}
      rows={props.products}
      rowKey={(product) => product.id}
      gridTemplate="2.4fr 1.6fr 1.4fr 0.9fr 0.9fr 1.3fr 104px"
      footer={props.footer}
    />
  );
}
