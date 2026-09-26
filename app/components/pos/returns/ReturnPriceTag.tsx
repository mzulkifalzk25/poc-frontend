import type { PricedReturnLine } from "~/domain/return";
import { t } from "~/i18n/t";

export function ReturnPriceTag({
  line,
}: {
  line: PricedReturnLine | undefined;
}) {
  const strings = t().returns;
  if (!line) {
    return null;
  }
  const warn = line.changed || line.notOnBill;
  let text: string = strings.todayPrice;
  if (line.notOnBill) {
    text = strings.notOnBill;
  } else if (line.source === "paid") {
    text = line.changed ? strings.pricePaid : strings.fromBill;
  }
  return (
    <span
      className={`text-[11px] font-bold ${warn ? "text-warning" : "text-text-secondary"}`}
    >
      {text}
    </span>
  );
}
