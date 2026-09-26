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
import { ReturnOptions } from "~/components/pos/returns/ReturnOptions";
import { ReturnPriceTag } from "~/components/pos/returns/ReturnPriceTag";
import { RefundRecordedOverlay } from "~/components/pos/returns/RefundRecordedOverlay";
import { ReturnSummary } from "~/components/pos/returns/ReturnSummary";
import { SearchOverlay } from "~/components/pos/search/SearchOverlay";
import { useCounterKeys } from "~/components/pos/useCounterKeys";
import type { ScannedProduct } from "~/domain/bill";
import { formatPaisa } from "~/domain/money";
import type { PaymentMethod } from "~/domain/payment";
import {
  DEFAULT_REASON,
  defaultRestock,
  returnTotals,
  type CompletedReturn,
  type ReturnReason,
} from "~/domain/return";
import { t } from "~/i18n/t";
import { counterClock } from "~/infrastructure/clock";
import { catalogueStore } from "~/infrastructure/db/catalogue-store";
import { shiftStore } from "~/infrastructure/db/shift-store";
import { getDeviceCounter } from "~/infrastructure/session/device-store";
import { billLookupDeps } from "~/infrastructure/sync/bill-lookup-deps";
import {
  loadStoreSettings,
  returnScanDeps,
  searchDeps,
} from "~/infrastructure/sync/scan-deps";
import { lookupBill, normalizeBillNo } from "~/use_cases/lookup-bill";
import { processReturn } from "~/use_cases/process-return";
import { processReturnDeps } from "~/infrastructure/sync/return-deps";

export async function clientLoader() {
  const settings = await loadStoreSettings();
  const counter = await getDeviceCounter();
  return {
    shiftId: counter
      ? ((await shiftStore.current(counter.id))?.id ?? null)
      : null,
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

function useReturnOptions() {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [reason, setReason] = useState<ReturnReason>(DEFAULT_REASON);
  const [restock, setRestock] = useState(defaultRestock(DEFAULT_REASON));
  return {
    method,
    reason,
    restock,
    setMethod,
    setRestock,
    // Picking a reason resets "Put back in stock" to that reason's default.
    pickReason: (next: ReturnReason) => {
      setReason(next);
      setRestock(defaultRestock(next));
    },
  };
}

function useReturnLines() {
  const [state, dispatch] = useReducer(currentBillReducer, EMPTY_BILL);
  const add = useCallback((product: ScannedProduct) => {
    dispatch({ type: "add", product });
  }, []);
  return { state, dispatch, add };
}

// Every "New return" starts a fresh desk, so no line, bill or option leaks into the next customer.
export default function ReturnsRoute() {
  const [round, setRound] = useState(0);
  return (
    <ReturnDesk
      key={round}
      onNewReturn={() => {
        setRound((current) => current + 1);
      }}
    />
  );
}

function ReturnDesk({ onNewReturn }: { onNewReturn: () => void }) {
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
  const options = useReturnOptions();
  const totals = returnTotals(
    state.lines,
    bill.lookup.status === "found" ? bill.lookup.bill : null,
    data.taxRule,
  );
  const [recorded, setRecorded] = useState<CompletedReturn | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function refund() {
    if (!data.shiftId || totals.itemCount === 0) {
      return;
    }
    const result = await processReturn(processReturnDeps, {
      id: crypto.randomUUID(),
      shiftId: data.shiftId,
      lines: state.lines,
      bill: bill.lookup.status === "found" ? bill.lookup.bill : null,
      typedBillNo: normalizeBillNo(bill.billText),
      taxRule: data.taxRule,
      reason: options.reason,
      restock: options.restock,
      method: options.method,
      returnedAt: counterClock.now().toISOString(),
    });
    setSaveError(result.status === "saved" ? null : t().returns.notSaved);
    if (result.status === "saved") {
      setRecorded(result.ret);
    }
  }

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
      <ReturnSummary
        refund={totals.refund}
        itemCount={totals.itemCount}
        detail={strings.methods[options.method]}
      >
        <ReturnOptions
          method={options.method}
          reason={options.reason}
          restock={options.restock}
          onMethod={options.setMethod}
          onReason={options.pickReason}
          onRestock={options.setRestock}
        />
        {saveError && (
          <p
            role="alert"
            className="rounded-lg bg-error-bg px-3.5 py-2.5 text-sm font-semibold text-error-text"
          >
            {saveError}
          </p>
        )}
        <button
          type="button"
          disabled={totals.itemCount === 0}
          onClick={() => void refund()}
          className="flex h-[68px] items-center justify-center rounded-lg bg-blue text-xl font-bold text-white transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 focus-visible:outline-none active:brightness-90 disabled:cursor-default disabled:bg-border disabled:text-text-secondary"
        >
          {totals.itemCount === 0
            ? strings.scanFirst
            : strings.refundButton(formatPaisa(totals.refund))}
        </button>
      </ReturnSummary>
      {recorded && (
        <RefundRecordedOverlay ret={recorded} onNewReturn={onNewReturn} />
      )}
    </div>
  );
}
