import { useId, useState, type ReactNode } from "react";

import { Button } from "~/components/ui/Button";
import { Drawer } from "~/components/ui/Drawer";
import {
  CATEGORY_TINTS,
  categoryLetter,
  isCategoryTint,
  type Category,
  type CategoryDraft,
  type CategoryTint,
} from "~/domain/category";
import { t } from "~/i18n/t";

import { tintClass } from "../categoryTint";
import { Field, fieldClass } from "../FormField";

interface CategoryFormProps {
  category: Category | null;
  defaultTint: CategoryTint;
  pending: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  onSubmit: (draft: CategoryDraft) => void;
  onClose: () => void;
  notice?: ReactNode;
  extraActions?: ReactNode;
}

function initialTint(category: Category | null, fallback: CategoryTint) {
  return category && isCategoryTint(category.tint) ? category.tint : fallback;
}

export function CategoryForm(props: CategoryFormProps) {
  const { category, pending, error, fieldErrors, onClose } = props;
  const strings = t().categories.form;
  const formId = useId();
  const [name, setName] = useState(category?.name ?? "");
  const [tint, setTint] = useState(initialTint(category, props.defaultTint));

  return (
    <Drawer
      title={category ? strings.editTitle : strings.addTitle}
      onClose={onClose}
      footer={
        <>
          {props.extraActions}
          <Button variant="secondary" size="lg" onClick={onClose}>
            {t().common.cancel}
          </Button>
          <Button
            type="submit"
            form={formId}
            size="lg"
            className="flex-grow"
            disabled={pending || name.trim() === ""}
          >
            {pending ? t().common.saving : strings.save}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          props.onSubmit({ name, tint });
        }}
      >
        <Field
          label={strings.name}
          htmlFor="category-name"
          error={fieldErrors.name}
        >
          <input
            id="category-name"
            className={fieldClass}
            value={name}
            placeholder={strings.namePlaceholder}
            aria-invalid={fieldErrors.name ? true : undefined}
            autoFocus
            onChange={(event) => {
              setName(event.target.value);
            }}
          />
        </Field>
        <TintPicker
          value={tint}
          letter={categoryLetter(name)}
          onChange={setTint}
        />
        {error && (
          <p
            role="alert"
            className="rounded-input bg-error-bg px-3.5 py-2.5 text-sm font-semibold text-error-text"
          >
            {error}
          </p>
        )}
        {props.notice}
      </form>
    </Drawer>
  );
}

interface TintPickerProps {
  value: CategoryTint;
  letter: string;
  onChange: (tint: CategoryTint) => void;
}

function TintPicker({ value, letter, onChange }: TintPickerProps) {
  const strings = t().categories.form;
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-[13px] font-semibold">
        {strings.tint}
      </legend>
      <div className="flex flex-wrap gap-2">
        {CATEGORY_TINTS.map((tint) => (
          <label
            key={tint}
            className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-card font-heading text-lg font-bold ring-offset-2 transition hover:brightness-95 has-[:checked]:ring-2 has-[:checked]:ring-gold has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue ${tintClass(tint)}`}
          >
            <input
              type="radio"
              name="category-tint"
              value={tint}
              checked={value === tint}
              aria-label={strings.tintNames[tint]}
              className="sr-only"
              onChange={() => {
                onChange(tint);
              }}
            />
            <span aria-hidden="true">{letter || "A"}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
