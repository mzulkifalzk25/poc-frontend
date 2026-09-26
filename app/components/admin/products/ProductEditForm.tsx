import { useId, useState, type ReactNode } from "react";
import { Link } from "react-router";

import { Button } from "~/components/ui/Button";
import { Drawer } from "~/components/ui/Drawer";
import type { AsyncState } from "~/components/ui/useAsyncData";
import type { Category } from "~/domain/category";
import {
  formatQuantity,
  type PriceChange,
  type ProductDetail,
} from "~/domain/product";
import type { ProductEditDraft } from "~/domain/product-draft";
import { t } from "~/i18n/t";

import { fieldClass, Field } from "../FormField";
import type { FieldMessages } from "./fieldMessages";
import { PriceHistoryBox, ProfitLine } from "./ProductExtras";
import { CategorySelect, TextField, UnitSelect } from "./productFields";

interface ProductEditFormProps {
  product: ProductDetail;
  categories: Category[];
  history: AsyncState<PriceChange[]>;
  pending: boolean;
  error: string | null;
  errors: FieldMessages;
  onSubmit: (draft: ProductEditDraft) => void;
  onClose: () => void;
  notice?: ReactNode;
  extraActions?: ReactNode;
}

function initialDraft(product: ProductDetail): ProductEditDraft {
  return {
    name: product.name,
    categoryId: product.categoryId,
    unit: product.unit,
    price: String(Number(product.price)),
    cost: String(Number(product.cost ?? "0")),
    lowStockAlert: String(Number(product.lowStockAlert)),
  };
}

export function ProductEditForm(props: ProductEditFormProps) {
  const { product, errors } = props;
  const strings = t().productEdit;
  const formId = useId();
  const [draft, setDraft] = useState(() => initialDraft(product));
  const set = (changes: Partial<ProductEditDraft>) => {
    setDraft((current) => ({ ...current, ...changes }));
  };

  return (
    <Drawer
      title={strings.title}
      subtitle={<span className="font-mono">{product.barcode}</span>}
      onClose={props.onClose}
      footer={
        <>
          {props.extraActions}
          <Button variant="secondary" size="lg" onClick={props.onClose}>
            {t().common.cancel}
          </Button>
          <Button
            type="submit"
            form={formId}
            size="lg"
            className="flex-grow"
            disabled={props.pending}
          >
            {props.pending ? t().common.saving : strings.save}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        className="flex flex-col gap-3.5"
        onSubmit={(event) => {
          event.preventDefault();
          props.onSubmit(draft);
        }}
      >
        <TextField
          id="product-name"
          label={t().productForm.name}
          value={draft.name}
          error={errors.name}
          onValue={(name) => {
            set({ name });
          }}
        />
        <div className="grid grid-cols-2 gap-3.5">
          <CategorySelect
            id="product-category"
            categories={props.categories}
            value={draft.categoryId}
            error={errors.categoryId}
            onValue={(categoryId) => {
              set({ categoryId });
            }}
          />
          <UnitSelect
            id="product-unit"
            value={draft.unit}
            onValue={(unit) => {
              set({ unit });
            }}
          />
        </div>
        <PriceFields draft={draft} errors={errors} onChange={set} />
        <StockFields
          product={product}
          draft={draft}
          errors={errors}
          onChange={set}
        />
        <PriceHistoryBox state={props.history} />
        {props.error && (
          <p
            role="alert"
            className="rounded-input bg-error-bg px-3.5 py-2.5 text-sm font-semibold text-error-text"
          >
            {props.error}
          </p>
        )}
        {props.notice}
      </form>
    </Drawer>
  );
}

interface DraftFieldsProps {
  draft: ProductEditDraft;
  errors: FieldMessages;
  onChange: (changes: Partial<ProductEditDraft>) => void;
}

function PriceFields({ draft, errors, onChange }: DraftFieldsProps) {
  const strings = t().productForm;
  return (
    <>
      <div className="grid grid-cols-2 gap-3.5">
        <TextField
          id="product-price"
          label={strings.price}
          mono
          inputMode="decimal"
          value={draft.price}
          error={errors.price}
          onValue={(price) => {
            onChange({ price });
          }}
        />
        <TextField
          id="product-cost"
          label={strings.cost}
          mono
          inputMode="decimal"
          value={draft.cost}
          error={errors.cost}
          onValue={(cost) => {
            onChange({ cost });
          }}
        />
      </div>
      <ProfitLine price={draft.price} cost={draft.cost} />
    </>
  );
}

function StockFields({
  product,
  draft,
  errors,
  onChange,
}: DraftFieldsProps & { product: ProductDetail }) {
  const strings = t().productEdit;
  return (
    <div className="grid grid-cols-2 gap-3.5">
      <Field label={strings.stock} htmlFor="product-stock">
        <div className="flex gap-2">
          <input
            id="product-stock"
            className={`${fieldClass} font-mono`}
            value={formatQuantity(product.stock)}
            readOnly
          />
          <Link
            to={`/admin/inventory/adjust?product=${String(product.id)}`}
            className="flex h-[46px] items-center rounded-input border border-border-strong px-3 text-[13px] font-semibold whitespace-nowrap transition hover:bg-off-white focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none active:bg-border"
          >
            {strings.adjust}
          </Link>
        </div>
      </Field>
      <TextField
        id="product-low-stock"
        label={strings.lowStock}
        mono
        inputMode="decimal"
        value={draft.lowStockAlert}
        error={errors.lowStockAlert}
        onValue={(lowStockAlert) => {
          onChange({ lowStockAlert });
        }}
      />
    </div>
  );
}
