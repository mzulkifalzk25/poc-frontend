import type { CashierDraft, StaffMember } from "~/domain/staff";

import { runAdminWrite, type WriteOutcome } from "./admin-write";

export interface StaffChanges {
  fullName?: string;
  defaultCounterId?: number | null;
  isActive?: boolean;
}

export interface StaffRepository {
  list: () => Promise<StaffMember[]>;
  createCashier: (draft: CashierDraft) => Promise<StaffMember>;
  update: (id: number, changes: StaffChanges) => Promise<StaffMember>;
  resetPin: (id: number) => Promise<string>;
  unlock: (id: number) => Promise<void>;
}

function cleanName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function saveCashier(
  repo: StaffRepository,
  id: number | null,
  draft: CashierDraft,
): Promise<WriteOutcome<StaffMember>> {
  const fullName = cleanName(draft.fullName);
  return runAdminWrite(() =>
    id === null
      ? repo.createCashier({ ...draft, fullName })
      : repo.update(id, {
          fullName,
          defaultCounterId: draft.defaultCounterId,
        }),
  );
}

export function setStaffActive(
  repo: StaffRepository,
  id: number,
  isActive: boolean,
): Promise<WriteOutcome<StaffMember>> {
  return runAdminWrite(() => repo.update(id, { isActive }));
}

// The server makes the new PIN and returns it once; it is never stored here.
export function resetCashierPin(
  repo: StaffRepository,
  id: number,
): Promise<WriteOutcome<string>> {
  return runAdminWrite(() => repo.resetPin(id));
}

export function unlockCashier(
  repo: StaffRepository,
  id: number,
): Promise<WriteOutcome<undefined>> {
  return runAdminWrite(async () => {
    await repo.unlock(id);
    return undefined;
  });
}
