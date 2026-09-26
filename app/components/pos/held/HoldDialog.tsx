import { useState } from "react";

import { Button } from "~/components/ui/Button";
import { Dialog } from "~/components/ui/Dialog";
import { t } from "~/i18n/t";

interface HoldDialogProps {
  onHold: (title: string) => void;
  onCancel: () => void;
}

export function HoldDialog({ onHold, onCancel }: HoldDialogProps) {
  const strings = t().held;
  const [title, setTitle] = useState("");
  return (
    <Dialog
      title={strings.holdTitle}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" size="lg" onClick={onCancel}>
            {t().common.cancel}
          </Button>
          <Button type="submit" form="hold-form" size="lg">
            {strings.holdConfirm}
          </Button>
        </>
      }
    >
      <form
        id="hold-form"
        className="flex flex-col gap-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          onHold(title);
        }}
      >
        <label
          htmlFor="hold-title"
          className="text-[13px] font-semibold text-text"
        >
          {strings.holdLabel}
        </label>
        <input
          id="hold-title"
          autoFocus
          autoComplete="off"
          value={title}
          placeholder={strings.holdPlaceholder}
          className="h-12 rounded-input border border-border-strong px-3.5 text-base text-text outline-none focus:border-2 focus:border-blue"
          onChange={(event) => {
            setTitle(event.target.value);
          }}
        />
      </form>
    </Dialog>
  );
}
