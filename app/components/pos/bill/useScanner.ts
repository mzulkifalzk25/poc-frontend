import { useRef, useState } from "react";

import type { ScannedProduct } from "~/domain/bill";
import { formatMoney } from "~/domain/money";
import { t } from "~/i18n/t";
import {
  scanProduct,
  type ScanDeps,
  type ScanResult,
} from "~/use_cases/scan-product";

import type { ScanNotice } from "./ScanBox";

// Looks up a scanned code on this PC, hands the product over and shows a short notice.
export function useScanner(
  deps: ScanDeps,
  onFound: (product: ScannedProduct) => void,
) {
  const [notice, setNotice] = useState<ScanNotice | null>(null);
  const counter = useRef(0);

  function show(tone: ScanNotice["tone"], text: string) {
    counter.current += 1;
    setNotice({ id: counter.current, tone, text });
  }

  // Returns the result so the screen can open search for an unknown barcode.
  async function scan(text: string): Promise<ScanResult> {
    const strings = t().billing;
    const result = await scanProduct(deps, text);
    if (result.status === "found") {
      onFound(result.product);
      show(
        "success",
        strings.scanned(
          result.product.name,
          formatMoney(result.product.unitPrice),
        ),
      );
    } else if (result.status === "out_of_stock") {
      show("warning", strings.outOfStock(result.name));
    }
    return result;
  }

  function added(name: string, price: string) {
    show("success", t().billing.scanned(name, formatMoney(price)));
  }

  return { notice, scan, added, notify: show };
}
