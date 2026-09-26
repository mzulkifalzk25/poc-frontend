import { useId, type ReactNode } from "react";

import { closeOnEscape } from "./closeOnEscape";

interface DialogProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}

export function Dialog({ title, onClose, children, footer }: DialogProps) {
  const titleId = useId();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={closeOnEscape(onClose)}
    >
      <div className="absolute inset-0 bg-navy/50" onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex w-[460px] max-w-full flex-col gap-4 rounded-lg bg-white p-6 text-text shadow-[0_24px_60px_rgba(15,39,66,0.25)]"
      >
        <h2
          id={titleId}
          className="font-heading text-[22px] font-bold tracking-[-0.01em]"
        >
          {title}
        </h2>
        <div className="flex flex-col gap-3 text-sm leading-normal text-text-secondary">
          {children}
        </div>
        <div className="flex justify-end gap-2.5 pt-1">{footer}</div>
      </section>
    </div>
  );
}
