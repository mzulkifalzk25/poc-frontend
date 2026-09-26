import { lineTotal } from "~/domain/bill";
import { formatBillNumber } from "~/domain/bill-number";
import type { CompletedBill } from "~/domain/completed-bill";
import { formatClockTime, formatDayMonthYear } from "~/domain/dates";
import { formatAmount, formatPaisa } from "~/domain/money";
import type { StoreSettings } from "~/domain/store-settings";
import { t } from "~/i18n/t";

import { BillBarcode } from "./BillBarcode";

interface ReceiptViewProps {
  bill: CompletedBill;
  settings: StoreSettings | null;
  timeZone: string;
}

function Row({
  left,
  right,
  strong = false,
}: {
  left: string;
  right: string;
  strong?: boolean;
}) {
  return (
    <p
      className={`flex justify-between gap-3 ${strong ? "text-base font-semibold text-black" : ""}`}
    >
      <span>{left}</span>
      <span>{right}</span>
    </p>
  );
}

const Rule = () => <hr className="border-dashed border-[#8E9BAD]" />;

function Totals({ bill }: { bill: CompletedBill }) {
  const strings = t().receipt;
  const { totals, payment } = bill;
  return (
    <>
      <Row
        left={strings.subtotal}
        right={formatAmount(totals.subtotal / 100)}
      />
      {totals.tax > 0 && (
        <Row
          left={strings.tax(String(Number(bill.taxRate)))}
          right={formatAmount(totals.tax / 100)}
        />
      )}
      {totals.rounding !== 0 && (
        <Row
          left={strings.rounding}
          right={(totals.rounding / 100).toFixed(2)}
        />
      )}
      <Row left={strings.total} right={formatPaisa(totals.total)} strong />
      {payment.tendered !== null && payment.change !== null ? (
        <>
          <Row
            left={strings.cashReceived}
            right={formatAmount(payment.tendered / 100)}
          />
          <Row
            left={strings.change}
            right={formatAmount(payment.change / 100)}
          />
        </>
      ) : (
        <p>{strings.paidBy(t().billing.payment.methods[payment.method])}</p>
      )}
    </>
  );
}

// An 80 mm thermal receipt; the print CSS sets the page size.
export function ReceiptView({ bill, settings, timeZone }: ReceiptViewProps) {
  const strings = t().receipt;
  const billNo = formatBillNumber(bill.billNo);
  const showBarcode = settings?.receiptShowBarcode ?? true;
  return (
    <article
      aria-label={strings.bill(billNo)}
      className="receipt-80 flex flex-col gap-[9px] bg-white px-5 pt-6 pb-7 font-mono text-xs leading-[1.35] text-[#25405F]"
    >
      <header className="flex flex-col gap-0.5 text-center">
        <p className="text-base font-semibold text-black uppercase">
          {settings?.storeName}
        </p>
        {settings?.address && <p>{settings.address}</p>}
        {settings?.phone && <p>{settings.phone}</p>}
        {settings?.receiptHeader && <p>{settings.receiptHeader}</p>}
      </header>
      <Rule />
      <Row left={strings.bill(billNo)} right={bill.counterName} />
      <Row
        left={formatDayMonthYear(bill.soldAt, timeZone)}
        right={formatClockTime(bill.soldAt, timeZone)}
      />
      <p>{strings.cashier(bill.cashierName.split(" ")[0] ?? "")}</p>
      <Rule />
      {bill.lines.map((line) => (
        <div key={line.productId} className="flex flex-col gap-px">
          <p>{line.name}</p>
          <p className="flex justify-between text-[#61738A]">
            <span>
              {line.qty} × {formatAmount(line.unitPrice)}
            </span>
            <span className="text-black">
              {formatAmount(lineTotal(line) / 100)}
            </span>
          </p>
        </div>
      ))}
      <Rule />
      <Totals bill={bill} />
      <Rule />
      {showBarcode && (
        <div className="mt-1 flex flex-col gap-1 text-center">
          <BillBarcode
            value={bill.billNo}
            label={strings.barcodeLabel(billNo)}
          />
          <p>{billNo}</p>
        </div>
      )}
      {settings?.receiptFooter && (
        <p className="mt-1 text-center">{settings.receiptFooter}</p>
      )}
    </article>
  );
}
