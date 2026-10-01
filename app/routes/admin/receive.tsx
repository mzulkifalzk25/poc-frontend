import { useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router";

import { PageHeader } from "~/components/admin/PageHeader";
import {
  Field,
  fieldClass,
  monoFieldClass,
} from "~/components/admin/FormField";
import { DeliverySummary } from "~/components/admin/receive/DeliverySummary";
import { DeliveryTable } from "~/components/admin/receive/DeliveryTable";
import { SupplierPicker } from "~/components/admin/receive/SupplierPicker";
import { useDelivery } from "~/components/admin/receive/useDelivery";
import { ButtonLink } from "~/components/ui/ButtonLink";
import { Card } from "~/components/ui/Card";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "~/components/ui/StateBlocks";
import { useToast } from "~/components/ui/ToastProvider";
import { useAsyncData } from "~/components/ui/useAsyncData";
import { formatMoney } from "~/domain/money";
import { t } from "~/i18n/t";
import { supplierRepository } from "~/infrastructure/api/receipt-repository";
import type { Supplier } from "~/use_cases/receive-stock";

function ScanBox(props: {
  onScan: (code: string) => Promise<void>;
  error: string | null;
}) {
  const strings = t().receive;
  const [text, setText] = useState("");
  function submit(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    const code = text;
    setText("");
    void props.onScan(code);
  }
  return (
    <div className="flex flex-col gap-2">
      <label className="flex h-12 items-center gap-2 rounded-input border border-border bg-white px-3.5 text-text-secondary focus-within:ring-2 focus-within:ring-blue">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3M4 12h16" />
        </svg>
        <input
          aria-label={strings.scan}
          placeholder={strings.scanPlaceholder}
          className="h-full min-w-0 flex-grow bg-transparent font-mono text-sm text-text outline-none"
          value={text}
          autoFocus
          onChange={(event) => {
            setText(event.target.value);
          }}
          onKeyDown={submit}
        />
      </label>
      {props.error && (
        <p
          role="alert"
          className="rounded-input bg-error-bg px-3.5 py-2 text-sm font-semibold text-error-text"
        >
          {props.error}
        </p>
      )}
    </div>
  );
}

export default function ReceiveRoute() {
  const strings = t().receive;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const suppliers = useAsyncData(supplierRepository.list);
  const [added, setAdded] = useState<Supplier[]>([]);
  const delivery = useDelivery((result) => {
    showToast(strings.done(formatMoney(result.totalCost)));
    void navigate("/admin/inventory");
  });
  const supplierList =
    suppliers.state.status === "ready"
      ? [...suppliers.state.data, ...added]
      : added;

  return (
    <div className="flex max-w-[1136px] flex-col gap-5">
      <PageHeader
        title={strings.title}
        subtitle={strings.subtitle}
        actions={
          <ButtonLink to="/admin/inventory" variant="secondary">
            {strings.cancel}
          </ButtonLink>
        }
      />
      {suppliers.state.status === "error" && (
        <Card>
          <ErrorState onRetry={suppliers.reload} />
        </Card>
      )}
      {suppliers.state.status === "loading" && (
        <Card>
          <LoadingState />
        </Card>
      )}
      {suppliers.state.status === "ready" && (
        <Card className="grid grid-cols-3 gap-4 p-5">
          <SupplierPicker
            repo={supplierRepository}
            suppliers={supplierList}
            value={delivery.supplierId}
            onChange={delivery.setSupplierId}
            onAdded={(supplier) => {
              setAdded((current) => [...current, supplier]);
              delivery.setSupplierId(supplier.id);
            }}
          />
          <Field label={strings.invoice} htmlFor="invoice">
            <input
              id="invoice"
              className={monoFieldClass}
              value={delivery.invoiceNo}
              onChange={(event) => {
                delivery.setInvoiceNo(event.target.value);
              }}
            />
          </Field>
          <Field label={strings.date} htmlFor="delivery-date">
            <input
              id="delivery-date"
              type="date"
              className={fieldClass}
              value={delivery.deliveryDate}
              onChange={(event) => {
                delivery.setDeliveryDate(event.target.value);
              }}
            />
          </Field>
        </Card>
      )}
      <div className="grid grid-cols-[1fr_320px] items-start gap-5">
        <div className="flex flex-col gap-4">
          <ScanBox onScan={delivery.scan} error={delivery.scanError} />
          {delivery.lines.length === 0 ? (
            <Card>
              <EmptyState
                title={strings.empty.title}
                hint={strings.empty.hint}
              />
            </Card>
          ) : (
            <DeliveryTable
              lines={delivery.lines}
              onChange={delivery.changeLine}
              onRemove={delivery.removeLine}
            />
          )}
        </div>
        <DeliverySummary
          lines={delivery.lines}
          pending={delivery.pending}
          error={delivery.error}
          onConfirm={() => {
            void delivery.confirm();
          }}
        />
      </div>
    </div>
  );
}
