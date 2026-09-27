import { useState } from "react";

import type { StaffMember } from "~/domain/staff";
import { t } from "~/i18n/t";
import type { WriteOutcome } from "~/use_cases/admin-write";
import {
  resetCashierPin,
  setStaffActive,
  unlockCashier,
  type StaffRepository,
} from "~/use_cases/manage-staff";

import { writeErrorMessage } from "../writeError";

export type StaffDialog =
  | { kind: "resetPin"; member: StaffMember }
  | { kind: "newPin"; member: StaffMember; pin: string }
  | { kind: "deactivate"; member: StaffMember };

interface ActionOptions {
  repo: StaffRepository;
  onChanged: (message: string) => void;
  onFailed: (message: string) => void;
}

export function useStaffActions(options: ActionOptions) {
  const { repo, onChanged } = options;
  const strings = t().staff;
  const [dialog, setDialog] = useState<StaffDialog | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run<T>(
    write: () => Promise<WriteOutcome<T>>,
    onDone: (value: T) => void,
  ) {
    setPending(true);
    setError(null);
    const outcome = await write();
    setPending(false);
    if (outcome.status === "done") {
      onDone(outcome.value);
      return;
    }
    const message = writeErrorMessage(outcome) ?? t().admin.errors.failed;
    // Without an open dialog there is nowhere inline to show the message.
    if (dialog === null) {
      options.onFailed(message);
    } else {
      setError(message);
    }
  }

  function open(next: StaffDialog | null) {
    setError(null);
    setDialog(next);
  }

  return {
    dialog,
    pending,
    error,
    open,
    close: () => {
      open(null);
    },
    resetPin: (member: StaffMember) =>
      run(
        () => resetCashierPin(repo, member.id),
        (pin) => {
          open({ kind: "newPin", member, pin });
        },
      ),
    setActive: (member: StaffMember, isActive: boolean) =>
      run(
        () => setStaffActive(repo, member.id, isActive),
        () => {
          open(null);
          const name = member.fullName;
          onChanged(
            isActive ? strings.reactivated(name) : strings.deactivated(name),
          );
        },
      ),
    unlock: (member: StaffMember) =>
      run(
        () => unlockCashier(repo, member.id),
        () => {
          onChanged(strings.unlocked(member.fullName));
        },
      ),
  };
}
