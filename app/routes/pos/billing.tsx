import { useCallback, useRef, useState } from "react";
import { useLoaderData } from "react-router";

import { BillActions } from "~/components/pos/bill/BillActions";
import { BillTable } from "~/components/pos/bill/BillTable";
import { useCurrentBill } from "~/components/pos/bill/CurrentBillProvider";
import { CurrentBillPanel } from "~/components/pos/bill/CurrentBillPanel";
import { PaymentSection } from "~/components/pos/bill/PaymentSection";
import { receivedPaisa } from "~/components/pos/bill/received";
import { QuickItems } from "~/components/pos/bill/QuickItems";
import { ScanBox } from "~/components/pos/bill/ScanBox";
import { useScanner } from "~/components/pos/bill/useScanner";
import { useAsyncData } from "~/components/ui/useAsyncData";
import { billTotals, type ScannedProduct } from "~/domain/bill";
import { nextBillNumber } from "~/domain/bill-number";
import { canPay } from "~/domain/payment";
import { catalogueStore } from "~/infrastructure/db/catalogue-store";
import { META_KEYS } from "~/infrastructure/db/meta-keys";
import { metaStore } from "~/infrastructure/db/meta-store";
import { getDeviceCounter } from "~/infrastructure/session/device-store";
import { loadStoreSettings, scanDeps } from "~/infrastructure/sync/scan-deps";

const QUICK_TABS = 3;
const QUICK_TILES = 8;

export async function clientLoader() {
  const counter = await getDeviceCounter();
  const settings = await loadStoreSettings();
  const lastSeq = (await metaStore.get<number>(META_KEYS.billSeq)) ?? 0;
  return {
    billNo: counter ? nextBillNumber(counter.code, lastSeq) : null,
    taxRule: {
      taxRate: settings?.taxRate ?? "0.00",
      pricesIncludeTax: settings?.pricesIncludeTax ?? false,
    },
    tabs: (await catalogueStore.categories()).slice(0, QUICK_TABS),
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

export default function BillingRoute() {
  const data = useLoaderData<typeof clientLoader>();
  const { state, dispatch } = useCurrentBill();
  const scanner = useScanner(scanDeps);
  const scanRef = useRef<HTMLInputElement>(null);
  const [tabId, setTabId] = useState(data.tabs[0]?.id ?? null);
  const quickProducts = useQuickProducts(tabId);
  const totals = billTotals(state.lines, data.taxRule);
  const payable = canPay(
    totals.itemCount,
    state.method,
    totals.total,
    receivedPaisa(state.received),
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-0">
      <section className="flex min-w-0 flex-grow flex-col gap-4 p-5">
        <div className="flex h-[60px] flex-shrink-0 gap-3">
          <ScanBox
            ref={scanRef}
            notice={scanner.notice}
            onScan={(text) => void scanner.scan(text)}
          />
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
          tabs={data.tabs}
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
          canHold={state.lines.length > 0}
          canClear={state.lines.length > 0}
          onPay={() => undefined}
          onClear={() => {
            dispatch({ type: "clear" });
          }}
        />
      </CurrentBillPanel>
    </div>
  );
}
