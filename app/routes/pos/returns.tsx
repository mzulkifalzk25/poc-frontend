import { useCallback, useMemo, useReducer, useRef, useState } from "react";
import { useLoaderData } from "react-router";

import { BillTable, type TableTexts } from "~/components/pos/bill/BillTable";
import {
  currentBillReducer,
  EMPTY_BILL,
} from "~/components/pos/bill/currentBillReducer";
import { ScanBox } from "~/components/pos/bill/ScanBox";
import { useScanner } from "~/components/pos/bill/useScanner";
import { ReturnSummary } from "~/components/pos/returns/ReturnSummary";
import { SearchOverlay } from "~/components/pos/search/SearchOverlay";
import { useCounterKeys } from "~/components/pos/useCounterKeys";
import type { ScannedProduct } from "~/domain/bill";
import { returnTotals } from "~/domain/return";
import { t } from "~/i18n/t";
import { catalogueStore } from "~/infrastructure/db/catalogue-store";
import {
  loadStoreSettings,
  returnScanDeps,
  searchDeps,
} from "~/infrastructure/sync/scan-deps";

export async function clientLoader() {
  const settings = await loadStoreSettings();
  return {
    taxRule: {
      taxRate: settings?.taxRate ?? "0.00",
      pricesIncludeTax: settings?.pricesIncludeTax ?? false,
    },
    categories: await catalogueStore.categories(),
  };
}

function returnTexts(): TableTexts {
  const strings = t().returns;
  return {
    label: strings.tableLabel,
    item: strings.item,
    total: strings.refund,
    emptyTitle: strings.emptyTitle,
    emptyHint: strings.emptyHint,
  };
}

function useReturnLines() {
  const [state, dispatch] = useReducer(currentBillReducer, EMPTY_BILL);
  const add = useCallback((product: ScannedProduct) => {
    dispatch({ type: "add", product });
  }, []);
  return { state, dispatch, add };
}

export default function ReturnsRoute() {
  const data = useLoaderData<typeof clientLoader>();
  const { state, dispatch, add } = useReturnLines();
  const scanner = useScanner(returnScanDeps, add);
  const scanRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState<{
    query: string;
    unknownBarcode: string | null;
  } | null>(null);
  const tints = useMemo(
    () =>
      new Map(data.categories.map((category) => [category.id, category.tint])),
    [data.categories],
  );
  const totals = returnTotals(state.lines, null, data.taxRule);
  const strings = t().returns;

  function closeSearch() {
    setSearch(null);
    scanRef.current?.focus();
  }

  async function handleScan(text: string) {
    const result = await scanner.scan(text);
    if (result.status === "unknown") {
      setSearch({ query: "", unknownBarcode: result.barcode });
    }
  }

  useCounterKeys({
    F2: () => {
      setSearch(null);
      scanRef.current?.focus();
    },
    Escape: search ? closeSearch : undefined,
  });

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-0">
      <section className="relative flex min-w-0 flex-grow flex-col gap-4 p-5">
        {search && (
          <SearchOverlay
            deps={searchDeps}
            initialQuery={search.query}
            unknownBarcode={search.unknownBarcode}
            tints={tints}
            onAdd={(hit) => {
              add(hit.product);
              scanner.added(hit.product.name, hit.product.unitPrice);
              closeSearch();
            }}
            onClose={closeSearch}
          />
        )}
        <div className="flex h-[60px] flex-shrink-0 gap-3">
          <ScanBox
            ref={scanRef}
            label={strings.scanLabel}
            placeholder={strings.scanPlaceholder}
            notice={scanner.notice}
            onScan={(text) => void handleScan(text)}
            onLetters={(text) => {
              setSearch({ query: text, unknownBarcode: null });
            }}
          />
          <button
            type="button"
            className="h-[60px] rounded-card border-[1.5px] border-navy bg-white px-5 text-base font-bold text-text transition hover:bg-off-white focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none active:bg-border"
            onClick={() => {
              setSearch({ query: "", unknownBarcode: null });
            }}
          >
            {t().search.findItem}
          </button>
        </div>
        <BillTable
          lines={totals.lines}
          lastProductId={state.lastProductId}
          texts={returnTexts()}
          priceTag={() => (
            <span className="text-[11px] font-bold text-text-secondary">
              {strings.todayPrice}
            </span>
          )}
          footer={
            <p className="flex-shrink-0 border-t border-border bg-off-white px-4 py-3 text-[13px] leading-normal text-text-secondary">
              {strings.note}
            </p>
          }
          onSetQty={(productId, qty) => {
            dispatch({ type: "setQty", productId, qty });
          }}
          onChange={(productId, delta) => {
            dispatch({ type: "change", productId, delta });
          }}
          onRemove={(productId) => {
            dispatch({ type: "remove", productId });
          }}
        />
      </section>
      <ReturnSummary refund={totals.refund} itemCount={totals.itemCount} />
    </div>
  );
}
