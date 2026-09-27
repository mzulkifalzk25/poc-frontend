import type { ReactNode } from "react";

import { Card } from "~/components/ui/Card";
import { PAPER_WIDTHS, type StoreSettings } from "~/domain/store-settings";
import { t } from "~/i18n/t";

import { Field, fieldClass, monoFieldClass } from "../FormField";

type SetField = <K extends keyof StoreSettings>(
  key: K,
  value: StoreSettings[K],
) => void;

interface CardProps {
  draft: StoreSettings;
  setField: SetField;
  fieldErrors: Record<string, string>;
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-4 p-6">
      <h2 className="font-heading text-lg font-bold">{title}</h2>
      {children}
    </Card>
  );
}

function TextField(props: {
  id: string;
  label: string;
  value: string;
  mono?: boolean;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={props.label} htmlFor={props.id} error={props.error}>
      <input
        id={props.id}
        className={props.mono ? monoFieldClass : fieldClass}
        value={props.value}
        aria-invalid={props.error ? true : undefined}
        onChange={(event) => {
          props.onChange(event.target.value);
        }}
      />
    </Field>
  );
}

function Checkbox(props: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
      <input
        type="checkbox"
        className="h-5 w-5 accent-blue"
        checked={props.checked}
        onChange={(event) => {
          props.onChange(event.target.checked);
        }}
      />
      {props.label}
    </label>
  );
}

export function StoreProfileCard({ draft, setField, fieldErrors }: CardProps) {
  const strings = t().settings.profile;
  return (
    <SectionCard title={strings.title}>
      <div className="flex gap-5">
        <div
          title={strings.logoNote}
          className="flex h-[108px] w-[108px] flex-shrink-0 flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border-strong text-[13px] font-semibold text-text-secondary"
        >
          {strings.logo}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <TextField
            id="store-name"
            label={strings.storeName}
            value={draft.storeName}
            error={fieldErrors.store_name}
            onChange={(value) => {
              setField("storeName", value);
            }}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              id="store-phone"
              label={strings.phone}
              value={draft.phone}
              mono
              error={fieldErrors.phone}
              onChange={(value) => {
                setField("phone", value);
              }}
            />
            <TextField
              id="store-address"
              label={strings.address}
              value={draft.address}
              error={fieldErrors.address}
              onChange={(value) => {
                setField("address", value);
              }}
            />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

export function TaxCard({ draft, setField, fieldErrors }: CardProps) {
  const strings = t().settings.tax;
  return (
    <SectionCard title={strings.title}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={strings.currency} htmlFor="store-currency">
          <select id="store-currency" className={fieldClass} disabled>
            <option>{strings.pkr}</option>
          </select>
        </Field>
        <TextField
          id="store-tax"
          label={strings.rate}
          value={draft.taxRate}
          mono
          error={fieldErrors.tax_rate}
          onChange={(value) => {
            setField("taxRate", value);
          }}
        />
      </div>
      <div className="flex flex-col">
        <Checkbox
          label={strings.includesTax}
          checked={draft.pricesIncludeTax}
          onChange={(checked) => {
            setField("pricesIncludeTax", checked);
          }}
        />
        <Checkbox
          label={strings.blockOutOfStock}
          checked={draft.blockWhenOutOfStock}
          onChange={(checked) => {
            setField("blockWhenOutOfStock", checked);
          }}
        />
      </div>
    </SectionCard>
  );
}

export function ReceiptCard({ draft, setField, fieldErrors }: CardProps) {
  const strings = t().settings.receipt;
  return (
    <SectionCard title={strings.title}>
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold">{strings.paperWidth}</span>
        <div
          role="group"
          aria-label={strings.paperWidth}
          className="flex gap-2"
        >
          {PAPER_WIDTHS.map((width) => (
            <button
              key={width}
              type="button"
              aria-pressed={draft.receiptPaperMm === width}
              className="h-11 min-w-24 rounded-input border border-border-strong px-4 text-sm font-semibold transition hover:bg-off-white focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none aria-pressed:border-2 aria-pressed:border-blue aria-pressed:bg-[#EEF4FA] aria-pressed:text-blue"
              onClick={() => {
                setField("receiptPaperMm", width);
              }}
            >
              {strings.width(width)}
            </button>
          ))}
        </div>
        {fieldErrors.receipt_paper_mm && (
          <p className="text-xs font-semibold text-error-text">
            {fieldErrors.receipt_paper_mm}
          </p>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          id="receipt-header"
          label={strings.header}
          value={draft.receiptHeader}
          error={fieldErrors.receipt_header}
          onChange={(value) => {
            setField("receiptHeader", value);
          }}
        />
        <TextField
          id="receipt-footer"
          label={strings.footer}
          value={draft.receiptFooter}
          error={fieldErrors.receipt_footer}
          onChange={(value) => {
            setField("receiptFooter", value);
          }}
        />
      </div>
      <Checkbox
        label={strings.barcode}
        checked={draft.receiptShowBarcode}
        onChange={(checked) => {
          setField("receiptShowBarcode", checked);
        }}
      />
    </SectionCard>
  );
}
