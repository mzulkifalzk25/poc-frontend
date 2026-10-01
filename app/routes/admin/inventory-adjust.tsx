import { useCallback, useMemo, useState } from "react";

import {
  Field,
  fieldClass,
  monoFieldClass,
} from "~/components/admin/FormField";
import {
  useAdjustProductId,
  useInventoryOutlet,
} from "~/components/admin/inventory/inventoryOutlet";
import { writeErrorMessage } from "~/components/admin/writeError";
import { Button } from "~/components/ui/Button";
import { Dialog } from "~/components/ui/Dialog";
import { ErrorState, LoadingState } from "~/components/ui/StateBlocks";
import { useToast } from "~/components/ui/ToastProvider";
import { useAsyncData } from "~/components/ui/useAsyncData";
import {
  ADJUST_MODES,
  ADJUST_REASONS,
  stockAfter,
  type AdjustDraft,
  type AdjustMode,
  type AdjustReason,
} from "~/domain/adjustment";
import { formatQuantity, type ProductDetail } from "~/domain/product";
import { t } from "~/i18n/t";
import { productRepository } from "~/infrastructure/api/product-repository";
import { stockRepository } from "~/infrastructure/api/stock-repository";
import { adjustStock } from "~/use_cases/manage-stock";

const INITIAL: AdjustDraft = {
  mode: "add",
  qty: "",
  reason: "received",
  note: "",
};

function ModeToggle(props: {
  value: AdjustMode;
  onChange: (mode: AdjustMode) => void;
}) {
  const strings = t().adjust;
  return (
    <div
      role="group"
      aria-label={strings.modeLabel}
      className="grid grid-cols-3 gap-1 rounded-input bg-off-white p-1"
    >
      {ADJUST_MODES.map((mode) => (
        <button
          key={mode}
          type="button"
          aria-pressed={props.value === mode}
          className={`h-10 rounded-[8px] text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none ${props.value === mode ? "bg-white text-text shadow-sm" : "text-text-secondary hover:text-text"}`}
          onClick={() => {
            props.onChange(mode);
          }}
        >
          {strings.modes[mode]}
        </button>
      ))}
    </div>
  );
}

function AdjustForm({ product }: { product: ProductDetail }) {
  const strings = t().adjust;
  const { reload, close } = useInventoryOutlet();
  const { showToast } = useToast();
  const [draft, setDraft] = useState(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const key = useMemo(() => crypto.randomUUID(), []);
  const after = stockAfter(draft.mode, draft.qty, product.stock);

  async function save() {
    setPending(true);
    setFormError(null);
    const outcome = await adjustStock(stockRepository, product.id, draft, key);
    setPending(false);
    if (outcome.status === "rejected") {
      setError(strings.errors[outcome.error]);
    } else if (outcome.status === "done") {
      showToast(strings.saved(product.name));
      reload();
      close();
    } else if (outcome.status === "invalid") {
      setError(Object.values(outcome.fields)[0] ?? null);
    } else {
      setFormError(writeErrorMessage(outcome));
    }
  }

  return (
    <Dialog
      title={strings.title}
      onClose={close}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            {t().common.cancel}
          </Button>
          <Button
            disabled={pending}
            onClick={() => {
              void save();
            }}
          >
            {pending ? t().common.saving : strings.save}
          </Button>
        </>
      }
    >
      <p>
        {product.name} · <span className="font-mono">{product.barcode}</span>
      </p>
      <ModeToggle
        value={draft.mode}
        onChange={(mode) => {
          setDraft({ ...draft, mode });
        }}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label={strings.quantity}
          htmlFor="adjust-qty"
          error={error ?? undefined}
        >
          <input
            id="adjust-qty"
            inputMode="decimal"
            className={monoFieldClass}
            value={draft.qty}
            aria-invalid={error !== null}
            onChange={(event) => {
              setError(null);
              setDraft({ ...draft, qty: event.target.value });
            }}
          />
        </Field>
        <Field label={strings.reason} htmlFor="adjust-reason">
          <select
            id="adjust-reason"
            className={fieldClass}
            value={draft.reason}
            onChange={(event) => {
              setDraft({
                ...draft,
                reason: event.target.value as AdjustReason,
              });
            }}
          >
            {ADJUST_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {t().inventory.reasons[reason]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label={strings.note} htmlFor="adjust-note">
        <input
          id="adjust-note"
          className={fieldClass}
          placeholder={strings.notePlaceholder}
          value={draft.note}
          maxLength={255}
          onChange={(event) => {
            setDraft({ ...draft, note: event.target.value });
          }}
        />
      </Field>
      <p className="flex items-center justify-between rounded-input bg-off-white px-3.5 py-3 text-sm font-semibold text-text">
        <span>{strings.after}</span>
        <span className="font-mono text-base">
          {formatQuantity(product.stock)} →{" "}
          {after === null ? "–" : formatQuantity(String(after))}
        </span>
      </p>
      {formError && (
        <p
          role="alert"
          className="rounded-input bg-error-bg px-3.5 py-2.5 font-semibold text-error-text"
        >
          {formError}
        </p>
      )}
    </Dialog>
  );
}

export default function InventoryAdjustRoute() {
  const productId = useAdjustProductId();
  const { close } = useInventoryOutlet();
  const load = useCallback(
    () =>
      productId === null
        ? Promise.reject(new Error("no product"))
        : productRepository.get(productId),
    [productId],
  );
  const { state, reload } = useAsyncData(load);
  if (state.status === "ready") {
    return <AdjustForm product={state.data} />;
  }
  return (
    <Dialog
      title={t().adjust.title}
      onClose={close}
      footer={
        <Button variant="secondary" onClick={close}>
          {t().common.close}
        </Button>
      }
    >
      {state.status === "loading" ? (
        <LoadingState />
      ) : (
        <ErrorState onRetry={reload} />
      )}
    </Dialog>
  );
}
