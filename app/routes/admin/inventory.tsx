import { useCallback, useMemo } from "react";
import { Outlet, useSearchParams } from "react-router";

import { FilterChips } from "~/components/admin/FilterChips";
import { PageHeader } from "~/components/admin/PageHeader";
import { Paging } from "~/components/admin/Paging";
import { SearchBox } from "~/components/admin/SearchBox";
import type { InventoryOutletContext } from "~/components/admin/inventory/inventoryOutlet";
import {
  paramsFromQuery,
  queryFromParams,
} from "~/components/admin/inventory/inventoryQuery";
import { RecentAdjustments } from "~/components/admin/inventory/RecentAdjustments";
import { StockKpis } from "~/components/admin/inventory/StockKpis";
import { StockTable } from "~/components/admin/inventory/StockTable";
import { Button } from "~/components/ui/Button";
import { ButtonLink } from "~/components/ui/ButtonLink";
import { Card } from "~/components/ui/Card";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "~/components/ui/StateBlocks";
import { useAsyncData } from "~/components/ui/useAsyncData";
import type { StockListFilter, StockPage, StockQuery } from "~/domain/stock";
import { t } from "~/i18n/t";
import { stockRepository } from "~/infrastructure/api/stock-repository";
import { STOCK_PAGE_SIZE } from "~/use_cases/manage-stock";

const RECENT_LIMIT = 6;

function Results(props: {
  page: StockPage;
  query: StockQuery;
  search: string;
  onPage: (page: number) => void;
}) {
  const strings = t().inventory;
  const { page, query } = props;
  if (page.count === 0) {
    return (
      <Card>
        <EmptyState title={strings.empty.title} hint={strings.empty.hint} />
      </Card>
    );
  }
  return (
    <StockTable
      rows={page.results}
      adjustHref={(row) => `adjust?product=${String(row.id)}`}
      footer={
        <Paging
          page={query.page}
          pageSize={STOCK_PAGE_SIZE}
          total={page.count}
          onPageChange={props.onPage}
        />
      }
    />
  );
}

export default function InventoryRoute() {
  const strings = t().inventory;
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsKey = searchParams.toString();
  const query = useMemo(
    () => queryFromParams(new URLSearchParams(paramsKey)),
    [paramsKey],
  );
  const load = useCallback(() => stockRepository.list(query), [query]);
  const stock = useAsyncData(load);
  const loadRecent = useCallback(
    () => stockRepository.recentAdjustments(RECENT_LIMIT),
    [],
  );
  const recent = useAsyncData(loadRecent);

  function update(changes: Partial<StockQuery>) {
    setSearchParams(paramsFromQuery({ ...query, page: 1, ...changes }));
  }
  const reload = () => {
    stock.reload();
    recent.reload();
  };

  return (
    <div className="flex max-w-[1136px] flex-col gap-5">
      <PageHeader
        title={strings.title}
        subtitle={strings.subtitle}
        actions={
          <>
            <Button variant="secondary" disabled title={strings.countLater}>
              {strings.startCount}
            </Button>
            <ButtonLink to="/admin/receive" variant="navy">
              {strings.receive}
            </ButtonLink>
          </>
        }
      />
      {stock.state.status === "ready" && (
        <StockKpis summary={stock.state.data.summary} />
      )}
      <div className="grid grid-cols-[1fr_340px] items-start gap-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <SearchBox
              label={strings.search}
              value={query.search}
              onSearch={(search) => {
                update({ search });
              }}
            />
            <FilterChips<StockListFilter>
              label={strings.filterLabel}
              value={query.filter}
              options={[
                { value: "all", label: strings.filters.all },
                {
                  value: "low",
                  label:
                    stock.state.status === "ready"
                      ? `${strings.filters.low} · ${String(stock.state.data.summary.lowCount)}`
                      : strings.filters.low,
                },
                {
                  value: "out",
                  label:
                    stock.state.status === "ready"
                      ? `${strings.filters.out} · ${String(stock.state.data.summary.outCount)}`
                      : strings.filters.out,
                },
              ]}
              onChange={(filter) => {
                update({ filter });
              }}
            />
          </div>
          {stock.state.status === "loading" && (
            <Card>
              <LoadingState />
            </Card>
          )}
          {stock.state.status === "error" && (
            <Card>
              <ErrorState onRetry={stock.reload} />
            </Card>
          )}
          {stock.state.status === "ready" && (
            <Results
              page={stock.state.data}
              query={query}
              search={paramsKey}
              onPage={(page) => {
                update({ page });
              }}
            />
          )}
        </div>
        {recent.state.status === "ready" ? (
          <RecentAdjustments items={recent.state.data} />
        ) : (
          <Card>
            {recent.state.status === "loading" ? (
              <LoadingState />
            ) : (
              <ErrorState onRetry={recent.reload} />
            )}
          </Card>
        )}
      </div>
      <Outlet context={{ reload } satisfies InventoryOutletContext} />
    </div>
  );
}
