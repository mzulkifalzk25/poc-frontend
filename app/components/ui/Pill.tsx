import type { ReactNode } from "react";

export type PillTone = "neutral" | "success" | "warning" | "error" | "info";

interface PillProps {
  tone?: PillTone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

const toneClasses: Record<PillTone, string> = {
  neutral: "bg-border text-text-secondary",
  success: "bg-success-bg text-success-text",
  warning: "bg-warning-bg text-warning",
  error: "bg-error-bg text-error-text",
  info: "bg-blue-mid/10 text-blue",
};

const dotClasses: Record<PillTone, string> = {
  neutral: "bg-text-secondary",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
  info: "bg-blue",
};

export function Pill({
  tone = "neutral",
  dot = false,
  children,
  className,
}: PillProps) {
  return (
    <span
      className={`inline-flex h-9 items-center gap-2 rounded-pill px-3.5 text-sm font-semibold ${toneClasses[tone]} ${className ?? ""}`}
    >
      {dot && <span className={`h-2 w-2 rounded-full ${dotClasses[tone]}`} />}
      {children}
    </span>
  );
}
