import { useId, type ReactNode } from "react";

import { t } from "~/i18n/t";

import { closeOnEscape } from "./closeOnEscape";

interface DrawerProps {
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function Drawer({
  title,
  subtitle,
  onClose,
  children,
  footer,
}: DrawerProps) {
  const titleId = useId();

  return (
    <div className="fixed inset-0 z-40" onKeyDown={closeOnEscape(onClose)}>
      <div className="absolute inset-0 bg-navy/50" onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-y-0 end-0 flex w-[520px] max-w-full flex-col bg-white text-text shadow-[-12px_0_40px_rgba(15,39,66,0.18)]"
      >
        <header className="flex items-center justify-between px-7 pt-6 pb-4">
          <div className="flex flex-col gap-0.5">
            <h2
              id={titleId}
              className="font-heading text-[26px] font-bold tracking-[-0.02em]"
            >
              {title}
            </h2>
            {subtitle && (
              <div className="text-[13px] text-text-secondary">{subtitle}</div>
            )}
          </div>
          <button
            type="button"
            aria-label={t().common.close}
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-input border border-border transition hover:bg-off-white focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none active:bg-border"
          >
            <CloseIcon />
          </button>
        </header>
        <div className="flex flex-grow flex-col gap-4 overflow-y-auto px-7 pb-4">
          {children}
        </div>
        {footer && (
          <footer className="flex gap-2.5 border-t border-border px-7 pt-[18px] pb-6">
            {footer}
          </footer>
        )}
      </section>
    </div>
  );
}
