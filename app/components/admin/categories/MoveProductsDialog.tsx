import { useState } from "react";

import { Button } from "~/components/ui/Button";
import { Dialog } from "~/components/ui/Dialog";
import type { Category } from "~/domain/category";
import { t } from "~/i18n/t";

import { Field, fieldClass } from "../FormField";

interface MoveProductsDialogProps {
  category: Category;
  categories: Category[];
  pending: boolean;
  error: string | null;
  onMove: (toId: number) => void;
  onCancel: () => void;
}

export function MoveProductsDialog(props: MoveProductsDialogProps) {
  const { category, pending, error, onCancel } = props;
  const strings = t().categories.move;
  const targets = props.categories.filter((item) => item.id !== category.id);
  const [targetId, setTargetId] = useState(targets[0]?.id ?? null);

  return (
    <Dialog
      title={strings.title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            {t().common.cancel}
          </Button>
          <Button
            variant="destructive"
            disabled={pending || targetId === null}
            onClick={() => {
              if (targetId !== null) {
                props.onMove(targetId);
              }
            }}
          >
            {pending ? t().common.working : strings.submit}
          </Button>
        </>
      }
    >
      <p>{strings.body(category.name, category.productCount)}</p>
      {targets.length === 0 ? (
        <p className="font-semibold text-warning">{strings.noTarget}</p>
      ) : (
        <Field label={strings.target} htmlFor="move-target">
          <select
            id="move-target"
            className={fieldClass}
            value={targetId ?? ""}
            autoFocus
            onChange={(event) => {
              setTargetId(Number(event.target.value));
            }}
          >
            {targets.map((target) => (
              <option key={target.id} value={target.id}>
                {target.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-input bg-error-bg px-3.5 py-2.5 font-semibold text-error-text"
        >
          {error}
        </p>
      )}
    </Dialog>
  );
}
