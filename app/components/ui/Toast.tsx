import type { PillTone } from "./Pill";

export interface ToastMessage {
  id: string;
  tone: PillTone;
  text: string;
}

const toneClasses: Record<PillTone, string> = {
  neutral: "bg-border text-text-secondary",
  success: "bg-success-bg text-success-text",
  warning: "bg-warning-bg text-warning",
  error: "bg-error-bg text-error-text",
  info: "bg-blue-mid/10 text-blue",
};

export function Toast({ tone, text }: ToastMessage) {
  return (
    <div
      role="status"
      className={`flex h-10 items-center gap-2 rounded-pill px-4 text-sm font-semibold shadow-lg ${toneClasses[tone]}`}
    >
      {tone === "success" && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12l5 5 9-10" />
        </svg>
      )}
      {text}
    </div>
  );
}
