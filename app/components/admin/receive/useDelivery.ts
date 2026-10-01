import { useMemo, useState } from "react";

import { addScanned, todayIn, type DeliveryLine } from "~/domain/delivery";
import { cleanBarcode, isPlausibleBarcode } from "~/domain/barcode";
import { t } from "~/i18n/t";
import { isApiError } from "~/infrastructure/api/errors";
import { receiptRepository } from "~/infrastructure/api/receipt-repository";
import { productRepository } from "~/infrastructure/api/product-repository";
import { STORE_TIME_ZONE } from "~/infrastructure/store-time-zone";
import { confirmDelivery, type ReceiptResult } from "~/use_cases/receive-stock";

import { writeErrorMessage } from "../writeError";

export function useDelivery(onDone: (result: ReceiptResult) => void) {
  const strings = t().receive;
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(() =>
    todayIn(STORE_TIME_ZONE),
  );
  const [lines, setLines] = useState<DeliveryLine[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [draftId, setDraftId] = useState<number | null>(null);
  const key = useMemo(() => crypto.randomUUID(), []);

  async function scan(raw: string) {
    const code = cleanBarcode(raw);
    if (!isPlausibleBarcode(code)) {
      return;
    }
    setScanError(null);
    try {
      const product = await productRepository.byBarcode(code);
      setLines((current) => addScanned(current, product));
    } catch (failure) {
      if (isApiError(failure) && failure.status === 404) {
        setScanError(strings.unknown(code));
      } else if (failure instanceof TypeError) {
        setScanError(strings.lookupOffline);
      } else {
        setScanError(strings.lookupFailed);
      }
    }
  }

  function changeLine(productId: number, changes: Partial<DeliveryLine>) {
    setError(null);
    setLines((current) =>
      current.map((line) =>
        line.productId === productId ? { ...line, ...changes } : line,
      ),
    );
  }

  async function confirm() {
    setPending(true);
    setError(null);
    const outcome = await confirmDelivery(
      receiptRepository,
      { supplierId, invoiceNo, deliveryDate, lines },
      { draftId, key },
    );
    setPending(false);
    if ("draftId" in outcome && outcome.draftId !== undefined) {
      setDraftId(outcome.draftId);
    }
    if (outcome.status === "done") {
      onDone(outcome.value);
    } else if (outcome.status === "rejected") {
      setError(strings.errors[outcome.error]);
    } else {
      setError(writeErrorMessage(outcome));
    }
  }

  return {
    supplierId,
    setSupplierId,
    invoiceNo,
    setInvoiceNo,
    deliveryDate,
    setDeliveryDate,
    lines,
    scan,
    scanError,
    changeLine,
    removeLine: (productId: number) => {
      setLines((current) => current.filter((l) => l.productId !== productId));
    },
    confirm,
    pending,
    error,
  };
}
