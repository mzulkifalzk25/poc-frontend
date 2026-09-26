import type { Category } from "~/domain/category";
import type { NewProductDraft } from "~/domain/product-draft";
import { t } from "~/i18n/t";

import type { FieldMessages } from "../products/fieldMessages";
import {
  CategorySelect,
  TextField,
  UnitSelect,
} from "../products/productFields";

interface NewProductFormProps {
  formId: string;
  draft: NewProductDraft;
  categories: Category[];
  errors: FieldMessages;
  error: string | null;
  onChange: (changes: Partial<NewProductDraft>) => void;
  onSubmit: () => void;
}

export function NewProductForm(props: NewProductFormProps) {
  const { draft, errors, onChange } = props;
  const strings = t().productForm;
  return (
    <form
      id={props.formId}
      noValidate
      className="flex flex-col gap-3.5"
      onSubmit={(event) => {
        event.preventDefault();
        props.onSubmit();
      }}
    >
      <TextField
        id="new-name"
        label={strings.name}
        value={draft.name}
        placeholder={t().scanAdd.namePlaceholder}
        error={errors.name}
        autoFocus
        onValue={(name) => {
          onChange({ name });
        }}
      />
      <div className="grid grid-cols-2 gap-3.5">
        <TextField
          id="new-barcode"
          label={t().scanAdd.usb.label}
          mono
          value={draft.barcode}
          error={errors.barcode}
          readOnly
          onValue={() => undefined}
        />
        <CategorySelect
          id="new-category"
          categories={props.categories}
          value={draft.categoryId}
          error={errors.categoryId}
          onValue={(categoryId) => {
            onChange({ categoryId });
          }}
        />
      </div>
      <MoneyFields {...props} />
      <StockFields {...props} />
      {props.error && (
        <p
          role="alert"
          className="rounded-input bg-error-bg px-3.5 py-2.5 text-sm font-semibold text-error-text"
        >
          {props.error}
        </p>
      )}
    </form>
  );
}

function MoneyFields({ draft, errors, onChange }: NewProductFormProps) {
  const strings = t().productForm;
  return (
    <div className="grid grid-cols-2 gap-3.5">
      <TextField
        id="new-price"
        label={strings.price}
        mono
        inputMode="decimal"
        placeholder="0"
        value={draft.price}
        error={errors.price}
        onValue={(price) => {
          onChange({ price });
        }}
      />
      <TextField
        id="new-cost"
        label={strings.cost}
        mono
        inputMode="decimal"
        placeholder="0"
        value={draft.cost}
        error={errors.cost}
        onValue={(cost) => {
          onChange({ cost });
        }}
      />
    </div>
  );
}

function StockFields({ draft, errors, onChange }: NewProductFormProps) {
  const strings = t().scanAdd;
  return (
    <div className="grid grid-cols-3 gap-3.5">
      <TextField
        id="new-stock"
        label={strings.stock}
        mono
        inputMode="decimal"
        placeholder="0"
        value={draft.stock}
        error={errors.stock}
        onValue={(stock) => {
          onChange({ stock });
        }}
      />
      <TextField
        id="new-low-stock"
        label={strings.lowStock}
        mono
        inputMode="decimal"
        value={draft.lowStockAlert}
        error={errors.lowStockAlert}
        onValue={(lowStockAlert) => {
          onChange({ lowStockAlert });
        }}
      />
      <UnitSelect
        id="new-unit"
        value={draft.unit}
        onValue={(unit) => {
          onChange({ unit });
        }}
      />
    </div>
  );
}
