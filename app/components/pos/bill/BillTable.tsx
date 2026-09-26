import type { ReactNode } from "react";

import { lineTotal, type DraftLine } from "~/domain/bill";
import { formatAmount } from "~/domain/money";
import { t } from "~/i18n/t";

import { QuantityInput } from "./QuantityInput";

export interface TableTexts {
  label: string;
  item: string;
  total: string;
  emptyTitle: string;
  emptyHint: string;
}

interface BillTableProps {
  lines: DraftLine[];
  texts?: TableTexts;
  priceTag?: (line: DraftLine) => ReactNode;
  footer?: ReactNode;
  lastProductId: number | null;
  onSetQty: (productId: number, qty: number) => void;
  onChange: (productId: number, delta: number) => void;
  onRemove: (productId: number) => void;
}

const GRID =
  "grid grid-cols-[56px_1fr_190px_130px_140px_60px] items-center px-3";
const stepClass =
  "flex h-11 w-11 items-center justify-center rounded-input border border-border-strong bg-white text-text transition hover:bg-off-white focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none active:bg-border";

function Icon({ path }: { path: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

function billTexts(): TableTexts {
  const strings = t().billing;
  return {
    label: strings.table.label,
    item: strings.table.item,
    total: strings.table.total,
    emptyTitle: strings.empty.title,
    emptyHint: strings.empty.hint,
  };
}

function EmptyBill({ texts }: { texts: TableTexts }) {
  return (
    <div className="flex h-[260px] flex-col items-center justify-center gap-2.5 text-text-secondary">
      <Icon path="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3M4 12h16" />
      <p className="text-lg font-semibold text-text">{texts.emptyTitle}</p>
      <p className="text-sm">{texts.emptyHint}</p>
    </div>
  );
}

function BillRow({
  line,
  index,
  highlighted,
  priceTag,
  ...actions
}: Omit<BillTableProps, "lines" | "lastProductId" | "texts" | "footer"> & {
  line: DraftLine;
  index: number;
  highlighted: boolean;
}) {
  const strings = t().billing.table;
  return (
    <div
      role="row"
      className={`${GRID} h-16 border-b border-border ${highlighted ? "bg-[#EAF2FA]" : "bg-white"}`}
    >
      <span role="cell" className="font-mono text-sm text-text-secondary">
        {index + 1}
      </span>
      <span role="cell" className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-[17px] font-semibold">{line.name}</span>
        <span className="font-mono text-xs text-text-secondary">
          {line.barcode}
        </span>
      </span>
      <span role="cell" className="flex items-center justify-center gap-2.5">
        <button
          type="button"
          aria-label={strings.decrease(line.name)}
          className={stepClass}
          onClick={() => {
            actions.onChange(line.productId, -1);
          }}
        >
          <Icon path="M5 12h14" />
        </button>
        <QuantityInput
          label={strings.quantity(line.name)}
          qty={line.qty}
          onCommit={(qty) => {
            actions.onSetQty(line.productId, qty);
          }}
        />
        <button
          type="button"
          aria-label={strings.increase(line.name)}
          className={stepClass}
          onClick={() => {
            actions.onChange(line.productId, 1);
          }}
        >
          <Icon path="M12 5v14M5 12h14" />
        </button>
      </span>
      <span role="cell" className="flex flex-col items-end gap-0.5">
        <span className="font-mono text-base text-ink-soft">
          {formatAmount(line.unitPrice)}
        </span>
        {priceTag?.(line)}
      </span>
      <span role="cell" className="text-end font-mono text-lg font-semibold">
        {formatAmount(lineTotal(line) / 100)}
      </span>
      <span role="cell" className="flex justify-end">
        <button
          type="button"
          aria-label={strings.remove(line.name)}
          className="flex h-11 w-11 items-center justify-center rounded-input text-text-secondary transition hover:bg-error-bg hover:text-error-text focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none"
          onClick={() => {
            actions.onRemove(line.productId);
          }}
        >
          <Icon path="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
        </button>
      </span>
    </div>
  );
}

export function BillTable({
  lines,
  lastProductId,
  texts = billTexts(),
  footer,
  ...actions
}: BillTableProps) {
  const strings = t().billing.table;
  return (
    <div
      role="table"
      aria-label={texts.label}
      className="flex min-h-0 flex-grow flex-col overflow-hidden rounded-lg border border-border bg-white"
    >
      <div
        role="row"
        className={`${GRID} h-11 flex-shrink-0 border-b border-border bg-off-white text-xs font-bold tracking-[0.05em] text-text-secondary uppercase`}
      >
        <span role="columnheader">{strings.number}</span>
        <span role="columnheader">{texts.item}</span>
        <span role="columnheader" className="text-center">
          {strings.qty}
        </span>
        <span role="columnheader" className="text-end">
          {strings.price}
        </span>
        <span role="columnheader" className="text-end">
          {texts.total}
        </span>
        <span role="columnheader" className="sr-only">
          {strings.actions}
        </span>
      </div>
      <div className="min-h-0 flex-grow overflow-y-auto">
        {lines.length === 0 ? (
          <EmptyBill texts={texts} />
        ) : (
          lines.map((line, index) => (
            <BillRow
              key={line.productId}
              line={line}
              index={index}
              highlighted={line.productId === lastProductId}
              {...actions}
            />
          ))
        )}
      </div>
      {footer}
    </div>
  );
}
