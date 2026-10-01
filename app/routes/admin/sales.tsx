import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { PageHeader } from "~/components/admin/PageHeader";
import { BillPanel } from "~/components/admin/sales/BillPanel";
import { SalesFilters } from "~/components/admin/sales/SalesFilters";
import { SalesTable } from "~/components/admin/sales/SalesTable";
import { useSalesPages } from "~/components/admin/sales/useSalesPages";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "~/components/ui/StateBlocks";
import { useAsyncData } from "~/components/ui/useAsyncData";
import { todayIn } from "~/domain/delivery";
import { formatMoney } from "~/domain/money";
import type { PaymentMethod } from "~/domain/payment";
import type { SalesQuery } from "~/domain/sale";
import { t } from "~/i18n/t";
import { salesRepository } from "~/infrastructure/api/sales-repository";
import { staffRepository } from "~/infrastructure/api/staff-repository";
import { STORE_TIME_ZONE } from "~/infrastructure/store-time-zone";

const METHODS: readonly string[] = ["cash", "card", "wallet"];

function queryFromParams(params: URLSearchParams): SalesQuery {
  const cashier = Number(params.get("cashier"));
  const payment = params.get("payment");
  return {
    date: params.get("date") ?? todayIn(STORE_TIME_ZONE),
    cashierId: Number.isInteger(cashier) && cashier > 0 ? cashier : null,
    payment:
      payment && METHODS.includes(payment) ? (payment as PaymentMethod) : null,
    search: params.get("search") ?? "",
  };
}

function paramsFromQuery(query: SalesQuery): URLSearchParams {
  const params = new URLSearchParams({ date: query.date });
  if (query.cashierId !== null) {
    params.set("cashier", String(query.cashierId));
  }
  if (query.payment !== null) {
    params.set("payment", query.payment);
  }
  if (query.search !== "") {
    params.set("search", query.search);
  }
  return params;
}

export default function SalesRoute() {
  const strings = t().sales;
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsKey = searchParams.toString();
  const query = useMemo(
    () => queryFromParams(new URLSearchParams(paramsKey)),
    [paramsKey],
  );
  const pages = useSalesPages(query);
  const staff = useAsyncData(staffRepository.list);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const loadDetail = useCallback(
    () =>
      selectedId === null
        ? Promise.reject(new Error("none"))
        : salesRepository.detail(selectedId),
    [selectedId],
  );
  const detail = useAsyncData(loadDetail);
  const cashiers =
    staff.state.status === "ready"
      ? staff.state.data.filter((m) => m.role === "cashier")
      : [];
  const { state } = pages;

  return (
    <div className="flex max-w-[1136px] flex-col gap-5">
      <PageHeader
        title={strings.title}
        subtitle={
          state.status === "ready"
            ? strings.summary(state.extra.count, formatMoney(state.extra.total))
            : undefined
        }
        actions={
          <Button variant="secondary" disabled title={strings.exportLater}>
            {strings.exportCsv}
          </Button>
        }
      />
      <SalesFilters
        query={query}
        cashiers={cashiers}
        onChange={(changes) => {
          setSelectedId(null);
          setSearchParams(paramsFromQuery({ ...query, ...changes }));
        }}
      />
      <div className="grid grid-cols-[1fr_340px] items-start gap-5">
        <div className="flex flex-col gap-4">
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
              <EmptyState
                title={strings.empty.title}
                hint={strings.empty.hint}
              />
            </Card>
          )}
          {state.status === "ready" && state.rows.length > 0 && (
            <>
              <SalesTable
                bills={state.rows}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
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
        <BillPanel
          state={selectedId === null ? null : detail.state}
          onRetry={detail.reload}
        />
      </div>
    </div>
  );
}
