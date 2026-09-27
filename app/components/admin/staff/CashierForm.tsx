import { useState, type ReactNode } from "react";

import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import type { Counter } from "~/domain/counter";
import type { CashierDraft, StaffMember } from "~/domain/staff";
import { t } from "~/i18n/t";

import { Field, fieldClass } from "../FormField";

interface CashierFormProps {
  member: StaffMember | null;
  counters: Counter[];
  pending: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  onSubmit: (draft: CashierDraft) => void;
  onCancel: () => void;
  extraActions?: ReactNode;
}

function parseCounterId(value: string): number | null {
  return value === "" ? null : Number(value);
}

export function CashierForm(props: CashierFormProps) {
  const { member, counters, pending, error, fieldErrors } = props;
  const strings = t().staff.form;
  const [fullName, setFullName] = useState(member?.fullName ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [username, setUsername] = useState(member?.username ?? "");
  const [password, setPassword] = useState("");
  const [counterId, setCounterId] = useState(member?.defaultCounterId ?? null);

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-bold">
          {member ? strings.editTitle : strings.addTitle}
        </h2>
        <p className="text-[13px] text-text-secondary">
          {member ? strings.editHint : strings.hint}
        </p>
      </div>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          props.onSubmit({
            fullName,
            email,
            username,
            password,
            defaultCounterId: counterId,
          });
        }}
      >
        <Field
          label={strings.fullName}
          htmlFor="cashier-name"
          error={fieldErrors.full_name}
        >
          <input
            id="cashier-name"
            className={fieldClass}
            value={fullName}
            placeholder={strings.fullNamePlaceholder}
            aria-invalid={fieldErrors.full_name ? true : undefined}
            onChange={(event) => {
              setFullName(event.target.value);
            }}
          />
        </Field>
        {!member && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label={strings.email}
                htmlFor="cashier-email"
                error={fieldErrors.email}
              >
                <input
                  id="cashier-email"
                  type="email"
                  autoComplete="off"
                  className={fieldClass}
                  value={email}
                  placeholder={strings.emailPlaceholder}
                  aria-invalid={fieldErrors.email ? true : undefined}
                  onChange={(event) => {
                    setEmail(event.target.value);
                  }}
                />
              </Field>
              <Field
                label={strings.username}
                htmlFor="cashier-username"
                error={fieldErrors.username}
              >
                <input
                  id="cashier-username"
                  autoComplete="off"
                  className={fieldClass}
                  value={username}
                  placeholder={strings.usernamePlaceholder}
                  aria-invalid={fieldErrors.username ? true : undefined}
                  onChange={(event) => {
                    setUsername(event.target.value);
                  }}
                />
              </Field>
            </div>
            <Field
              label={strings.password}
              htmlFor="cashier-password"
              error={fieldErrors.password}
            >
              <input
                id="cashier-password"
                type="password"
                autoComplete="new-password"
                className={fieldClass}
                value={password}
                placeholder={strings.passwordPlaceholder}
                aria-invalid={fieldErrors.password ? true : undefined}
                onChange={(event) => {
                  setPassword(event.target.value);
                }}
              />
            </Field>
          </>
        )}
        <Field
          label={strings.defaultCounter}
          htmlFor="cashier-counter"
          error={fieldErrors.default_counter_id}
        >
          <select
            id="cashier-counter"
            className={fieldClass}
            value={counterId === null ? "" : String(counterId)}
            onChange={(event) => {
              setCounterId(parseCounterId(event.target.value));
            }}
          >
            <option value="">{strings.noDefault}</option>
            {counters.map((counter) => (
              <option key={counter.id} value={counter.id}>
                {counter.name}
              </option>
            ))}
          </select>
        </Field>
        {error && (
          <p
            role="alert"
            className="rounded-input bg-error-bg px-3.5 py-2.5 text-sm font-semibold text-error-text"
          >
            {error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? t().common.saving : member ? strings.save : strings.create}
        </Button>
        {member && (
          <div className="flex flex-wrap gap-2.5">
            {props.extraActions}
            <Button variant="secondary" onClick={props.onCancel}>
              {t().common.cancel}
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
}
