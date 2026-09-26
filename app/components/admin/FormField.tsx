import type { ReactNode } from "react";

export const fieldClass =
  "h-[46px] w-full rounded-input border border-border-strong bg-white px-3.5 text-[15px] text-text outline-none transition focus:border-2 focus:border-blue focus-visible:ring-0 disabled:opacity-50 read-only:bg-off-white aria-invalid:border-error";

export const monoFieldClass = `${fieldClass} font-mono`;

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, children }: FieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-text">
        {label}
      </label>
      {children}
      {error && (
        <p
          id={`${htmlFor}-error`}
          className="rounded-md bg-error-bg px-2 py-1 text-xs font-semibold text-error-text"
        >
          {error}
        </p>
      )}
    </div>
  );
}
