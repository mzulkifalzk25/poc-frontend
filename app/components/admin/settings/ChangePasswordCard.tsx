import { useState, type ChangeEvent, type SyntheticEvent } from "react";

import { Field, fieldClass } from "~/components/admin/FormField";
import { writeErrorMessage } from "~/components/admin/writeError";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { useToast } from "~/components/ui/ToastProvider";
import { checkPasswordChange } from "~/domain/password-change";
import { t } from "~/i18n/t";
import type { AccountRepository } from "~/infrastructure/api/account-repository";
import { runAdminWrite } from "~/use_cases/admin-write";

const EMPTY = { current: "", next: "", again: "" };

export function ChangePasswordCard({ repo }: { repo: AccountRepository }) {
  const strings = t().settings.password;
  const { showToast } = useToast();
  const [draft, setDraft] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const change =
    (name: keyof typeof EMPTY) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setDraft((previous) => ({ ...previous, [name]: value }));
    };

  const submit = async (event: SyntheticEvent) => {
    event.preventDefault();
    setFormError(null);
    const problems = checkPasswordChange(draft);
    if (Object.keys(problems).length > 0) {
      setErrors(
        Object.fromEntries(
          Object.entries(problems).map(([name, code]) => [
            name,
            strings.errors[code],
          ]),
        ),
      );
      return;
    }
    setErrors({});
    setPending(true);
    const outcome = await runAdminWrite(() =>
      repo.changePassword(draft.current, draft.next),
    );
    setPending(false);
    if (outcome.status === "done") {
      setDraft(EMPTY);
      showToast(strings.saved, "success");
    } else if (outcome.status === "invalid") {
      setErrors({
        current: outcome.fields.current_password ?? "",
        next: outcome.fields.new_password ?? "",
      });
    } else {
      setFormError(writeErrorMessage(outcome));
    }
  };

  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-bold">{strings.title}</h2>
        <p className="text-sm text-text-secondary">{strings.intro}</p>
      </div>
      <form
        className="flex max-w-[420px] flex-col gap-4"
        onSubmit={(event) => void submit(event)}
        noValidate
      >
        <Field
          label={strings.current}
          htmlFor="current-password"
          error={errors.current}
        >
          <input
            id="current-password"
            type="password"
            autoComplete="current-password"
            className={fieldClass}
            value={draft.current}
            onChange={change("current")}
            aria-invalid={Boolean(errors.current)}
          />
        </Field>
        <Field label={strings.next} htmlFor="new-password" error={errors.next}>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            className={fieldClass}
            value={draft.next}
            onChange={change("next")}
            aria-invalid={Boolean(errors.next)}
          />
        </Field>
        <Field
          label={strings.again}
          htmlFor="new-password-again"
          error={errors.again}
        >
          <input
            id="new-password-again"
            type="password"
            autoComplete="new-password"
            className={fieldClass}
            value={draft.again}
            onChange={change("again")}
            aria-invalid={Boolean(errors.again)}
          />
        </Field>
        {formError && (
          <p role="alert" className="text-sm font-semibold text-error-text">
            {formError}
          </p>
        )}
        <Button type="submit" disabled={pending} className="self-start">
          {strings.submit}
        </Button>
      </form>
    </Card>
  );
}
