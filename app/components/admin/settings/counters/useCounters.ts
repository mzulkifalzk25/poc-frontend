import { useState } from "react";

import {
  counterDraftErrors,
  type ActivationCode,
  type Counter,
  type CounterDraft,
} from "~/domain/counter";
import { t } from "~/i18n/t";
import type { WriteOutcome } from "~/use_cases/admin-write";
import {
  createCounter,
  deactivateCounter,
  generateActivationCode,
  revokeActivationCode,
  type CounterRepository,
} from "~/use_cases/manage-counters";

import { writeErrorMessage } from "../../writeError";

export interface ShownCode extends ActivationCode {
  counterName: string;
}

interface CounterOptions {
  repo: CounterRepository;
  onChanged: () => void;
  notify: (message: string, failed?: boolean) => void;
}

function addFormErrors(draft: CounterDraft): Record<string, string> {
  const strings = t().settings.counters.add;
  const errors = counterDraftErrors(draft);
  const fields: Record<string, string> = {};
  if (errors.name) {
    fields.name = strings.nameRequired;
  }
  if (errors.code) {
    fields.code = strings.codeRule;
  }
  return fields;
}

export function useCounters({ repo, onChanged, notify }: CounterOptions) {
  const strings = t().settings.counters;
  const [code, setCode] = useState<ShownCode | null>(null);
  const [deactivating, setDeactivating] = useState<Counter | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState(0);
  const [pending, setPending] = useState(false);

  async function run<T>(
    write: () => Promise<WriteOutcome<T>>,
    onDone: (value: T) => void,
    onFailed: (outcome: WriteOutcome<T>) => void,
  ) {
    setPending(true);
    const outcome = await write();
    setPending(false);
    if (outcome.status === "done") {
      onDone(outcome.value);
      onChanged();
    } else {
      onFailed(outcome);
    }
  }

  const toastFailure = (outcome: WriteOutcome<unknown>) => {
    notify(writeErrorMessage(outcome) ?? t().admin.errors.failed, true);
  };

  return {
    code,
    deactivating,
    dialogError,
    addErrors,
    addFormKey: created,
    pending,
    newCode: (counter: Counter) =>
      run(
        () => generateActivationCode(repo, counter.id),
        (issued) => {
          setCode({ ...issued, counterName: counter.name });
        },
        toastFailure,
      ),
    revokeCode: (shown: ShownCode) =>
      run(
        () => revokeActivationCode(repo, shown.counterId),
        () => {
          setCode(null);
          notify(strings.code.revoked(shown.counterName));
        },
        toastFailure,
      ),
    askDeactivate: (counter: Counter | null) => {
      setDialogError(null);
      setDeactivating(counter);
    },
    confirmDeactivate: (counter: Counter) =>
      run(
        () => deactivateCounter(repo, counter.id),
        () => {
          setDeactivating(null);
          notify(strings.deactivateConfirm.done(counter.name));
        },
        (outcome) => {
          setDialogError(writeErrorMessage(outcome) ?? t().admin.errors.failed);
        },
      ),
    create: (draft: CounterDraft) => {
      const local = addFormErrors(draft);
      setAddErrors(local);
      if (Object.keys(local).length > 0) {
        return Promise.resolve();
      }
      return run(
        () => createCounter(repo, draft),
        (counter) => {
          setCreated((total) => total + 1);
          notify(strings.add.created(counter.name));
        },
        (outcome) => {
          if (outcome.status === "conflict" && outcome.code === "code_exists") {
            setAddErrors({ code: outcome.message });
          } else if (outcome.status === "invalid") {
            setAddErrors(outcome.fields);
          } else {
            toastFailure(outcome);
          }
        },
      );
    },
  };
}
