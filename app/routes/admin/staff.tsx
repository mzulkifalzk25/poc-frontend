import { CashierForm } from "~/components/admin/staff/CashierForm";
import {
  StaffActionButtons,
  UnlockControl,
} from "~/components/admin/staff/StaffActions";
import { StaffDialogs } from "~/components/admin/staff/StaffDialogs";
import { StaffTable } from "~/components/admin/staff/StaffTable";
import { useStaffActions } from "~/components/admin/staff/useStaffActions";
import { useStaffEditor } from "~/components/admin/staff/useStaffEditor";
import { PageHeader } from "~/components/admin/PageHeader";
import { Card } from "~/components/ui/Card";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "~/components/ui/StateBlocks";
import { useToast } from "~/components/ui/ToastProvider";
import { useAsyncData } from "~/components/ui/useAsyncData";
import { staffSummary } from "~/domain/staff";
import { t } from "~/i18n/t";
import { listCounters } from "~/infrastructure/api/counter-repository";
import { staffRepository } from "~/infrastructure/api/staff-repository";

async function loadStaffPage() {
  const [members, counters] = await Promise.all([
    staffRepository.list(),
    listCounters(),
  ]);
  return { members, counters };
}

export default function StaffRoute() {
  const strings = t().staff;
  const { showToast } = useToast();
  const { state, reload } = useAsyncData(loadStaffPage);
  const editor = useStaffEditor({
    repo: staffRepository,
    onSaved: (member, created) => {
      showToast(
        created
          ? strings.created(member.fullName)
          : strings.saved(member.fullName),
      );
      reload();
    },
  });
  const actions = useStaffActions({
    repo: staffRepository,
    onChanged: (message) => {
      showToast(message);
      editor.edit(null);
      reload();
    },
    onFailed: (message) => {
      showToast(message, "error");
    },
  });
  const now = new Date();
  const data = state.status === "ready" ? state.data : null;
  const summary = data ? staffSummary(data.members, now) : null;

  return (
    <div className="flex max-w-[1136px] flex-col gap-5">
      <PageHeader
        title={strings.title}
        subtitle={
          summary &&
          strings.subtitle(summary.owners, summary.cashiers, summary.signedIn)
        }
      />
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          {state.status === "loading" && (
            <Card>
              <LoadingState />
            </Card>
          )}
          {state.status === "error" && (
            <Card>
              <ErrorState onRetry={reload} />
            </Card>
          )}
          {data && data.members.length === 0 && (
            <Card>
              <EmptyState
                title={strings.empty.title}
                hint={strings.empty.hint}
              />
            </Card>
          )}
          {data && data.members.length > 0 && (
            <StaffTable
              members={data.members}
              counters={data.counters}
              now={now}
              onManage={editor.edit}
              statusExtra={(member) => (
                <UnlockControl member={member} now={now} actions={actions} />
              )}
            />
          )}
        </div>
        <CashierForm
          key={editor.formKey}
          member={editor.member}
          counters={data?.counters ?? []}
          pending={editor.pending}
          error={editor.error}
          fieldErrors={editor.fieldErrors}
          onSubmit={(draft) => void editor.submit(draft)}
          onCancel={() => {
            editor.edit(null);
          }}
          extraActions={
            editor.member && (
              <StaffActionButtons member={editor.member} actions={actions} />
            )
          }
        />
      </div>
      <StaffDialogs actions={actions} />
    </div>
  );
}
