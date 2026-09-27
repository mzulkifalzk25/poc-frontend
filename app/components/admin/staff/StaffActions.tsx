import { Button } from "~/components/ui/Button";
import { isPinDelayed, type StaffMember } from "~/domain/staff";
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
          actions.open({ kind: "resetPin", member });
        }}
      >
        {strings.resetPin}
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

export function UnlockControl({
  member,
  now,
  actions,
}: {
  member: StaffMember;
  now: Date;
  actions: Actions;
}) {
  const strings = t().staff.actions;
  if (!isPinDelayed(member, now)) {
    return null;
  }
  return (
    <>
      <span className="rounded-pill bg-warning-bg px-[9px] py-1 text-xs font-bold text-warning">
        {strings.pinDelayed}
      </span>
      <button
        type="button"
        aria-label={strings.unlockName(member.fullName)}
        disabled={actions.pending}
        className="rounded text-[13px] font-semibold text-blue hover:underline focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none disabled:opacity-50"
        onClick={() => void actions.unlock(member)}
      >
        {strings.unlock}
      </button>
    </>
  );
}
