import { useState } from "react";

import { Button } from "~/components/ui/Button";
import { t } from "~/i18n/t";
import { runAdminWrite } from "~/use_cases/admin-write";
import type { Supplier, SupplierRepository } from "~/use_cases/receive-stock";

import { Field, fieldClass } from "../FormField";
import { writeErrorMessage } from "../writeError";

interface SupplierPickerProps {
  repo: SupplierRepository;
  suppliers: Supplier[];
  value: number | null;
  onChange: (id: number | null) => void;
  onAdded: (supplier: Supplier) => void;
}

function AddSupplier(props: {
  repo: SupplierRepository;
  onAdded: (supplier: Supplier) => void;
  onCancel: () => void;
}) {
  const strings = t().receive;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save() {
    if (name.trim() === "") {
      setError(t().receive.errors.no_supplier);
      return;
    }
    setPending(true);
    const outcome = await runAdminWrite(() =>
      props.repo.create(name.trim(), phone.trim()),
    );
    setPending(false);
    if (outcome.status === "done") {
      props.onAdded(outcome.value);
    } else if (outcome.status === "invalid") {
      setError(outcome.fields.name ?? null);
    } else {
      setError(writeErrorMessage(outcome));
    }
  }

  return (
    <div className="col-span-3 grid grid-cols-[1fr_1fr_auto] items-end gap-3 rounded-input bg-off-white p-3">
      <Field
        label={strings.supplierName}
        htmlFor="supplier-name"
        error={error ?? undefined}
      >
        <input
          id="supplier-name"
          className={fieldClass}
          value={name}
          onChange={(event) => {
            setError(null);
            setName(event.target.value);
          }}
        />
      </Field>
      <Field label={strings.supplierPhone} htmlFor="supplier-phone">
        <input
          id="supplier-phone"
          className={fieldClass}
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value);
          }}
        />
      </Field>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={props.onCancel}>
          {t().common.cancel}
        </Button>
        <Button
          disabled={pending}
          onClick={() => {
            void save();
          }}
        >
          {strings.saveSupplier}
        </Button>
      </div>
    </div>
  );
}

export function SupplierPicker(props: SupplierPickerProps) {
  const strings = t().receive;
  const [adding, setAdding] = useState(false);
  return (
    <>
      <Field label={strings.supplier} htmlFor="supplier">
        <div className="flex gap-2">
          <select
            id="supplier"
            className={fieldClass}
            value={props.value === null ? "" : String(props.value)}
            onChange={(event) => {
              props.onChange(
                event.target.value ? Number(event.target.value) : null,
              );
            }}
          >
            <option value="">{strings.chooseSupplier}</option>
            {props.suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            onClick={() => {
              setAdding(true);
            }}
          >
            {strings.addSupplier}
          </Button>
        </div>
      </Field>
      {adding && (
        <AddSupplier
          repo={props.repo}
          onCancel={() => {
            setAdding(false);
          }}
          onAdded={(supplier) => {
            setAdding(false);
            props.onAdded(supplier);
          }}
        />
      )}
    </>
  );
}
