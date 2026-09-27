import { PageHeader } from "~/components/admin/PageHeader";
import { Button } from "~/components/ui/Button";
import { useToast } from "~/components/ui/ToastProvider";
import type { StoreSettings } from "~/domain/store-settings";
import { t } from "~/i18n/t";
import type { SettingsRepository } from "~/use_cases/manage-settings";

import { ReceiptPreview } from "./ReceiptPreview";
import { ReceiptCard, StoreProfileCard, TaxCard } from "./SettingsCards";
import { useSettingsForm } from "./useSettingsForm";

interface SettingsEditorProps {
  repo: SettingsRepository;
  initial: StoreSettings;
}

export function SettingsEditor({ repo, initial }: SettingsEditorProps) {
  const strings = t().settings;
  const { showToast } = useToast();
  const form = useSettingsForm({
    repo,
    initial,
    onSaved: () => {
      showToast(strings.saved);
    },
  });
  const cardProps = {
    draft: form.draft,
    setField: form.setField,
    fieldErrors: form.fieldErrors,
  };
  return (
    <>
      <PageHeader
        title={strings.title}
        subtitle={strings.subtitle}
        actions={
          <Button
            size="lg"
            disabled={!form.dirty || form.pending}
            onClick={() => void form.save()}
          >
            {form.pending ? t().common.saving : strings.save}
          </Button>
        }
      />
      {form.error && (
        <p
          role="alert"
          className="rounded-input bg-error-bg px-3.5 py-2.5 text-sm font-semibold text-error-text"
        >
          {form.error}
        </p>
      )}
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_400px]">
        <div className="flex min-w-0 flex-col gap-4">
          <StoreProfileCard {...cardProps} />
          <TaxCard {...cardProps} />
          <ReceiptCard {...cardProps} />
        </div>
        <ReceiptPreview settings={form.draft} />
      </div>
    </>
  );
}
