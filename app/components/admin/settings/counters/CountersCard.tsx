import { Card } from "~/components/ui/Card";
import { ConfirmDialog } from "~/components/ui/ConfirmDialog";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "~/components/ui/StateBlocks";
import { useToast } from "~/components/ui/ToastProvider";
import { useAsyncData } from "~/components/ui/useAsyncData";
import type { Counter } from "~/domain/counter";
import { t } from "~/i18n/t";
import type { CounterRepository } from "~/use_cases/manage-counters";

import { AddCounterForm } from "./AddCounterForm";
import { CodePanel } from "./CodePanel";
import { CountersTable } from "./CountersTable";
import { useCounters } from "./useCounters";

function DeactivateDialog(props: {
  counter: Counter;
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const strings = t().settings.counters.deactivateConfirm;
  const unsynced = props.counter.unsyncedCount ?? 0;
  return (
    <ConfirmDialog
      title={strings.title(props.counter.name)}
      confirmLabel={strings.confirm}
      pending={props.pending}
      error={props.error}
      onConfirm={props.onConfirm}
      onCancel={props.onCancel}
    >
      <p>{strings.body}</p>
      {unsynced > 0 && (
        <p className="font-semibold text-warning">
          {strings.unsynced(unsynced)}
        </p>
      )}
    </ConfirmDialog>
  );
}

export function CountersCard({ repo }: { repo: CounterRepository }) {
  const strings = t().settings.counters;
  const { showToast } = useToast();
  const { state, reload } = useAsyncData(repo.list);
  const notify = (message: string, failed = false) => {
    showToast(message, failed ? "error" : "success");
  };
  const counters = useCounters({ repo, onChanged: reload, notify });
  const { deactivating } = counters;

  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-bold">{strings.title}</h2>
        <p className="text-sm text-text-secondary">
          {strings.intro} <span className="font-mono">{strings.example}</span>.
        </p>
      </div>
      {state.status === "loading" && <LoadingState />}
      {state.status === "error" && <ErrorState onRetry={reload} />}
      {state.status === "ready" && state.data.length === 0 && (
        <EmptyState title={strings.empty.title} hint={strings.empty.hint} />
      )}
      {state.status === "ready" && state.data.length > 0 && (
        <CountersTable
          counters={state.data}
          now={new Date()}
          pending={counters.pending}
          onNewCode={(counter) => void counters.newCode(counter)}
          onDeactivate={counters.askDeactivate}
        />
      )}
      {counters.code && (
        <CodePanel
          code={counters.code}
          pending={counters.pending}
          notify={notify}
          onRevoke={() => {
            if (counters.code) {
              void counters.revokeCode(counters.code);
            }
          }}
        />
      )}
      <AddCounterForm
        key={counters.addFormKey}
        pending={counters.pending}
        errors={counters.addErrors}
        onCreate={(draft) => void counters.create(draft)}
      />
      {deactivating && (
        <DeactivateDialog
          counter={deactivating}
          pending={counters.pending}
          error={counters.dialogError}
          onConfirm={() => void counters.confirmDeactivate(deactivating)}
          onCancel={() => {
            counters.askDeactivate(null);
          }}
        />
      )}
    </Card>
  );
}
