import { BillBarcode } from "~/components/pos/receipt/BillBarcode";
import { Card } from "~/components/ui/Card";
import { formatAmount, formatMoney } from "~/domain/money";
import type { StoreSettings } from "~/domain/store-settings";
import { t } from "~/i18n/t";

// Sample lines from the design board; only the store's own text is live.
const SAMPLE_LINES = [
  { qty: 2, name: "Fresh Milk 1L", amount: 580 },
  { qty: 1, name: "Cooking Oil 1L", amount: 620 },
  { qty: 1, name: "Bread Loaf", amount: 150 },
];
const SAMPLE_TOTAL = 1350;
const SAMPLE_BILL_NO = "002000743";

export function ReceiptPreview({ settings }: { settings: StoreSettings }) {
  const strings = t().settings.preview;
  const narrow = settings.receiptPaperMm === 58;
  return (
    <Card className="flex flex-col gap-4 p-6">
      <h2 className="font-heading text-lg font-bold">{strings.title}</h2>
      <div
        aria-label={strings.title}
        className={`mx-auto flex w-full flex-col gap-2 rounded-md bg-white px-5 py-6 font-mono text-[13px] text-[#222] shadow-[0_2px_10px_rgba(15,39,66,0.12)] ${
          narrow ? "max-w-[230px]" : "max-w-[320px]"
        }`}
      >
        <p className="text-center font-bold uppercase">{settings.storeName}</p>
        {settings.receiptHeader && (
          <p className="text-center">{settings.receiptHeader}</p>
        )}
        <hr className="border-dashed border-[#8E9BAD]" />
        {SAMPLE_LINES.map((line) => (
          <p key={line.name} className="flex justify-between gap-3">
            <span>{strings.line(line.qty, line.name)}</span>
            <span>{formatAmount(line.amount)}</span>
          </p>
        ))}
        <hr className="border-dashed border-[#8E9BAD]" />
        <p className="flex justify-between text-base font-semibold text-black">
          <span>{strings.total}</span>
          <span>{formatMoney(SAMPLE_TOTAL)}</span>
        </p>
        {settings.receiptShowBarcode && (
          <BillBarcode value={SAMPLE_BILL_NO} label={strings.barcode} />
        )}
        {settings.receiptFooter && (
          <p className="text-center">{settings.receiptFooter}</p>
        )}
      </div>
      <p className="text-[13px] text-text-secondary">{strings.hint}</p>
    </Card>
  );
}
