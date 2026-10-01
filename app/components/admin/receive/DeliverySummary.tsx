import { Button } from "~/components/ui/Button";
import { ButtonLink } from "~/components/ui/ButtonLink";
import { Card } from "~/components/ui/Card";
import {
  costRiseCount,
  deliverySummary,
  type DeliveryLine,
} from "~/domain/delivery";
import { formatMoney } from "~/domain/money";
import { formatQuantity } from "~/domain/product";
import { t } from "~/i18n/t";

interface DeliverySummaryProps {
  lines: DeliveryLine[];
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
}

export function DeliverySummary(props: DeliverySummaryProps) {
  const strings = t().receive;
  const totals = deliverySummary(props.lines);
  const rises = costRiseCount(props.lines);
  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 p-5">
        <h2 className="font-heading text-lg font-bold">
          {strings.summary.title}
        </h2>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-text-secondary">{strings.summary.lines}</dt>
            <dd className="font-mono font-semibold">{totals.lines}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-secondary">{strings.summary.units}</dt>
            <dd className="font-mono font-semibold">
              {formatQuantity(String(totals.units))}
            </dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <dt className="font-semibold">{strings.summary.total}</dt>
            <dd className="font-mono text-lg font-semibold">
              {formatMoney(totals.total)}
            </dd>
          </div>
        </dl>
        <p className="text-xs text-text-secondary">{strings.moneyNote}</p>
      </Card>
      {rises > 0 && (
        <div className="flex flex-col gap-1.5 rounded-card bg-warning-bg p-4 text-sm text-warning">
          <p className="font-bold">{strings.warning.title(rises)}</p>
          <p>{strings.warning.body}</p>
          <ButtonLink
            to="/admin/products"
            variant="secondary"
            className="mt-1 self-start"
          >
            {strings.warning.review}
          </ButtonLink>
        </div>
      )}
      {props.error && (
        <p
          role="alert"
          className="rounded-input bg-error-bg px-3.5 py-2.5 text-sm font-semibold text-error-text"
        >
          {props.error}
        </p>
      )}
      <Button disabled={props.pending} onClick={props.onConfirm}>
        {props.pending ? strings.confirming : strings.confirm}
      </Button>
    </div>
  );
}
