import { formatBillNumber } from "~/domain/bill-number";
import { lineTotal } from "~/domain/bill";
import type { CompletedBill } from "~/domain/completed-bill";
import { formatAmount, formatPaisa } from "~/domain/money";
import { t } from "~/i18n/t";

interface PaymentReceivedOverlayProps {
  bill: CompletedBill;
  storeName: string;
  onPrint: () => void;
  onNewSale: () => void;
}

function ReceiptPreview({
  bill,
  storeName,
}: Pick<PaymentReceivedOverlayProps, "bill" | "storeName">) {
  const strings = t().billing.payment;
  return (
    <div
      aria-label={strings.previewLabel}
      role="document"
      className="flex max-h-[260px] flex-col gap-2 overflow-y-auto rounded-lg border border-dashed border-border-strong bg-off-white p-4 font-mono text-xs text-ink-soft"
    >
      <p className="text-center font-semibold text-text uppercase">
        {storeName}
      </p>
      <p className="text-center">
        {strings.previewBill(formatBillNumber(bill.billNo))}
      </p>
      <hr className="border-dashed border-border-strong" />
      {bill.lines.map((line) => (
        <p key={line.productId} className="flex justify-between gap-3">
          <span>
            {line.qty} × {line.name}
          </span>
          <span>{formatAmount(lineTotal(line) / 100)}</span>
        </p>
      ))}
      <hr className="border-dashed border-border-strong" />
      <p className="flex justify-between text-sm font-semibold text-text">
        <span>{strings.previewTotal}</span>
        <span>{formatPaisa(bill.totals.total)}</span>
      </p>
    </div>
  );
}

export function PaymentReceivedOverlay({
  bill,
  storeName,
  onPrint,
  onNewSale,
}: PaymentReceivedOverlayProps) {
  const strings = t().billing.payment;
  const change =
    bill.payment.change === null ? null : formatPaisa(bill.payment.change);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-received"
        className="flex max-h-[840px] w-[440px] max-w-full flex-col gap-[18px] rounded-[20px] bg-white p-7 text-text shadow-[0_24px_60px_rgba(15,39,66,0.35)]"
      >
        <div className="flex flex-col items-center gap-2.5 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-bg">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#20A86B"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12l5 5 9-10" />
            </svg>
          </span>
          <h2
            id="payment-received"
            className="font-heading text-[26px] font-bold"
          >
            {strings.receivedTitle}
          </h2>
          <p className="text-[15px] text-text-secondary">
            {strings.summary(
              formatPaisa(bill.totals.total),
              strings.methods[bill.payment.method],
              change,
            )}
          </p>
        </div>
        <ReceiptPreview bill={bill} storeName={storeName} />
        <p className="text-center text-[13px] text-text-secondary">
          {strings.savedHere}
        </p>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onPrint}
            className="h-[52px] flex-grow rounded-lg border-[1.5px] border-navy bg-white text-base font-bold transition hover:bg-off-white focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none active:bg-border"
          >
            {strings.printReceipt}
          </button>
          <button
            type="button"
            autoFocus
            onClick={onNewSale}
            className="h-[52px] flex-grow rounded-lg bg-blue text-base font-bold text-white transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 focus-visible:outline-none active:brightness-90"
          >
            {strings.newSale}
          </button>
        </div>
      </section>
    </div>
  );
}
