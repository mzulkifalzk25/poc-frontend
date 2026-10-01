import { useState, type ReactNode } from "react";
import { Link } from "react-router";

import { BarChart } from "~/components/admin/charts/BarChart";
import { PageHeader } from "~/components/admin/PageHeader";
import { tintClass } from "~/components/admin/categoryTint";
import { ButtonLink } from "~/components/ui/ButtonLink";
import { Card } from "~/components/ui/Card";
import { ErrorState, LoadingState } from "~/components/ui/StateBlocks";
import { useAsyncData } from "~/components/ui/useAsyncData";
import { weekdayShort } from "~/domain/date-range";
import { formatWeekdayDayMonth } from "~/domain/dates";
import { formatCompactMoney, formatMoney } from "~/domain/money";
import { formatQuantity } from "~/domain/product";
import { formatChange, type DashboardData } from "~/domain/report";
import { t } from "~/i18n/t";
import { reportRepository } from "~/infrastructure/api/report-repository";
import { settingsRepository } from "~/infrastructure/api/settings-repository";
import { STORE_TIME_ZONE } from "~/infrastructure/store-time-zone";

function Change({ value }: { value: string | null }) {
  const text = formatChange(value);
  if (text === null) {
    return null;
  }
  const up = Number(value) >= 0;
  return (
    <span
      title={t().dashboard.vsYesterday}
      className={`rounded-pill px-2 py-0.5 text-xs font-bold ${up ? "bg-success-bg text-success-text" : "bg-error-bg text-error-text"}`}
    >
      {text}
    </span>
  );
}

function Kpi(props: { label: string; value: string; children?: ReactNode }) {
  return (
    <Card className="flex flex-col gap-2 p-5">
      <span className="text-[13px] font-semibold text-text-secondary">
        {props.label}
      </span>
      <span className="flex items-baseline gap-2.5">
        <span className="font-heading text-[28px] leading-none font-bold">
          {props.value}
        </span>
        {props.children}
      </span>
    </Card>
  );
}

function Kpis({ data }: { data: DashboardData }) {
  const strings = t().dashboard;
  return (
    <div className="grid grid-cols-4 gap-4">
      <Card className="flex flex-col gap-2 p-5">
        <span className="text-[13px] font-semibold text-text-secondary">
          {strings.kpis.sales}
        </span>
        <span className="flex items-baseline gap-2.5">
          <span className="font-heading text-[28px] leading-none font-bold">
            {formatCompactMoney(data.sales)}
          </span>
          <Change value={data.salesChange} />
        </span>
        <Link
          to="/admin/money-trail"
          className="flex justify-between gap-2 rounded-input bg-off-white px-2.5 py-1.5 text-xs text-text-secondary hover:bg-border"
        >
          <span>{strings.refundsToday}</span>
          <span className="font-mono font-semibold">
            {strings.refundsLine(
              formatMoney(data.refunds.amount),
              data.refunds.count,
            )}
          </span>
        </Link>
      </Card>
      <Kpi
        label={strings.kpis.bills}
        value={formatQuantity(String(data.bills))}
      >
        <Change value={data.billsChange} />
      </Kpi>
      <Kpi label={strings.kpis.items} value={formatQuantity(data.items)}>
        <Change value={data.itemsChange} />
      </Kpi>
      <Kpi
        label={strings.kpis.low}
        value={formatQuantity(String(data.lowStockCount))}
      >
        {data.lowStockCount > 0 && (
          <span className="rounded-pill bg-warning-bg px-2 py-0.5 text-xs font-bold text-warning">
            {strings.restockSoon}
          </span>
        )}
      </Kpi>
    </div>
  );
}

function SalesChart({ data }: { data: DashboardData }) {
  const strings = t().dashboard.chart;
  const [days, setDays] = useState<7 | 30>(7);
  const series = days === 7 ? data.series7 : data.series30;
  const bars = series.map((point, index) => ({
    label:
      index === series.length - 1
        ? strings.today
        : days === 7
          ? weekdayShort(point.date)
          : "",
    value: Number(point.sales),
    caption:
      days === 7 ? formatCompactMoney(point.sales).replace("Rs ", "") : "",
    highlight: index === series.length - 1,
  }));
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold">
          {days === 7 ? strings.title : strings.title30}
        </h2>
        <div
          role="group"
          aria-label={strings.range}
          className="flex gap-1 rounded-input bg-off-white p-1"
        >
          {([7, 30] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={days === option}
              className={`h-8 rounded-[8px] px-3 text-[13px] font-semibold focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none ${days === option ? "bg-white shadow-sm" : "text-text-secondary"}`}
              onClick={() => {
                setDays(option);
              }}
            >
              {option === 7 ? strings.days7 : strings.days30}
            </button>
          ))}
        </div>
      </div>
      <BarChart label={strings.label} bars={bars} />
    </Card>
  );
}

function Categories({ data }: { data: DashboardData }) {
  const strings = t().dashboard.categories;
  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="font-heading text-lg font-bold">{strings.title}</h2>
      {data.categories.length === 0 && (
        <p className="text-sm text-text-secondary">{strings.empty}</p>
      )}
      <ul className="flex flex-col gap-3">
        {data.categories.map((category) => (
          <li key={category.name} className="flex flex-col gap-1.5">
            <div className="flex justify-between text-sm">
              <span className="font-semibold">{category.name}</span>
              <span className="font-mono text-text-secondary">
                {Math.round(Number(category.share))}%
              </span>
            </div>
            <span className="h-2 overflow-hidden rounded-pill bg-off-white">
              <span
                className={`block h-full rounded-pill ${tintClass(category.tint).split(" ")[0] ?? ""}`}
                style={{
                  width: `${category.share}%`,
                  filter: "saturate(2) brightness(0.85)",
                }}
              />
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TopProducts({ data }: { data: DashboardData }) {
  const strings = t().dashboard.top;
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold">{strings.title}</h2>
        <ButtonLink to="/admin/products" variant="secondary">
          {strings.viewProducts}
        </ButtonLink>
      </div>
      {data.topProducts.length === 0 ? (
        <p className="text-sm text-text-secondary">{strings.empty}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-start text-xs font-bold tracking-wide text-text-secondary uppercase">
              <th className="pb-2 text-start">{strings.product}</th>
              <th className="pb-2 text-end">{strings.units}</th>
              <th className="pb-2 text-end">{strings.revenue}</th>
            </tr>
          </thead>
          <tbody>
            {data.topProducts.map((product) => (
              <tr key={product.productId} className="border-t border-border">
                <td className="py-2.5 font-semibold">{product.name}</td>
                <td className="py-2.5 text-end font-mono">
                  {formatQuantity(product.units)}
                </td>
                <td className="py-2.5 text-end font-mono">
                  {formatMoney(product.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

function LowStock({ data }: { data: DashboardData }) {
  const strings = t().dashboard.lowStock;
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold">{strings.title}</h2>
        <span className="text-xs text-text-secondary">
          {strings.shown(data.lowStock.length, data.lowStockCount)}
        </span>
      </div>
      {data.lowStock.length === 0 && (
        <p className="text-sm text-text-secondary">{strings.empty}</p>
      )}
      <ul className="flex flex-col">
        {data.lowStock.map((item) => (
          <li
            key={item.productId}
            className="flex items-center gap-3 border-t border-border py-2.5 text-sm"
          >
            <span className="flex-grow font-semibold">{item.name}</span>
            <span
              className={`rounded-pill px-2.5 py-0.5 text-xs font-bold ${Number(item.stock) <= 0 ? "bg-error-bg text-error-text" : "bg-warning-bg text-warning"}`}
            >
              {Number(item.stock) <= 0
                ? strings.out
                : strings.left(formatQuantity(item.stock))}
            </span>
            <ButtonLink to="/admin/receive" variant="secondary">
              {strings.restock}
            </ButtonLink>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function DashboardRoute() {
  const strings = t().dashboard;
  const report = useAsyncData(reportRepository.dashboard);
  const settings = useAsyncData(settingsRepository.load);
  const store =
    settings.state.status === "ready" ? settings.state.data.storeName : "";
  const subtitle = strings.subtitle(
    formatWeekdayDayMonth(new Date().toISOString(), STORE_TIME_ZONE),
    store,
  );
  return (
    <div className="flex max-w-[1136px] flex-col gap-5">
      <PageHeader
        title={strings.title}
        subtitle={subtitle}
        actions={
          <>
            <ButtonLink to="/pos" variant="secondary">
              {strings.openDesk}
            </ButtonLink>
            <ButtonLink to="/admin/products/scan" variant="navy">
              {strings.scanToAdd}
            </ButtonLink>
          </>
        }
      />
      {report.state.status === "loading" && (
        <Card>
          <LoadingState />
        </Card>
      )}
      {report.state.status === "error" && (
        <Card>
          <ErrorState onRetry={report.reload} />
        </Card>
      )}
      {report.state.status === "ready" && (
        <>
          <Kpis data={report.state.data} />
          <div className="grid grid-cols-[1.6fr_1fr] items-start gap-5">
            <SalesChart data={report.state.data} />
            <Categories data={report.state.data} />
          </div>
          <div className="grid grid-cols-[1.4fr_1fr] items-start gap-5">
            <TopProducts data={report.state.data} />
            <LowStock data={report.state.data} />
          </div>
        </>
      )}
    </div>
  );
}
