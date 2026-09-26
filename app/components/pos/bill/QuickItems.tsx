import { tintClass } from "~/components/admin/categoryTint";
import type { ScannedProduct } from "~/domain/bill";
import { formatAmount, formatMoney } from "~/domain/money";
import { t } from "~/i18n/t";

export interface QuickTab {
  id: number;
  name: string;
  tint: string;
}

interface QuickItemsProps {
  tabs: QuickTab[];
  selectedId: number | null;
  products: ScannedProduct[];
  onSelect: (categoryId: number) => void;
  onAdd: (product: ScannedProduct) => void;
}

const tabBase =
  "h-9 rounded-pill border px-3.5 text-[13px] font-semibold transition focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none";

export function QuickItems({
  tabs,
  selectedId,
  products,
  onSelect,
  onAdd,
}: QuickItemsProps) {
  const strings = t().billing;
  const tint = tabs.find((tab) => tab.id === selectedId)?.tint ?? "";
  return (
    <section
      aria-label={strings.quickItems}
      className="flex h-[220px] flex-shrink-0 flex-col gap-3 rounded-lg border border-border bg-white px-4 py-3.5"
    >
      <div
        role="tablist"
        aria-label={strings.quickItems}
        className="flex items-center gap-2"
      >
        <span className="me-2 text-[13px] font-bold tracking-[0.06em] text-text-secondary uppercase">
          {strings.quickItems}
        </span>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === selectedId}
            className={`${tabBase} ${tab.id === selectedId ? "border-navy bg-navy text-white" : "border-border-strong bg-white text-navy hover:bg-off-white active:bg-border"}`}
            onClick={() => {
              onSelect(tab.id);
            }}
          >
            {tab.name}
          </button>
        ))}
      </div>
      {products.length === 0 ? (
        <p className="flex flex-grow items-center justify-center text-sm text-text-secondary">
          {strings.quickItemsEmpty}
        </p>
      ) : (
        <div className="grid flex-grow grid-cols-4 gap-2.5">
          {products.map((product) => (
            <button
              key={product.productId}
              type="button"
              aria-label={strings.addQuick(
                product.name,
                formatMoney(product.unitPrice),
              )}
              className={`flex h-16 items-center justify-between gap-2 rounded-lg px-4 text-start transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none active:brightness-90 ${tintClass(tint)}`}
              onClick={() => {
                onAdd(product);
              }}
            >
              <span className="truncate text-[15px] font-bold">
                {product.name}
              </span>
              <span className="font-mono text-sm font-semibold">
                {formatAmount(product.unitPrice)}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
