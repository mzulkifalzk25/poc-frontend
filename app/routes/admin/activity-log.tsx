import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { ActivityTable } from "~/components/admin/activity/ActivityTable";
import { downloadBlob } from "~/components/admin/activity/downloadBlob";
import { FilterChips } from "~/components/admin/FilterChips";
import { fieldClass } from "~/components/admin/FormField";
import { PageHeader } from "~/components/admin/PageHeader";
import { useCursorPages } from "~/components/admin/useCursorPages";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "~/components/ui/StateBlocks";
import { useToast } from "~/components/ui/ToastProvider";
import {
  ACTIVITY_TYPES,
  activityTypeFrom,
  type ActivityHeader,
  type ActivityQuery,
} from "~/domain/activity";
import { t } from "~/i18n/t";
import { activityRepository } from "~/infrastructure/api/activity-repository";

function queryFromParams(params: URLSearchParams): ActivityQuery {
  return {
    type: activityTypeFrom(params.get("type")),
    from: params.get("from") ?? "",
    to: params.get("to") ?? "",
  };
}

function paramsFromQuery(query: ActivityQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.type !== "all") {
    params.set("type", query.type);
  }
  if (query.from !== "") {
    params.set("from", query.from);
  }
  if (query.to !== "") {
    params.set("to", query.to);
  }
  return params;
}

function SummaryCards({ header }: { header: ActivityHeader }) {
  const strings = t().activity.cards;
  const cards = [
    { label: strings.heldBills, value: header.heldBillsDeletedToday },
    { label: strings.refunds, value: header.refundsToday },
    { label: strings.prices, value: header.priceChangesToday },
  ];
  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="flex flex-col gap-2 p-5">
          <span className="text-[13px] font-semibold text-text-secondary">
            {card.label}
          </span>
          <span className="font-mono text-[26px] font-semibold">
            {card.value}
          </span>
        </Card>
      ))}
    </div>
  );
}

export default function ActivityLogRoute() {
  const strings = t().activity;
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsKey = searchParams.toString();
  const query = useMemo(
    () => queryFromParams(new URLSearchParams(paramsKey)),
    [paramsKey],
  );
  const load = useCallback(
    async (cursor: string | null) => {
      const page = await activityRepository.list(query, cursor);
      return {
        rows: page.rows,
        nextCursor: page.nextCursor,
        extra: page.header,
      };
    },
    [query],
  );
  const pages = useCursorPages(paramsKey, load);
  const [exporting, setExporting] = useState(false);
  const { state } = pages;

  function update(changes: Partial<ActivityQuery>) {
    setSearchParams(paramsFromQuery({ ...query, ...changes }));
  }

  async function exportCsv() {
    setExporting(true);
    try {
      downloadBlob(
        await activityRepository.exportCsv(query),
        "activity-log.csv",
      );
    } catch {
      showToast(strings.exportFailed, "error");
    }
    setExporting(false);
  }

  return (
    <div className="flex max-w-[1136px] flex-col gap-5">
      <PageHeader
        title={strings.title}
        subtitle={strings.subtitle}
        actions={
          <Button
            variant="secondary"
            disabled={exporting}
            onClick={() => {
              void exportCsv();
            }}
          >
            {exporting ? strings.exporting : strings.exportCsv}
          </Button>
        }
      />
      {state.status === "ready" && <SummaryCards header={state.extra} />}
      <div className="flex flex-wrap items-center gap-3">
        <FilterChips
          label={strings.filterLabel}
          value={query.type}
          options={ACTIVITY_TYPES.map((type) => ({
            value: type,
            label: strings.types[type],
          }))}
          onChange={(type) => {
            update({ type });
          }}
        />
        <input
          type="date"
          aria-label={strings.from}
          className={`${fieldClass} h-9 w-auto`}
          value={query.from}
          onChange={(event) => {
            update({ from: event.target.value });
          }}
        />
        <input
          type="date"
          aria-label={strings.to}
          className={`${fieldClass} h-9 w-auto`}
          value={query.to}
          onChange={(event) => {
            update({ to: event.target.value });
          }}
        />
      </div>
      {state.status === "loading" && (
        <Card>
          <LoadingState />
        </Card>
      )}
      {state.status === "error" && (
        <Card>
          <ErrorState onRetry={pages.reload} />
        </Card>
      )}
      {state.status === "ready" && state.rows.length === 0 && (
        <Card>
          <EmptyState title={strings.empty.title} hint={strings.empty.hint} />
        </Card>
      )}
      {state.status === "ready" && state.rows.length > 0 && (
        <>
          <ActivityTable rows={state.rows} />
          {state.nextCursor !== null && (
            <Button
              variant="secondary"
              className="self-center"
              disabled={state.loadingMore}
              onClick={() => {
                void pages.loadMore();
              }}
            >
              {state.loadingMore ? strings.loading : strings.loadMore}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
