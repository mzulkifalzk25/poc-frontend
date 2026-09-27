import type { ActivationCode, Counter, CounterDraft } from "~/domain/counter";

import { runAdminWrite, type WriteOutcome } from "./admin-write";

export interface CounterRepository {
  list: () => Promise<Counter[]>;
  create: (draft: CounterDraft) => Promise<Counter>;
  generateCode: (counterId: number) => Promise<ActivationCode>;
  revokeCode: (counterId: number) => Promise<void>;
  deactivate: (counterId: number) => Promise<void>;
}

export function createCounter(
  repo: CounterRepository,
  draft: CounterDraft,
): Promise<WriteOutcome<Counter>> {
  const name = draft.name.trim().replace(/\s+/g, " ");
  return runAdminWrite(() => repo.create({ name, code: draft.code }));
}

// A new code replaces any unused one; the plain code is shown once.
export function generateActivationCode(
  repo: CounterRepository,
  counterId: number,
): Promise<WriteOutcome<ActivationCode>> {
  return runAdminWrite(() => repo.generateCode(counterId));
}

export function revokeActivationCode(
  repo: CounterRepository,
  counterId: number,
): Promise<WriteOutcome<undefined>> {
  return runAdminWrite(async () => {
    await repo.revokeCode(counterId);
    return undefined;
  });
}

// Refused with the conflict `shift_open` while the counter has an open shift.
export function deactivateCounter(
  repo: CounterRepository,
  counterId: number,
): Promise<WriteOutcome<undefined>> {
  return runAdminWrite(async () => {
    await repo.deactivate(counterId);
    return undefined;
  });
}
