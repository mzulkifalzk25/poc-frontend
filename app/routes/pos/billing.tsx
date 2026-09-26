import { useRef } from "react";

import { BillTable } from "~/components/pos/bill/BillTable";
import { useCurrentBill } from "~/components/pos/bill/CurrentBillProvider";
import { ScanBox } from "~/components/pos/bill/ScanBox";
import { useScanner } from "~/components/pos/bill/useScanner";
import { t } from "~/i18n/t";
import { scanDeps } from "~/infrastructure/sync/scan-deps";

export const handle = { title: t().billing.title };

export default function BillingRoute() {
  const { state, dispatch } = useCurrentBill();
  const scanner = useScanner(scanDeps);
  const scanRef = useRef<HTMLInputElement>(null);

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
      </section>
    </div>
  );
}
