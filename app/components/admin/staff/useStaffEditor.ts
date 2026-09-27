import { useState } from "react";

import {
  cashierDraftErrors,
  type CashierDraft,
  type StaffMember,
} from "~/domain/staff";
import { t } from "~/i18n/t";
import { saveCashier, type StaffRepository } from "~/use_cases/manage-staff";

import { writeErrorMessage } from "../writeError";

interface EditorOptions {
  repo: StaffRepository;
  onSaved: (member: StaffMember, created: boolean) => void;
}

function localErrors(draft: CashierDraft, isNew: boolean) {
  const strings = t().staff.form;
  const errors = cashierDraftErrors(draft, isNew);
  const fields: Record<string, string> = {};
  if (errors.fullName) {
    fields.full_name = strings.nameRequired;
  }
  if (errors.login) {
    fields.email = strings.loginRequired;
  }
  if (errors.password) {
    fields.password = strings.passwordRequired;
  }
  return fields;
}

export function useStaffEditor({ repo, onSaved }: EditorOptions) {
  const [member, setMember] = useState<StaffMember | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saves, setSaves] = useState(0);

  function edit(next: StaffMember | null) {
    setMember(next);
    setError(null);
    setFieldErrors({});
  }

  async function submit(draft: CashierDraft) {
    const local = localErrors(draft, member === null);
    setFieldErrors(local);
    setError(null);
    if (Object.keys(local).length > 0) {
      return;
    }
    setPending(true);
    const outcome = await saveCashier(repo, member?.id ?? null, draft);
    setPending(false);
    if (outcome.status === "done") {
      onSaved(outcome.value, member === null);
      setSaves((count) => count + 1);
      edit(null);
    } else if (
      outcome.status === "conflict" &&
      outcome.code === "name_exists"
    ) {
      setFieldErrors({ full_name: outcome.message });
    } else if (
      outcome.status === "conflict" &&
      (outcome.code === "email_exists" || outcome.code === "username_exists")
    ) {
      setFieldErrors({
        [outcome.code === "email_exists" ? "email" : "username"]:
          outcome.message,
      });
    } else {
      setError(writeErrorMessage(outcome));
      setFieldErrors(outcome.status === "invalid" ? outcome.fields : {});
    }
  }

  // A new key after each save or switch gives the form fresh, empty fields.
  const formKey = `${String(member?.id ?? "new")}-${String(saves)}`;

  return { member, pending, error, fieldErrors, formKey, edit, submit };
}
