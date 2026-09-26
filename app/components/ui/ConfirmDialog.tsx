import type { ReactNode } from "react";

import { t } from "~/i18n/t";

import { Button } from "./Button";
import { Dialog } from "./Dialog";

interface ConfirmDialogProps {
  title: string;
  confirmLabel: string;
  pending: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  children: ReactNode;
}

export function ConfirmDialog({
  title,
  confirmLabel,
  pending,
  error,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" autoFocus onClick={onCancel}>
            {t().common.cancel}
          </Button>
          <Button variant="destructive" disabled={pending} onClick={onConfirm}>
            {pending ? t().common.working : confirmLabel}
          </Button>
        </>
      }
    >
      {children}
      {error && (
        <p
          role="alert"
          className="rounded-input bg-error-bg px-3.5 py-2.5 font-semibold text-error-text"
        >
          {error}
        </p>
      )}
    </Dialog>
  );
}
