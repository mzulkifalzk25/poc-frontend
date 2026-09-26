import { useCallback, useMemo, useRef, useState } from "react";
import { useLoaderData, useNavigate } from "react-router";

import { BillActions } from "~/components/pos/bill/BillActions";
import { BillTable } from "~/components/pos/bill/BillTable";
import { useCurrentBill } from "~/components/pos/bill/CurrentBillProvider";
import { CurrentBillPanel } from "~/components/pos/bill/CurrentBillPanel";
import { PaymentReceivedOverlay } from "~/components/pos/bill/PaymentReceivedOverlay";
import { PaymentSection } from "~/components/pos/bill/PaymentSection";
import { receivedPaisa } from "~/components/pos/bill/received";
import { QuickItems } from "~/components/pos/bill/QuickItems";
import { ScanBox } from "~/components/pos/bill/ScanBox";
import { useScanner } from "~/components/pos/bill/useScanner";
import { SearchOverlay } from "~/components/pos/search/SearchOverlay";
import { useCounterKeys } from "~/components/pos/useCounterKeys";
import { useAsyncData } from "~/components/ui/useAsyncData";
import { billTotals, type ScannedProduct } from "~/domain/bill";
import { nextBillNumber } from "~/domain/bill-number";
import { completeBill, type CompletedBill } from "~/domain/completed-bill";
import { canPay } from "~/domain/payment";
import { t } from "~/i18n/t";
import { counterClock } from "~/infrastructure/clock";
import { catalogueStore } from "~/infrastructure/db/catalogue-store";
import { META_KEYS } from "~/infrastructure/db/meta-keys";
import { metaStore } from "~/infrastructure/db/meta-store";
import { shiftStore } from "~/infrastructure/db/shift-store";
import { getDeviceCounter } from "~/infrastructure/session/device-store";
import {
  loadStoreSettings,
  scanDeps,
  searchDeps,
} from "~/infrastructure/sync/scan-deps";

const QUICK_TABS = 3;
const QUICK_TILES = 8;

export async function clientLoader() {
  const counter = await getDeviceCounter();
  const settings = await loadStoreSettings();
  const lastSeq = (await metaStore.get<number>(META_KEYS.billSeq)) ?? 0;
  return {
    counterName: counter?.name ?? "",
    storeName: settings?.storeName ?? "",
    shift: counter ? await shiftStore.current(counter.id) : null,
    billNo: counter ? nextBillNumber(counter.code, lastSeq) : null,
    taxRule: {
      taxRate: settings?.taxRate ?? "0.00",
      pricesIncludeTax: settings?.pricesIncludeTax ?? false,
    },
    categories: await catalogueStore.categories(),
  };
}

function useQuickProducts(categoryId: number | null) {
  const load = useCallback(async (): Promise<ScannedProduct[]> => {
    if (categoryId === null) {
      return [];
    }
    const rows = await catalogueStore.byCategory(categoryId, QUICK_TILES);
    return rows.map((row) => ({
      productId: row.id,
      barcode: row.barcode,
      name: row.name,
      unitPrice: row.price,
    }));
  }, [categoryId]);
  const { state } = useAsyncData(load);
  return state.status === "ready" ? state.data : [];
}

interface SearchState {
  query: string;
  unknownBarcode: string | null;
}

export default function BillingRoute() {
  const data = useLoaderData<typeof clientLoader>();
  const { state, dispatch } = useCurrentBill();
  const scanner = useScanner(scanDeps);
  const scanRef = useRef<HTMLInputElement>(null);
  const tabs = data.categories.slice(0, QUICK_TABS);
  const tints = useMemo(
    () =>
      new Map(data.categories.map((category) => [category.id, category.tint])),
    [data.categories],
  );
  const [tabId, setTabId] = useState(tabs[0]?.id ?? null);
  const [search, setSearch] = useState<SearchState | null>(null);
  const [completed, setCompleted] = useState<CompletedBill | null>(null);
  const navigate = useNavigate();

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
  const quickProducts = useQuickProducts(tabId);
  const totals = billTotals(state.lines, data.taxRule);
  const payable = canPay(
    totals.itemCount,
    state.method,
    totals.total,
    receivedPaisa(state.received),
  );
  const canHold = state.lines.length > 0;

  function pay() {
    if (!payable || !data.shift || !data.billNo) {
      return;
    }
    setCompleted(
      completeBill({
        id: crypto.randomUUID(),
        paymentId: crypto.randomUUID(),
        billNo: data.billNo,
        shiftId: data.shift.id,
        cashierId: data.shift.cashierId,
        cashierName: data.shift.cashierName,
        counterName: data.counterName,
        soldAt: counterClock.now().toISOString(),
        lines: state.lines,
        taxRule: data.taxRule,
        method: state.method,
        received: receivedPaisa(state.received),
      }),
    );
  }

  function newSale() {
    dispatch({ type: "clear" });
    setCompleted(null);
    scanRef.current?.focus();
  }

  useCounterKeys({
    F2: () => {
      setSearch(null);
      scanRef.current?.focus();
    },
    Escape: search ? closeSearch : undefined,
    F9: completed ? undefined : pay,
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
              dispatch({ type: "add", product: hit.product });
              scanner.added(hit.product.name, hit.product.unitPrice);
              closeSearch();
            }}
            onClose={closeSearch}
          />
        )}
        <div className="flex h-[60px] flex-shrink-0 gap-3">
          <ScanBox
            ref={scanRef}
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
          lines={state.lines}
          lastProductId={state.lastProductId}
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
        <QuickItems
          tabs={tabs}
          selectedId={tabId}
          products={quickProducts}
          onSelect={setTabId}
          onAdd={(product) => {
            dispatch({ type: "add", product });
          }}
        />
      </section>
      <CurrentBillPanel
        billNo={data.billNo}
        itemCount={totals.itemCount}
        total={totals.total}
      >
        <PaymentSection
          method={state.method}
          received={state.received}
          total={totals.total}
          onMethod={(method) => {
            dispatch({ type: "method", method });
          }}
          onReceived={(text) => {
            dispatch({ type: "received", text });
          }}
        />
        <BillActions
          canPay={payable}
          canHold={canHold}
          canClear={state.lines.length > 0}
          onPay={pay}
          onClear={() => {
            dispatch({ type: "clear" });
          }}
        />
      </CurrentBillPanel>
      {completed && (
        <PaymentReceivedOverlay
          bill={completed}
          storeName={data.storeName}
          onPrint={() => {
            void navigate(`/pos/receipt?bill=${completed.id}`);
          }}
          onNewSale={newSale}
        />
      )}
    </div>
  );
}
