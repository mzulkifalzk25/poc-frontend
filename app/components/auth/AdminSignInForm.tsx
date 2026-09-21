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
}: {
  shown: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Show or hide password"
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

export interface AdminSignInFormProps {
  onSubmit: (login: string, password: string, remember: boolean) => void;
  pending: boolean;
  error: string | null;
}

export function AdminSignInForm({
  onSubmit,
  pending,
  error,
}: AdminSignInFormProps) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [passwordShown, setPasswordShown] = useState(false);
  const [remember, setRemember] = useState(true);

  return (
    <form
      className="flex flex-col gap-3.5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(login, password, remember);
      }}
    >
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="admin-login"
          className="text-sm font-semibold text-text"
        >
          Email or username
        </label>
        <Input
          id="admin-login"
          type="text"
          placeholder="Enter your email or username"
          leadingIcon={personIcon}
          value={login}
          onChange={(event) => {
            setLogin(event.target.value);
          }}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="admin-password"
            className="text-sm font-semibold text-text"
          >
            Password
          </label>
          <span className="text-[13px] font-semibold text-blue">
            Forgot password?
          </span>
        </div>
        <Input
          id="admin-password"
          type={passwordShown ? "text" : "password"}
          placeholder="Enter your password"
          leadingIcon={lockIcon}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
          }}
          trailingSlot={
            <EyeToggle
              shown={passwordShown}
              onToggle={() => {
                setPasswordShown((current) => !current);
              }}
            />
          }
        />
      </div>
      <label className="flex items-center gap-2.5 text-sm text-[#34445A]">
        <input
          type="checkbox"
          checked={remember}
          onChange={(event) => {
            setRemember(event.target.checked);
          }}
          className="h-[18px] w-[18px] accent-blue"
        />
        Keep me signed in on this device
      </label>
      <p className="text-xs leading-relaxed text-text-secondary">
        Owners and managers sign in here with a password. Cashiers use their PIN
        at the counter. The owner resets a forgotten password.
      </p>
      {error && (
        <p className="rounded-input bg-error-bg px-3 py-2 text-sm text-error-text">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || login.trim() === "" || password === ""}
        className="mt-1 flex h-[50px] items-center justify-center gap-2.5 rounded-input bg-blue text-base font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign In to Admin"}
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
