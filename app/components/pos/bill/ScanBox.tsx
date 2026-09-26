import { useState, type Ref } from "react";

import { t } from "~/i18n/t";

export interface ScanNotice {
  id: number;
  tone: "success" | "warning";
  text: string;
}

interface ScanBoxProps {
  notice: ScanNotice | null;
  onScan: (text: string) => void;
  ref?: Ref<HTMLInputElement>;
}

const noticeClasses = {
  success: "bg-success-bg text-success-text",
  warning: "bg-warning-bg text-warning",
};

// The USB scanner types the code and presses Enter; so does a cashier typing a code.
export function ScanBox({ notice, onScan, ref }: ScanBoxProps) {
  const strings = t().billing;
  const [text, setText] = useState("");
  return (
    <form
      className="flex h-[60px] flex-grow items-center gap-3 rounded-card border-2 border-blue bg-white px-4 focus-within:ring-2 focus-within:ring-blue focus-within:ring-offset-2"
      onSubmit={(event) => {
        event.preventDefault();
        onScan(text);
        setText("");
      }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#174A73"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3M4 12h16" />
      </svg>
      <input
        ref={ref}
        aria-label={strings.scanLabel}
        placeholder={strings.scanPlaceholder}
        autoComplete="off"
        autoFocus
        value={text}
        className="min-w-0 flex-grow bg-transparent text-xl text-text outline-none"
        onChange={(event) => {
          setText(event.target.value);
        }}
      />
      {notice && (
        <span
          key={notice.id}
          role="status"
          className={`flex items-center gap-2 rounded-pill px-3 py-[7px] text-sm font-bold whitespace-nowrap ${noticeClasses[notice.tone]}`}
        >
          {notice.text}
        </span>
      )}
      <kbd className="rounded-md border border-border-strong px-[7px] py-[3px] font-mono text-xs font-semibold text-text-secondary">
        F2
      </kbd>
    </form>
  );
}
