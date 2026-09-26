import type { InputHTMLAttributes } from "react";

import type { Category } from "~/domain/category";
import { PRODUCT_UNITS } from "~/domain/product";
import { t } from "~/i18n/t";

import { Field, fieldClass, monoFieldClass } from "../FormField";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  mono?: boolean;
  onValue: (value: string) => void;
}

export function TextField(props: TextFieldProps) {
  const { id, label, error, mono = false, onValue, ...inputProps } = props;
  return (
    <Field label={label} htmlFor={id} error={error}>
      <input
        id={id}
        className={mono ? monoFieldClass : fieldClass}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => {
          onValue(event.target.value);
        }}
        {...inputProps}
      />
    </Field>
  );
}

interface CategorySelectProps {
  id: string;
  categories: Category[];
  value: number | null;
  error?: string;
  onValue: (categoryId: number | null) => void;
}

export function CategorySelect(props: CategorySelectProps) {
  const strings = t().productForm;
  return (
    <Field label={strings.category} htmlFor={props.id} error={props.error}>
      <select
        id={props.id}
        className={fieldClass}
        value={props.value ?? ""}
        aria-invalid={props.error ? true : undefined}
        onChange={(event) => {
          const value = event.target.value;
          props.onValue(value === "" ? null : Number(value));
        }}
      >
        <option value="">{strings.chooseCategory}</option>
        {props.categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </Field>
  );
}

interface UnitSelectProps {
  id: string;
  value: string;
  onValue: (unit: string) => void;
}

export function UnitSelect({ id, value, onValue }: UnitSelectProps) {
  return (
    <Field label={t().productForm.unit} htmlFor={id}>
      <select
        id={id}
        className={fieldClass}
        value={value}
        onChange={(event) => {
          onValue(event.target.value);
        }}
      >
        {PRODUCT_UNITS.map((unit) => (
          <option key={unit} value={unit}>
            {unit}
          </option>
        ))}
      </select>
    </Field>
  );
}
