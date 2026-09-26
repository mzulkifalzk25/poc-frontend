import { useRef, useState } from "react";

import { formatMoney } from "~/domain/money";
import { t } from "~/i18n/t";
import { scanProduct, type ScanDeps } from "~/use_cases/scan-product";

import { useCurrentBill } from "./CurrentBillProvider";
import type { ScanNotice } from "./ScanBox";

// Looks up a scanned code on this PC, adds it to the bill and shows a short notice.
export function useScanner(deps: ScanDeps) {
  const { dispatch } = useCurrentBill();
  const [notice, setNotice] = useState<ScanNotice | null>(null);
  const counter = useRef(0);

  function show(tone: ScanNotice["tone"], text: string) {
    counter.current += 1;
    setNotice({ id: counter.current, tone, text });
  }

  async function scan(text: string) {
    const strings = t().billing;
    const result = await scanProduct(deps, text);
    if (result.status === "found") {
      dispatch({ type: "add", product: result.product });
      show(
        "success",
        strings.scanned(
          result.product.name,
          formatMoney(result.product.unitPrice),
        ),
      );
    } else if (result.status === "unknown") {
      show("warning", strings.unknownBarcode(result.barcode));
    } else if (result.status === "out_of_stock") {
      show("warning", strings.outOfStock(result.name));
    }
  }

  return { notice, scan };
}
