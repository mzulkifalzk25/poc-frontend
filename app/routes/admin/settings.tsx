import { CountersCard } from "~/components/admin/settings/counters/CountersCard";
import { SettingsEditor } from "~/components/admin/settings/SettingsEditor";
import { PageHeader } from "~/components/admin/PageHeader";
import { Card } from "~/components/ui/Card";
import { ErrorState, LoadingState } from "~/components/ui/StateBlocks";
import { useAsyncData } from "~/components/ui/useAsyncData";
import { t } from "~/i18n/t";
import { counterRepository } from "~/infrastructure/api/counter-repository";
import { settingsRepository } from "~/infrastructure/api/settings-repository";

export default function SettingsRoute() {
  const strings = t().settings;
  const { state, reload } = useAsyncData(settingsRepository.load);
  return (
    <div className="flex max-w-[1136px] flex-col gap-5">
      {state.status === "ready" ? (
        <SettingsEditor repo={settingsRepository} initial={state.data} />
      ) : (
        <>
          <PageHeader title={strings.title} subtitle={strings.subtitle} />
          <Card>
            {state.status === "loading" ? (
              <LoadingState />
            ) : (
              <ErrorState onRetry={reload} />
            )}
          </Card>
        </>
      )}
      <CountersCard repo={counterRepository} />
    </div>
  );
}
