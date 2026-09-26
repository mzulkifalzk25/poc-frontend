import { t } from "~/i18n/t";

import type { ScanPhase } from "./useScanToAdd";

interface ScanStatusProps {
  phase: ScanPhase;
  error: string | null;
  categoryKept: boolean;
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mt-px flex-shrink-0"
    >
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

export function ScanStatus({ phase, error, categoryKept }: ScanStatusProps) {
  const strings = t().scanAdd;
  if (error) {
    return (
      <p
        role="alert"
        className="rounded-input bg-error-bg px-3.5 py-3 text-[13px] font-semibold text-error-text"
      >
        {error}
      </p>
    );
  }
  if (phase === "new") {
    return (
      <div
        role="status"
        className="flex gap-2.5 rounded-input bg-[#E1ECF6] px-3.5 py-3 text-[13px] leading-[1.45] text-blue"
      >
        <CheckIcon />
        <p>
          <b>{strings.newTitle}</b> {strings.newBody}
          {categoryKept && ` ${strings.categoryNote}`}
        </p>
      </div>
    );
  }
  return (
    <p role="status" className="text-[13px] text-text-secondary">
      {phase === "looking" ? strings.lookingUp : strings.start}
    </p>
  );
}
