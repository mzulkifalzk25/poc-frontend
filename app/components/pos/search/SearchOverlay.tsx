import { useCallback, useDeferredValue, useState } from "react";

import { useAsyncData } from "~/components/ui/useAsyncData";
import { t } from "~/i18n/t";
import {
  searchProducts,
  type SearchDeps,
  type SearchHit,
} from "~/use_cases/search-products";

import { SearchResults } from "./SearchResults";

const RESULT_LIMIT = 8;

interface SearchOverlayProps {
  deps: SearchDeps;
  initialQuery: string;
  unknownBarcode: string | null;
  tints: Map<number, string>;
  onAdd: (hit: SearchHit) => void;
  onClose: () => void;
}

function useSearch(deps: SearchDeps, query: string) {
  const deferred = useDeferredValue(query);
  const load = useCallback(
    () => searchProducts(deps, deferred, RESULT_LIMIT),
    [deps, deferred],
  );
  const { state } = useAsyncData(load);
  return state.status === "ready" ? state.data : { hits: [], total: 0 };
}

function Banner({ barcode }: { barcode: string }) {
  return (
    <p
      role="alert"
      className="flex items-center gap-3 rounded-lg bg-error-bg px-4 py-3 text-[15px] font-semibold text-error-text"
    >
      {t().search.unknownBarcode(barcode)}
    </p>
  );
}

export function SearchOverlay({
  deps,
  initialQuery,
  unknownBarcode,
  tints,
  onAdd,
  onClose,
}: SearchOverlayProps) {
  const strings = t().search;
  const [query, setQuery] = useState(initialQuery);
  const [active, setActive] = useState(0);
  const { hits, total } = useSearch(deps, query);

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((current) =>
        Math.min(Math.max(current + step, 0), Math.max(hits.length - 1, 0)),
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const hit = hits[active];
      if (hit) {
        onAdd(hit);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  }

  return (
    <div className="absolute inset-x-5 top-5 z-20 flex flex-col gap-4">
      <div className="flex h-[60px] items-center gap-3 rounded-card border-2 border-blue bg-white px-4 focus-within:ring-2 focus-within:ring-blue focus-within:ring-offset-2">
        <input
          aria-label={strings.label}
          placeholder={strings.placeholder}
          autoComplete="off"
          autoFocus
          value={query}
          className="min-w-0 flex-grow bg-transparent text-xl text-text outline-none"
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-border-strong px-[7px] py-[3px] font-mono text-xs font-semibold text-text-secondary hover:bg-off-white focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none"
        >
          {strings.close}
        </button>
      </div>
      {unknownBarcode && <Banner barcode={unknownBarcode} />}
      <SearchResults
        query={query}
        hits={hits}
        total={total}
        activeIndex={active}
        tints={tints}
        onAdd={onAdd}
      />
    </div>
  );
}
