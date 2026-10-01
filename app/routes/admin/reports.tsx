import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";

import { downloadBlob } from "~/components/admin/activity/downloadBlob";
import { GroupedBars, Legend } from "~/components/admin/charts/GroupedBars";
import { PageHeader } from "~/components/admin/PageHeader";
import { RangeChips } from "~/components/admin/RangeChips";
import { tintClass } from "~/components/admin/categoryTint";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { ErrorState, LoadingState } from "~/components/ui/StateBlocks";
import { useToast } from "~/components/ui/ToastProvider";
import { useAsyncData, type AsyncState } from "~/components/ui/useAsyncData";
import {
  daysBetween,
  dayMonth,
  periodLabel,
  reportRange,
  summaryGroup,
  type DateRange,
  type ReportPreset,
} from "~/domain/date-range";
import { formatClockTime } from "~/domain/dates";
import { todayIn } from "~/domain/delivery";
import { getInitials } from "~/domain/initials";
import { formatCompactMoney, formatMoney } from "~/domain/money";
import { formatQuantity } from "~/domain/product";
import type { CashiersData, CategoryRow, SummaryData } from "~/domain/report";
import { t } from "~/i18n/t";
import { reportRepository } from "~/infrastructure/api/report-repository";
import { printPage } from "~/infrastructure/print";
import { STORE_TIME_ZONE } from "~/infrastructure/store-time-zone";

const PRESETS: readonly ReportPreset[] = ["today", "7d", "30d", "custom"];
const MAX_DAYS = 366;
const CASHIER_LIMIT = 5;

function paramsState(params: URLSearchParams, today: string) {
  const asked = params.get("period");
  const preset = PRESETS.find((item) => item === asked) ?? "30d";
  const base = reportRange(preset, today);
  const range: DateRange =
    preset === "custom"
      ? {
          from: params.get("from") ?? base.from,
          to: params.get("to") ?? base.to,
        }
      : base;
  return { preset, range };
}

function rangeIsValid(range: DateRange): boolean {
  const days = daysBetween(range);
  return days >= 1 && days <= MAX_DAYS;
}

function Section<T>(props: {
  state: AsyncState<T>;
  onRetry: () => void;
  children: (data: T) => ReactNode;
}) {
  if (props.state.status === "loading") {
    return <LoadingState />;
  }
  if (props.state.status === "error") {
    return <ErrorState onRetry={props.onRetry} />;
  }
  return <>{props.children(props.state.data)}</>;
}

function Kpis({ data }: { data: SummaryData }) {
  const strings = t().reports.kpis;
  const cards = [
    { label: strings.revenue, value: formatCompactMoney(data.revenue) },
    { label: strings.profit, value: formatCompactMoney(data.grossProfit) },
    { label: strings.bills, value: formatQuantity(String(data.bills)) },
    { label: strings.average, value: formatMoney(data.averageBill) },
  ];
  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="flex flex-col gap-2 p-5">
          <span className="text-[13px] font-semibold text-text-secondary">
            {card.label}
          </span>
          <span className="font-heading text-[28px] leading-none font-bold">
            {card.value}
          </span>
        </Card>
      ))}
    </div>
  );
}

function PeriodChart({ data, group }: { data: SummaryData; group: string }) {
  const strings = t().reports.byPeriod;
  const groups = data.periods.map((period) => ({
    label:
      group === "hour"
        ? formatClockTime(period.period, STORE_TIME_ZONE)
        : periodLabel(period.period, period.end),
    caption: formatCompactMoney(period.revenue).replace("Rs ", ""),
    values: [
      { value: Number(period.revenue), tone: "blue" as const },
      { value: Math.max(Number(period.grossProfit), 0), tone: "gold" as const },
    ],
  }));
  if (groups.length === 0 || data.bills === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-secondary">
        {strings.empty}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <Legend
        items={[
          { label: strings.revenue, tone: "blue" },
          { label: strings.profit, tone: "gold" },
        ]}
      />
      <GroupedBars label={strings.label} groups={groups} />
    </div>
  );
}

function Cashiers({ data }: { data: CashiersData }) {
  const strings = t().reports.cashiers;
  if (data.rows.length === 0) {
    return <p className="text-sm text-text-secondary">{strings.empty}</p>;
  }
  return (
    <>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs font-bold tracking-wide text-text-secondary uppercase">
            <th className="pb-2 text-start">{strings.cashier}</th>
            <th className="pb-2 text-end">{strings.bills}</th>
            <th className="pb-2 text-end">{strings.revenue}</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr key={row.cashierId} className="border-t border-border">
              <td className="py-2.5">
                <span className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-category-dairy-bg text-xs font-bold text-category-dairy-ink"
                  >
                    {getInitials(row.name)}
                  </span>
                  <span className="font-semibold">{row.name}</span>
                  {!row.isActive && (
                    <span className="text-xs text-text-secondary">
                      ({strings.deactivated})
                    </span>
                  )}
                </span>
              </td>
              <td className="py-2.5 text-end font-mono">
                {formatQuantity(String(row.bills))}
              </td>
              <td className="py-2.5 text-end font-mono">
                {formatCompactMoney(row.revenue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-text-secondary">
        {strings.footer(data.rows.length, data.totalCashiers, data.refundCount)}
      </p>
    </>
  );
}

function Categories({ rows }: { rows: CategoryRow[] }) {
  const strings = t().reports.categories;
  if (rows.length === 0) {
    return <p className="text-sm text-text-secondary">{strings.empty}</p>;
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-xs font-bold tracking-wide text-text-secondary uppercase">
          <th className="pb-2 text-start">{strings.category}</th>
          <th className="pb-2 text-end">{strings.revenue}</th>
          <th className="pb-2 text-end">{strings.profit}</th>
          <th className="pb-2 text-end">{strings.margin}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name} className="border-t border-border">
            <td className="py-2.5">
              <span
                className={`rounded-pill px-2.5 py-1 text-xs font-bold ${tintClass(row.tint)}`}
              >
                {row.name}
              </span>
            </td>
            <td className="py-2.5 text-end font-mono">
              {formatCompactMoney(row.revenue)}
            </td>
            <td className="py-2.5 text-end font-mono">
              {formatCompactMoney(row.profit)}
            </td>
            <td className="py-2.5 text-end font-mono">
              {Math.round(Number(row.margin))}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ReportsRoute() {
  const strings = t().reports;
  const { showToast } = useToast();
  const today = useMemo(() => todayIn(STORE_TIME_ZONE), []);
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsKey = searchParams.toString();
  const { preset, range } = useMemo(
    () => paramsState(new URLSearchParams(paramsKey), today),
    [paramsKey, today],
  );
  const valid = rangeIsValid(range);
  const group = summaryGroup(range);
  const [exporting, setExporting] = useState(false);

  const loadSummary = useCallback(
    () =>
      valid
        ? reportRepository.summary(range, group)
        : Promise.reject(new Error("range")),
    [valid, range, group],
  );
  const loadCategories = useCallback(
    () =>
      valid
        ? reportRepository.categories(range)
        : Promise.reject(new Error("range")),
    [valid, range],
  );
  const loadCashiers = useCallback(
    () =>
      valid
        ? reportRepository.cashiers(range, CASHIER_LIMIT)
        : Promise.reject(new Error("range")),
    [valid, range],
  );
  const summary = useAsyncData(loadSummary);
  const categories = useAsyncData(loadCategories);
  const cashiers = useAsyncData(loadCashiers);

  function choose(next: ReportPreset) {
    const chosen = reportRange(next, today);
    setSearchParams(
      next === "custom"
        ? new URLSearchParams({ period: next, from: range.from, to: range.to })
        : new URLSearchParams({
            period: next,
            from: chosen.from,
            to: chosen.to,
          }),
    );
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const blob = await reportRepository.exportCsv("summary", range, group);
      downloadBlob(blob, `summary-${range.from}-${range.to}.csv`);
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
          <>
            <Button
              variant="secondary"
              disabled={exporting || !valid}
              onClick={() => void exportCsv()}
            >
              {exporting ? strings.exporting : strings.exportCsv}
            </Button>
            <Button variant="secondary" onClick={printPage}>
              {strings.exportPdf}
            </Button>
          </>
        }
      />
      <RangeChips<ReportPreset>
        label={strings.presetLabel}
        fromLabel={strings.from}
        toLabel={strings.to}
        options={PRESETS.map((item) => ({
          value: item,
          label: strings.presets[item],
        }))}
        value={preset}
        from={range.from}
        to={range.to}
        showDates={preset === "custom"}
        onPreset={choose}
        onDates={(from, to) => {
          setSearchParams(new URLSearchParams({ period: "custom", from, to }));
        }}
        trailing={`${dayMonth(range.from)} – ${dayMonth(range.to)}`}
      />
      {!valid ? (
        <p
          role="alert"
          className="rounded-input bg-error-bg px-3.5 py-2.5 text-sm font-semibold text-error-text"
        >
          {strings.rangeError}
        </p>
      ) : (
        <>
          <Section state={summary.state} onRetry={summary.reload}>
            {(data) => <Kpis data={data} />}
          </Section>
          <div className="grid grid-cols-[1.6fr_1fr] items-start gap-5">
            <Card className="flex flex-col gap-4 p-5">
              <h2 className="font-heading text-lg font-bold">
                {strings.byPeriod.title}
              </h2>
              <Section state={summary.state} onRetry={summary.reload}>
                {(data) => <PeriodChart data={data} group={group} />}
              </Section>
            </Card>
            <Card className="flex flex-col gap-3 p-5">
              <h2 className="font-heading text-lg font-bold">
                {strings.cashiers.title}
              </h2>
              <Section state={cashiers.state} onRetry={cashiers.reload}>
                {(data) => <Cashiers data={data} />}
              </Section>
            </Card>
          </div>
          <Card className="flex flex-col gap-3 p-5">
            <h2 className="font-heading text-lg font-bold">
              {strings.categories.title}
            </h2>
            <Section state={categories.state} onRetry={categories.reload}>
              {(data) => <Categories rows={data} />}
            </Section>
          </Card>
        </>
      )}
    </div>
  );
}
