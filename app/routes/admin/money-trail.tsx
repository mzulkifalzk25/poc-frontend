import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router";

import { downloadBlob } from "~/components/admin/activity/downloadBlob";
import { GroupedBars, Legend } from "~/components/admin/charts/GroupedBars";
import { LineChart } from "~/components/admin/charts/LineChart";
import { ShareBar } from "~/components/admin/charts/ShareBar";
import { PageHeader } from "~/components/admin/PageHeader";
import { RangeChips } from "~/components/admin/RangeChips";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { ErrorState, LoadingState } from "~/components/ui/StateBlocks";
import { useToast } from "~/components/ui/ToastProvider";
import { useAsyncData, type AsyncState } from "~/components/ui/useAsyncData";
import {
  addMonths,
  dayMonth,
  dayOfMonth,
  moneyGroup,
  moneyRange,
  monthLong,
  monthShort,
  type DateRange,
  type MoneyPreset,
} from "~/domain/date-range";
import { todayIn } from "~/domain/delivery";
import { getInitials } from "~/domain/initials";
import { formatAmount, formatCompactMoney, formatMoney } from "~/domain/money";
import {
  paymentShares,
  type MoneyData,
  type MoneyPeriod,
  type RefundByCashier,
} from "~/domain/report";
import { t } from "~/i18n/t";
import { reportRepository } from "~/infrastructure/api/report-repository";
import { STORE_TIME_ZONE } from "~/infrastructure/store-time-zone";

const PRESETS: readonly MoneyPreset[] = [
  "this_month",
  "last_month",
  "last_12",
  "custom",
];

function paramsState(params: URLSearchParams, today: string) {
  const asked = params.get("period");
  const preset = PRESETS.find((item) => item === asked) ?? "this_month";
  const base = moneyRange(preset, today);
  const range: DateRange =
    preset === "custom"
      ? {
          from: params.get("from") ?? base.from,
          to: params.get("to") ?? base.to,
        }
      : base;
  return { preset, range };
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

function Kpis({ totals }: { totals: MoneyData["totals"] }) {
  const strings = t().money.cards;
  const cards = [
    {
      label: strings.sales,
      value: totals.salesTotal,
      note: strings.salesNote,
      tone: "text-text",
    },
    {
      label: strings.refunds,
      value: totals.refundsTotal,
      note: strings.refundsNote(totals.refundsCount, totals.refundRate),
      tone: "text-error-text",
    },
    {
      label: strings.stock,
      value: totals.stockBought,
      note: strings.stockNote(totals.deliveries),
      tone: "text-warning",
    },
    {
      label: strings.net,
      value: totals.net,
      note: strings.netNote,
      tone: "text-success-text",
    },
    {
      label: strings.profit,
      value: totals.grossProfit,
      note: strings.profitNote(totals.profitMargin),
      tone: "text-text",
    },
  ];
  return (
    <div className="grid grid-cols-5 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="flex flex-col gap-1.5 p-4">
          <span className="text-xs font-semibold text-text-secondary">
            {card.label}
          </span>
          <span
            className={`font-heading text-2xl leading-tight font-bold ${card.tone}`}
          >
            {formatCompactMoney(card.value)}
          </span>
          <span className="text-xs text-text-secondary">{card.note}</span>
        </Card>
      ))}
    </div>
  );
}

const shareStyle = {
  cash: "bg-blue",
  card: "bg-[#6B9AC4]",
  wallet: "bg-gold",
} as const;

function Payments({ totals }: { totals: MoneyPeriod }) {
  const strings = t().money.payments;
  const shares = paymentShares(totals);
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-heading text-lg font-bold">{strings.title}</h2>
        <span className="text-xs text-text-secondary">
          {strings.total(formatCompactMoney(totals.salesTotal))}
        </span>
      </div>
      <ShareBar
        label={strings.label}
        segments={shares.map((share) => ({
          label: share.method,
          share: share.share,
          className: shareStyle[share.method],
        }))}
      />
      <ul className="flex flex-col gap-2.5 text-sm">
        {shares.map((share) => (
          <li key={share.method} className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 rounded-full ${shareStyle[share.method]}`}
            />
            <span className="flex-grow font-semibold">
              {strings[share.method]}
            </span>
            <span className="font-mono">
              {formatCompactMoney(share.amount)}
            </span>
            <span className="w-12 text-end font-mono text-text-secondary">
              {Math.round(share.share)}%
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Refunds({ rows }: { rows: RefundByCashier[] }) {
  const strings = t().money.refunds;
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-heading text-lg font-bold">{strings.title}</h2>
        <Link
          to="/admin/activity-log?type=refund"
          className="text-sm font-semibold text-blue hover:underline"
        >
          {strings.seeEach}
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-text-secondary">{strings.empty}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs font-bold tracking-wide text-text-secondary uppercase">
              <th className="pb-2 text-start">{strings.cashier}</th>
              <th className="pb-2 text-end">{strings.count}</th>
              <th className="pb-2 text-end">{strings.amount}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
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
                  {row.refundsCount}
                </td>
                <td className="py-2.5 text-end font-mono">
                  {formatMoney(row.refundsAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

function Months({ data }: { data: MoneyData }) {
  const strings = t().money.months;
  const groups = data.periods.map((period) => ({
    label: monthShort(period.period),
    values: [
      { value: Number(period.salesTotal), tone: "blue" as const },
      { value: Number(period.refundsTotal), tone: "red" as const },
      { value: Number(period.stockBought), tone: "gold" as const },
    ],
  }));
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold">{strings.title}</h2>
        <Legend
          items={[
            { label: strings.sales, tone: "blue" },
            { label: strings.refunds, tone: "red" },
            { label: strings.stock, tone: "gold" },
          ]}
        />
      </div>
      <GroupedBars label={strings.label} groups={groups} />
      <p className="text-xs text-text-secondary">{strings.note}</p>
    </Card>
  );
}

function Days({ data }: { data: MoneyData }) {
  const strings = t().money.days;
  const first = data.periods[0]?.period ?? "";
  const refunds = data.periods.map((period) => Number(period.refundsTotal));
  const maxRefund = Math.max(...refunds, 0);
  const labels = data.periods
    .map((period) => period.period)
    .filter(
      (_, index, all) =>
        index === 0 || index === all.length - 1 || index % 5 === 4,
    );
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold">
          {strings.title(monthLong(first))}
        </h2>
        <Legend
          items={[
            { label: strings.sales, tone: "blue" },
            { label: strings.stock, tone: "gold" },
          ]}
        />
      </div>
      <LineChart
        label={strings.label}
        series={[
          {
            name: strings.sales,
            color: "#174A73",
            values: data.periods.map((p) => Number(p.salesTotal)),
          },
          {
            name: strings.stock,
            color: "#F4B43C",
            values: data.periods.map((p) => Number(p.stockBought)),
          },
        ]}
        xLabels={labels.map((day) => dayOfMonth(day))}
      />
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-text-secondary">
          {strings.refundsStrip(formatCompactMoney(maxRefund))}
        </span>
        <div className="flex h-8 items-end gap-0.5" aria-hidden="true">
          {refunds.map((value, index) => (
            <span
              key={index}
              className="flex-1 rounded-t-sm bg-error"
              style={{
                height: `${String(maxRefund > 0 ? Math.max((value / maxRefund) * 100, value > 0 ? 6 : 0) : 0)}%`,
              }}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

function PeriodTable({ data }: { data: MoneyData }) {
  const strings = t().money.table;
  const monthly = data.group === "month";
  const head = [
    strings.sales,
    strings.cash,
    strings.card,
    strings.wallet,
    strings.refunds,
    strings.stock,
    strings.net,
  ];
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-heading text-lg font-bold">
          {monthly ? strings.titleMonth : strings.title}
        </h2>
        <span className="text-xs text-text-secondary">{strings.note}</span>
      </div>
      <table aria-label={strings.label} className="w-full text-sm">
        <thead>
          <tr className="text-xs font-bold tracking-wide text-text-secondary uppercase">
            <th className="pb-2 text-start">
              {monthly ? strings.month : strings.day}
            </th>
            {head.map((label) => (
              <th key={label} className="pb-2 text-end">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...data.periods].reverse().map((period) => (
            <tr key={period.period} className="border-t border-border">
              <td className="py-2 font-semibold">
                {monthly
                  ? `${monthShort(period.period)} ${period.period.slice(0, 4)}`
                  : dayMonth(period.period)}
              </td>
              {[
                period.salesTotal,
                period.salesCash,
                period.salesCard,
                period.salesWallet,
                period.refundsTotal,
                period.stockBought,
              ].map((value, index) => (
                <td key={index} className="py-2 text-end font-mono">
                  {formatAmount(value)}
                </td>
              ))}
              <td
                className={`py-2 text-end font-mono font-semibold ${Number(period.net) < 0 ? "text-error-text" : ""}`}
              >
                {formatAmount(period.net)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export default function MoneyTrailRoute() {
  const strings = t().money;
  const { showToast } = useToast();
  const today = useMemo(() => todayIn(STORE_TIME_ZONE), []);
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsKey = searchParams.toString();
  const { preset, range } = useMemo(
    () => paramsState(new URLSearchParams(paramsKey), today),
    [paramsKey, today],
  );
  const group = moneyGroup(range);
  const [exporting, setExporting] = useState(false);

  const loadMoney = useCallback(
    () =>
      group
        ? reportRepository.money(range, group)
        : Promise.reject(new Error("range")),
    [range, group],
  );
  const loadRefunds = useCallback(
    () =>
      group
        ? reportRepository.refundsByCashier(range)
        : Promise.reject(new Error("range")),
    [range, group],
  );
  const loadYear = useCallback(
    () =>
      reportRepository.money(
        { from: addMonths(today, -11), to: today },
        "month",
      ),
    [today],
  );
  const money = useAsyncData(loadMoney);
  const refunds = useAsyncData(loadRefunds);
  const year = useAsyncData(loadYear);

  function choose(next: MoneyPreset) {
    const chosen = next === "custom" ? range : moneyRange(next, today);
    setSearchParams(
      new URLSearchParams({ period: next, from: chosen.from, to: chosen.to }),
    );
  }

  async function exportCsv() {
    if (!group) {
      return;
    }
    setExporting(true);
    try {
      downloadBlob(
        await reportRepository.exportCsv("money", range, group),
        `money-${range.from}-${range.to}.csv`,
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
            disabled={exporting || !group}
            onClick={() => void exportCsv()}
          >
            {exporting ? strings.exporting : strings.exportCsv}
          </Button>
        }
      />
      <RangeChips<MoneyPreset>
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
        trailing={
          group
            ? strings.shownBy(
                `${dayMonth(range.from)} – ${dayMonth(range.to)}`,
                strings.groups[group],
              )
            : undefined
        }
      />
      {!group ? (
        <p
          role="alert"
          className="rounded-input bg-error-bg px-3.5 py-2.5 text-sm font-semibold text-error-text"
        >
          {strings.rangeError}
        </p>
      ) : (
        <>
          <Section state={money.state} onRetry={money.reload}>
            {(data) => (
              <>
                <Kpis totals={data.totals} />
                <div className="grid grid-cols-2 items-start gap-5">
                  <Payments totals={data.totals} />
                  <Section state={refunds.state} onRetry={refunds.reload}>
                    {(rows) => <Refunds rows={rows} />}
                  </Section>
                </div>
                <div className="grid grid-cols-2 items-start gap-5">
                  <Section state={year.state} onRetry={year.reload}>
                    {(yearData) => <Months data={yearData} />}
                  </Section>
                  {data.group === "day" && <Days data={data} />}
                </div>
                <PeriodTable data={data} />
              </>
            )}
          </Section>
        </>
      )}
    </div>
  );
}
