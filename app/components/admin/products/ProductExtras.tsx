import type { AsyncState } from "~/components/ui/useAsyncData";
import { formatDayMonth } from "~/domain/dates";
import { formatMoney } from "~/domain/money";
import type { PriceChange } from "~/domain/product";
import { parseAmountInput } from "~/domain/product-draft";
import { profitPerUnit } from "~/domain/profit";
import { t } from "~/i18n/t";
import { STORE_TIME_ZONE } from "~/infrastructure/store-time-zone";

export function ProfitLine({ price, cost }: { price: string; cost: string }) {
  const strings = t().productEdit;
  const sell = parseAmountInput(price, 2);
  const buy = parseAmountInput(cost, 2);
  const profit = sell && buy ? profitPerUnit(sell, buy) : null;
  return (
    <div
      role="status"
      aria-label={strings.profit}
      className="flex items-center justify-between rounded-input bg-off-white px-3.5 py-2.5 text-[13px]"
    >
      <span className="text-text-secondary">{strings.profit}</span>
      <span
        className={`font-mono font-semibold ${profit && profit.profit < 0 ? "text-error-text" : "text-blue"}`}
      >
        {profit
          ? strings.profitValue(
              formatMoney(profit.profit),
              profit.marginPercent,
            )
          : strings.noProfit}
      </span>
    </div>
  );
}

function HistoryRows({ rows }: { rows: PriceChange[] }) {
  const strings = t().productEdit;
  if (rows.length === 0) {
    return (
      <p className="text-[13px] text-text-secondary">{strings.historyEmpty}</p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => (
        <li
          key={`${row.when}-${row.newPrice}`}
          className="flex justify-between text-[13px]"
        >
          <span className="text-text-secondary">
            {strings.historyRow(
              formatDayMonth(row.when, STORE_TIME_ZONE),
              row.who,
            )}
          </span>
          <span className="font-mono">
            {strings.historyChange(
              formatMoney(row.oldPrice),
              formatMoney(row.newPrice),
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function PriceHistoryBox({
  state,
}: {
  state: AsyncState<PriceChange[]>;
}) {
  const strings = t().productEdit;
  return (
    <section className="flex flex-col gap-2 rounded-lg border border-border px-4 py-3.5">
      <h3 className="text-[13px] font-semibold">{strings.history}</h3>
      {state.status === "loading" && (
        <p className="text-[13px] text-text-secondary">{t().states.loading}</p>
      )}
      {state.status === "error" && (
        <p className="text-[13px] text-error-text">{strings.historyFailed}</p>
      )}
      {state.status === "ready" && <HistoryRows rows={state.data} />}
    </section>
  );
}
