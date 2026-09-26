import { useState } from "react";

import {
  isCompleteActivationCode,
  normalizeActivationCode,
} from "~/domain/activation-code";
import { t } from "~/i18n/t";

import { ArrowIcon, bigButtonClass } from "./shared";

interface ActivateFormProps {
  onSubmit: (code: string) => void;
  pending: boolean;
  error: string | null;
}

export function ActivateForm({ onSubmit, pending, error }: ActivateFormProps) {
  const [code, setCode] = useState("");
  const strings = t().activate;

  return (
    <form
      className="flex flex-1 flex-col justify-between"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(code);
      }}
    >
      <div className="flex flex-col gap-[22px]">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading text-[30px] font-bold tracking-[-0.02em]">
            {strings.title}
          </h1>
          <p className="text-[15px] leading-normal text-text-secondary">
            {strings.hint}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="activation-code" className="text-sm font-semibold">
            {strings.codeLabel}
          </label>
          <input
            id="activation-code"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="XXXX-XXXX"
            value={code}
            aria-invalid={error !== null}
            aria-describedby="activation-code-note"
            onChange={(event) => {
              setCode(normalizeActivationCode(event.target.value));
            }}
            className={`h-[72px] w-full rounded-card border-2 bg-white px-[18px] text-center font-mono text-[32px] font-semibold tracking-[0.14em] text-text outline-none placeholder:text-border focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 ${
              error ? "border-error" : "border-blue"
            }`}
          />
          {error && (
            <p
              role="alert"
              className="rounded-input bg-error-bg px-3 py-2 text-sm text-error-text"
            >
              {error}
            </p>
          )}
          <p
            id="activation-code-note"
            className="text-xs leading-normal text-text-secondary"
          >
            {strings.codeNote}
          </p>
        </div>
      </div>
      <button
        type="submit"
        disabled={pending || !isCompleteActivationCode(code)}
        className={bigButtonClass}
      >
        {pending ? strings.submitting : strings.submit}
        {!pending && <ArrowIcon />}
      </button>
    </form>
  );
}
