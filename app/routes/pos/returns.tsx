import { useCallback, useMemo, useReducer, useRef, useState } from "react";
import { useLoaderData } from "react-router";

import { BillTable, type TableTexts } from "~/components/pos/bill/BillTable";
import {
  currentBillReducer,
  EMPTY_BILL,
} from "~/components/pos/bill/currentBillReducer";
import { ScanBox } from "~/components/pos/bill/ScanBox";
import { useScanner } from "~/components/pos/bill/useScanner";
import {
  BillNumberBar,
  type LookupState,
} from "~/components/pos/returns/BillNumberBar";
import { ReturnPriceTag } from "~/components/pos/returns/ReturnPriceTag";
import { ReturnSummary } from "~/components/pos/returns/ReturnSummary";
import { SearchOverlay } from "~/components/pos/search/SearchOverlay";
import { useCounterKeys } from "~/components/pos/useCounterKeys";
import type { ScannedProduct } from "~/domain/bill";
import { returnTotals } from "~/domain/return";
import { t } from "~/i18n/t";
import { catalogueStore } from "~/infrastructure/db/catalogue-store";
import { billLookupDeps } from "~/infrastructure/sync/bill-lookup-deps";
import {
  loadStoreSettings,
  returnScanDeps,
  searchDeps,
} from "~/infrastructure/sync/scan-deps";
import { lookupBill } from "~/use_cases/lookup-bill";

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

function useBillLookup() {
  const [billText, setBillText] = useState("");
  const [lookup, setLookup] = useState<LookupState>({ status: "empty" });
  const [checked, setChecked] = useState("");

  async function runLookup() {
    if (billText === checked) {
      return;
    }
    setChecked(billText);
    setLookup({ status: "looking" });
    setLookup(await lookupBill(billLookupDeps(), billText));
  }

  return { billText, setBillText, lookup, runLookup };
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
  const bill = useBillLookup();
  const totals = returnTotals(
    state.lines,
    bill.lookup.status === "found" ? bill.lookup.bill : null,
    data.taxRule,
  );
  const priced = new Map(totals.lines.map((line) => [line.productId, line]));
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
        <BillNumberBar
          value={bill.billText}
          lookup={bill.lookup}
          onChange={bill.setBillText}
          onLookup={() => void bill.runLookup()}
        />
        <BillTable
          lines={totals.lines}
          lastProductId={state.lastProductId}
          texts={returnTexts()}
          priceTag={(line) => (
            <ReturnPriceTag line={priced.get(line.productId)} />
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
