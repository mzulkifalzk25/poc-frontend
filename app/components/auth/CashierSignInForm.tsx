import { useState } from "react";

import { Input } from "~/components/ui/Input";

const personIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const lockIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="5" y="11" width="14" height="10" rx="2.4" />
    <path d="M8 11V8a4 4 0 018 0v3" />
  </svg>
);

function EyeToggle({
  shown,
  onToggle,
  label,
}: {
  shown: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center border-0 bg-transparent p-0 text-[#34445A]"
    >
      {shown ? (
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ) : (
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 3l18 18M10.6 5.1A10 10 0 0112 5c6.4 0 10 7 10 7a17 17 0 01-3.2 4M6.6 6.7C3.9 8.5 2 12 2 12s3.6 7 10 7c1.7 0 3.2-.4 4.5-1" />
          <path d="M9.9 9.9a3 3 0 004.2 4.2" />
        </svg>
      )}
    </button>
  );
}

export interface CashierSignInFormProps {
  counterLabel: string;
  onSubmit: (name: string, pin: string) => void;
  pending: boolean;
  error: string | null;
}

export function CashierSignInForm({
  counterLabel,
  onSubmit,
  pending,
  error,
}: CashierSignInFormProps) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [pinShown, setPinShown] = useState(false);

  return (
    <form
      className="flex flex-col gap-3.5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(name, pin);
      }}
    >
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-text">Counter</span>
        <div className="flex h-[46px] items-center rounded-input border border-border bg-border/40 px-3.5 text-sm text-text-secondary">
          {counterLabel}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="cashier-name"
          className="text-sm font-semibold text-text"
        >
          Cashier name
        </label>
        <Input
          id="cashier-name"
          type="text"
          placeholder="Enter your name"
          autoComplete="off"
          leadingIcon={personIcon}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="cashier-pin"
          className="text-sm font-semibold text-text"
        >
          PIN
        </label>
        <Input
          id="cashier-pin"
          type={pinShown ? "text" : "password"}
          inputMode="numeric"
          maxLength={4}
          placeholder="Enter your 4-digit PIN"
          leadingIcon={lockIcon}
          value={pin}
          onChange={(event) => {
            setPin(event.target.value.replace(/\D/g, "").slice(0, 4));
          }}
          trailingSlot={
            <EyeToggle
              shown={pinShown}
              onToggle={() => {
                setPinShown((current) => !current);
              }}
              label="Show or hide PIN"
            />
          }
        />
      </div>
      {error && (
        <p className="rounded-input bg-error-bg px-3 py-2 text-sm text-error-text">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || name.trim() === "" || pin.length !== 4}
        className="mt-1 flex h-[50px] items-center justify-center gap-2.5 rounded-input bg-blue text-base font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign In"}
        {!pending && (
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
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        )}
      </button>
    </form>
  );
}
