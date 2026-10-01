import { ButtonLink } from "~/components/ui/ButtonLink";
import { Card } from "~/components/ui/Card";
import { ErrorState, LoadingState } from "~/components/ui/StateBlocks";
import type { AsyncState } from "~/components/ui/useAsyncData";
import { formatBillNumber } from "~/domain/bill-number";
import { formatClockTime, formatDayMonthYear } from "~/domain/dates";
import { formatMoney } from "~/domain/money";
import { formatQuantity } from "~/domain/product";
import type { BillDetail } from "~/domain/sale";
import { t } from "~/i18n/t";
import { STORE_TIME_ZONE } from "~/infrastructure/store-time-zone";

function Line({
  left,
  right,
  strong = false,
}: {
  left: string;
  right: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-3 ${strong ? "border-t border-border pt-2 text-base font-semibold" : "text-sm"}`}
    >
      <dt className={strong ? "" : "text-text-secondary"}>{left}</dt>
      <dd className="font-mono">{right}</dd>
    </div>
  );
}

function Detail({ bill }: { bill: BillDetail }) {
  const strings = t().sales.panel;
  const methods = t().sales.methods;
  const { totals, payment } = bill;
  return (
    <>
      <div className="flex flex-col gap-0.5">
        <h2 className="font-mono text-xl font-bold">
          {formatBillNumber(bill.billNo)}
        </h2>
        <p className="text-sm text-text-secondary">
          {formatDayMonthYear(bill.time, STORE_TIME_ZONE)} ·{" "}
          {formatClockTime(bill.time, STORE_TIME_ZONE)}
        </p>
      </div>
      <dl className="flex flex-col gap-1.5">
        <Line left={strings.cashier} right={bill.cashier} />
        <Line left={strings.counter} right={bill.counterName} />
        {payment && (
          <Line left={strings.payment} right={methods[payment.method]} />
        )}
        {payment?.tendered && (
          <Line left={strings.tendered} right={formatMoney(payment.tendered)} />
        )}
        {payment?.changeGiven && (
          <Line
            left={strings.change}
            right={formatMoney(payment.changeGiven)}
          />
        )}
      </dl>
      <ul className="flex flex-col border-y border-border">
        {bill.items.map((item) => (
          <li
            key={item.lineNo}
            className="flex items-start justify-between gap-3 py-2 text-sm"
          >
            <span className="flex flex-col">
              <span className="font-semibold">{item.name}</span>
              <span className="font-mono text-xs text-text-secondary">
                {formatQuantity(item.qty)} × {formatMoney(item.unitPrice)}
              </span>
            </span>
            <span className="font-mono font-semibold">
              {formatMoney(item.lineTotal)}
            </span>
          </li>
        ))}
      </ul>
      <dl className="flex flex-col gap-1.5">
        <Line left={strings.subtotal} right={formatMoney(totals.subtotal)} />
        {Number(totals.tax) > 0 && (
          <Line left={strings.tax} right={formatMoney(totals.tax)} />
        )}
        {Number(totals.rounding) !== 0 && (
          <Line left={strings.rounding} right={formatMoney(totals.rounding)} />
        )}
        <Line left={strings.total} right={formatMoney(totals.total)} strong />
      </dl>
      {bill.returns.length > 0 && (
        <div className="flex flex-col gap-1 rounded-input bg-warning-bg p-3 text-sm text-warning">
          <p className="font-bold">{strings.refunds}</p>
          {bill.returns.map((record) => (
            <p key={record.id} className="font-mono">
              {strings.refundLine(
                formatMoney(record.refundTotal),
                record.refundMethod,
              )}
            </p>
          ))}
        </div>
      )}
      <ButtonLink
        to={`/admin/receipt?bill=${bill.id}`}
        variant="navy"
        target="_blank"
      >
        {strings.reprint}
      </ButtonLink>
      <p className="text-xs text-text-secondary">{strings.note}</p>
    </>
  );
}

export function BillPanel({
  state,
  onRetry,
}: {
  state: AsyncState<BillDetail> | null;
  onRetry: () => void;
}) {
  const strings = t().sales.panel;
  return (
    <Card
      aria-label={strings.title}
      className="sticky top-8 flex flex-col gap-4 p-5"
    >
      {state === null && (
        <p className="py-10 text-center text-sm text-text-secondary">
          {strings.pick}
        </p>
      )}
      {state?.status === "loading" && <LoadingState />}
      {state?.status === "error" && <ErrorState onRetry={onRetry} />}
      {state?.status === "ready" && <Detail bill={state.data} />}
    </Card>
  );
}
