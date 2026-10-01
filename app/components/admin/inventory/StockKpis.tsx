import { Card } from "~/components/ui/Card";
import { formatMoney } from "~/domain/money";
import { formatQuantity } from "~/domain/product";
import type { StockSummary } from "~/domain/stock";
import { t } from "~/i18n/t";

export function StockKpis({ summary }: { summary: StockSummary }) {
  const strings = t().inventory.kpis;
  const cards = [
    { label: strings.units, value: formatQuantity(summary.unitsInStock) },
    { label: strings.value, value: formatMoney(summary.stockValue) },
    { label: strings.low, value: formatQuantity(String(summary.lowCount)) },
    { label: strings.out, value: formatQuantity(String(summary.outCount)) },
  ];
  return (
    <div className="grid grid-cols-4 gap-4">
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
