import type { ReactNode } from "react";

import { t } from "~/i18n/t";

import { Button } from "./Button";

const blockClass =
  "flex min-h-[220px] flex-col items-center justify-center gap-2 px-6 py-10 text-center";

const iconProps = {
  width: 28,
  height: 28,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function IconTile({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span
      className={`mb-1 flex h-14 w-14 items-center justify-center rounded-card ${tone}`}
    >
      {children}
    </span>
  );
}

interface EmptyStateProps {
  title: string;
  hint?: string;
  action?: ReactNode;
}

export function EmptyState({ title, hint, action }: EmptyStateProps) {
  return (
    <div className={blockClass}>
      <IconTile tone="bg-off-white text-text-secondary">
        <svg {...iconProps}>
          <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
          <path d="M3 7l9 4 9-4M12 11v10" />
        </svg>
      </IconTile>
      <p className="font-semibold text-text">{title}</p>
      {hint && <p className="text-sm text-text-secondary">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  hint?: string;
  onRetry?: () => void;
}

export function ErrorState({ title, hint, onRetry }: ErrorStateProps) {
  const strings = t().states.error;
  return (
    <div role="alert" className={blockClass}>
      <IconTile tone="bg-error-bg text-error-text">
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16h.01" />
        </svg>
      </IconTile>
      <p className="font-semibold text-text">{title ?? strings.title}</p>
      <p className="text-sm text-text-secondary">{hint ?? strings.hint}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-2" onClick={onRetry}>
          {strings.retry}
        </Button>
      )}
    </div>
  );
}

export function LoadingState({ label }: { label?: string }) {
  return (
    <div role="status" className={blockClass}>
      <span className="mb-1 h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-blue" />
      <p className="text-sm text-text-secondary">
        {label ?? t().states.loading}
      </p>
    </div>
  );
}
