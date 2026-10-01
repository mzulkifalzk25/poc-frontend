import { Card } from "~/components/ui/Card";
import { formatClockTime, formatDayMonth } from "~/domain/dates";
import { signedQuantity, type StockMovement } from "~/domain/stock";
import { t } from "~/i18n/t";
import { STORE_TIME_ZONE } from "~/infrastructure/store-time-zone";

export function RecentAdjustments({ items }: { items: StockMovement[] }) {
  const strings = t().inventory;
  return (
    <Card className="flex flex-col gap-3 p-5">
      <h2 className="font-heading text-lg font-bold">{strings.recent}</h2>
      {items.length === 0 && (
        <p className="text-sm text-text-secondary">{strings.recentEmpty}</p>
      )}
      <ul className="flex flex-col">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 border-b border-border py-3 last:border-b-0"
          >
            <span
              className={`min-w-14 font-mono text-sm font-semibold ${Number(item.qtyDelta) < 0 ? "text-error-text" : "text-success-text"}`}
            >
              {signedQuantity(item.qtyDelta)}
            </span>
            <span className="flex min-w-0 flex-grow flex-col">
              <span className="truncate text-sm font-semibold">
                {item.productName}
              </span>
              <span className="text-xs text-text-secondary">
                {strings.reasons[item.reason] ?? strings.reasons[""]}
                {item.userName ? ` · ${item.userName}` : ""}
              </span>
            </span>
            <span className="text-xs text-text-secondary">
              {formatDayMonth(item.occurredAt, STORE_TIME_ZONE)}{" "}
              {formatClockTime(item.occurredAt, STORE_TIME_ZONE)}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-text-secondary">{strings.recentNote}</p>
    </Card>
  );
}
