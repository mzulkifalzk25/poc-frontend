import { Button } from "~/components/ui/Button";
import { ConfirmDialog } from "~/components/ui/ConfirmDialog";
import { Dialog } from "~/components/ui/Dialog";
import { t } from "~/i18n/t";

import type { useStaffActions } from "./useStaffActions";

interface StaffDialogsProps {
  actions: ReturnType<typeof useStaffActions>;
}

export function StaffDialogs({ actions }: StaffDialogsProps) {
  const strings = t().staff;
  const { dialog, pending, error } = actions;
  if (dialog === null) {
    return null;
  }
  const name = dialog.member.fullName;
  if (dialog.kind === "newPassword") {
    return (
      <Dialog
        title={strings.newPassword.title}
        onClose={actions.close}
        footer={
          <Button autoFocus onClick={actions.close}>
            {strings.newPassword.done}
          </Button>
        }
      >
        <p>{strings.newPassword.body(name)}</p>
        <p
          aria-label={strings.newPassword.label}
          className="self-center font-mono text-2xl font-semibold tracking-wide text-text"
        >
          {dialog.password}
        </p>
      </Dialog>
    );
  }
  const reset = dialog.kind === "resetPassword";
  const copy = reset ? strings.resetConfirm : strings.deactivateConfirm;
  return (
    <ConfirmDialog
      title={copy.title(name)}
      confirmLabel={copy.confirm}
      pending={pending}
      error={error}
      onConfirm={() =>
        void (reset
          ? actions.resetPassword(dialog.member)
          : actions.setActive(dialog.member, false))
      }
      onCancel={actions.close}
    >
      <p>{copy.body}</p>
    </ConfirmDialog>
  );
}
