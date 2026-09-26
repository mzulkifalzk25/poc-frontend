import { tintClass } from "~/components/admin/categoryTint";
import { formatMoney } from "~/domain/money";
import { formatQuantity, productInitials } from "~/domain/product";
import { t } from "~/i18n/t";
import type { SearchHit } from "~/use_cases/search-products";

interface SearchResultsProps {
  query: string;
  hits: SearchHit[];
  total: number;
  activeIndex: number;
  tints: Map<number, string>;
  onAdd: (hit: SearchHit) => void;
}

function StockBadge({ stock }: { stock: string | null }) {
  const strings = t().search;
  if (stock === null) {
    return null;
  }
  const out = Number(stock) <= 0;
  return (
    <span
      className={`rounded-pill px-[9px] py-1 text-xs font-bold ${out ? "bg-error-bg text-error-text" : "bg-[#E1ECF6] text-blue"}`}
    >
      {out ? strings.out : strings.inStock(formatQuantity(stock))}
    </span>
  );
}

export function SearchResults({
  query,
  hits,
  total,
  activeIndex,
  tints,
  onAdd,
}: SearchResultsProps) {
  const strings = t().search;
  const tooShort = query.trim().length < 2;
  return (
    <div className="w-[700px] max-w-full overflow-hidden rounded-card border border-border-strong bg-white shadow-[0_16px_40px_rgba(15,39,66,0.18)]">
      <p className="border-b border-border bg-off-white px-4 py-2.5 text-xs font-bold tracking-[0.05em] text-text-secondary uppercase">
        {tooShort
          ? strings.typeToSearch
          : total === 0
            ? strings.noMatches(query.trim())
            : strings.matches(total, query.trim())}
      </p>
      <ul role="listbox" aria-label={strings.results}>
        {hits.map((hit, index) => (
          <li
            key={hit.product.productId}
            role="option"
            aria-selected={index === activeIndex}
            className={`flex h-16 cursor-pointer items-center gap-3.5 border-b border-border px-4 hover:bg-off-white ${index === activeIndex ? "bg-[#EAF2FA]" : "bg-white"}`}
            onClick={() => {
              onAdd(hit);
            }}
          >
            <span
              aria-hidden="true"
              className={`flex h-10 w-10 items-center justify-center rounded-input text-[13px] font-bold ${tintClass(tints.get(hit.categoryId ?? -1) ?? "")}`}
            >
              {productInitials(hit.product.name)}
            </span>
            <span className="flex min-w-0 flex-grow flex-col gap-0.5">
              <span className="truncate text-base font-semibold">
                {hit.product.name}
              </span>
              <span className="font-mono text-xs text-text-secondary">
                {hit.product.barcode}
              </span>
            </span>
            <StockBadge stock={hit.stock} />
            <span className="min-w-20 text-end font-mono text-base font-semibold">
              {formatMoney(hit.product.unitPrice)}
            </span>
          </li>
        ))}
      </ul>
      {hits.length > 0 && (
        <p className="px-4 py-2.5 text-xs text-text-secondary">
          {strings.hint}
        </p>
      )}
    </div>
  );
}
