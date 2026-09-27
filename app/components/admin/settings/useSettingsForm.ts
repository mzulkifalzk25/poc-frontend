import { useState } from "react";

import { isValidTaxRate, type StoreSettings } from "~/domain/store-settings";
import { t } from "~/i18n/t";
import {
  saveSettings,
  type SettingsRepository,
} from "~/use_cases/manage-settings";

import { writeErrorMessage } from "../writeError";

interface FormOptions {
  repo: SettingsRepository;
  initial: StoreSettings;
  onSaved: () => void;
}

export function useSettingsForm({ repo, initial, onSaved }: FormOptions) {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function setField<K extends keyof StoreSettings>(
    key: K,
    value: StoreSettings[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setError(null);
    if (!isValidTaxRate(draft.taxRate)) {
      setFieldErrors({ tax_rate: t().settings.tax.rateRule });
      return;
    }
    setFieldErrors({});
    setPending(true);
    const outcome = await saveSettings(repo, draft);
    setPending(false);
    if (outcome.status === "done") {
      setSaved(outcome.value);
      setDraft(outcome.value);
      onSaved();
      return;
    }
    setError(writeErrorMessage(outcome));
    setFieldErrors(outcome.status === "invalid" ? outcome.fields : {});
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  return { draft, dirty, pending, error, fieldErrors, setField, save };
}
