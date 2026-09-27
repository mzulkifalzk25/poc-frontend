import { useState } from "react";

import { Button } from "~/components/ui/Button";
import type { CounterDraft } from "~/domain/counter";
import { t } from "~/i18n/t";

import { Field, fieldClass, monoFieldClass } from "../../FormField";

interface AddCounterFormProps {
  pending: boolean;
  errors: Record<string, string>;
  onCreate: (draft: CounterDraft) => void;
}

export function AddCounterForm({
  pending,
  errors,
  onCreate,
}: AddCounterFormProps) {
  const strings = t().settings.counters.add;
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  return (
    <form
      noValidate
      className="flex flex-col gap-3 border-t border-border pt-5"
      onSubmit={(event) => {
        event.preventDefault();
        onCreate({ name, code });
      }}
    >
      <h3 className="text-[13px] font-semibold">{strings.title}</h3>
      <div className="grid items-start gap-3 sm:grid-cols-[1fr_180px_auto]">
        <Field label={strings.name} htmlFor="counter-name" error={errors.name}>
          <input
            id="counter-name"
            className={fieldClass}
            value={name}
            placeholder={strings.namePlaceholder}
            aria-invalid={errors.name ? true : undefined}
            onChange={(event) => {
              setName(event.target.value);
            }}
          />
        </Field>
        <Field label={strings.code} htmlFor="counter-code" error={errors.code}>
          <input
            id="counter-code"
            className={monoFieldClass}
            value={code}
            maxLength={3}
            inputMode="numeric"
            placeholder={strings.codePlaceholder}
            aria-invalid={errors.code ? true : undefined}
            onChange={(event) => {
              setCode(event.target.value.replace(/[^0-9]/g, ""));
            }}
          />
        </Field>
        <Button
          type="submit"
          size="lg"
          className="sm:mt-[22px]"
          disabled={pending}
        >
          {strings.create}
        </Button>
      </div>
      <p className="text-[13px] text-text-secondary">{strings.hint}</p>
    </form>
  );
}
