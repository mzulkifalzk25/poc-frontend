import { Button } from "~/components/ui/Button";
import type { StaffMember } from "~/domain/staff";
import { t } from "~/i18n/t";

import type { useStaffActions } from "./useStaffActions";

type Actions = ReturnType<typeof useStaffActions>;

export function StaffActionButtons({
  member,
  actions,
}: {
  member: StaffMember;
  actions: Actions;
}) {
  const strings = t().staff.actions;
  return (
    <>
      <Button
        variant="secondary"
        onClick={() => {
          actions.open({ kind: "resetPassword", member });
        }}
      >
        {strings.resetPassword}
      </Button>
      {member.isActive ? (
        <Button
          variant="destructiveOutline"
          onClick={() => {
            actions.open({ kind: "deactivate", member });
          }}
        >
          {strings.deactivate}
        </Button>
      ) : (
        <Button
          variant="secondary"
          disabled={actions.pending}
          onClick={() => void actions.setActive(member, true)}
        >
          {strings.reactivate}
        </Button>
      )}
    </>
  );
}
