import { useState } from "react";

import { cleanBarcode } from "~/domain/barcode";
import type { ProductDetail, ProductSummary } from "~/domain/product";
import type { NewProductDraft } from "~/domain/product-draft";
import { t } from "~/i18n/t";
import type { ProductRepository } from "~/use_cases/manage-products";
import {
  createProduct,
  lookupBarcode,
  type BarcodeLookup,
} from "~/use_cases/scan-to-add";

import { fieldMessages, type FieldMessages } from "../products/fieldMessages";
import { writeErrorMessage } from "../writeError";

export type ScanPhase = "scanning" | "looking" | "new";

const DEFAULT_LOW_STOCK = "10";

export function blankDraft(barcode: string): NewProductDraft {
  return {
    barcode,
    name: "",
    categoryId: null,
    unit: "pcs",
    price: "",
    cost: "",
    stock: "",
    lowStockAlert: DEFAULT_LOW_STOCK,
  };
}

function lookupErrorMessage(found: BarcodeLookup): string | null {
  const strings = t().scanAdd;
  switch (found.status) {
    case "offline":
      return strings.lookupOffline;
    case "failed":
      return strings.lookupFailed;
    default:
      return null;
  }
}

interface ScanOptions {
  repo: ProductRepository;
  onKnown: (product: ProductSummary) => void;
  onCreated: (product: ProductDetail, scanNext: boolean) => void;
}

export function useScanToAdd({ repo, onKnown, onCreated }: ScanOptions) {
  const [phase, setPhase] = useState<ScanPhase>("scanning");
  const [draft, setDraft] = useState<NewProductDraft>(blankDraft(""));
  const [scanError, setScanError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldMessages>({});
  const [addedCount, setAddedCount] = useState(0);
  const [lastCategoryId, setLastCategoryId] = useState<number | null>(null);

  async function scan(raw: string) {
    if (phase === "new" && cleanBarcode(raw) === draft.barcode) {
      return;
    }
    setPhase("looking");
    setScanError(null);
    const found = await lookupBarcode(repo, raw);
    if (found.status === "known") {
      setPhase("scanning");
      onKnown(found.product);
    } else if (found.status === "unknown") {
      setDraft({ ...blankDraft(found.barcode), categoryId: lastCategoryId });
      setErrors({});
      setError(null);
      setPhase("new");
    } else {
      setPhase("scanning");
      setScanError(lookupErrorMessage(found));
    }
  }

  function finishSaved(product: ProductDetail, scanNext: boolean) {
    setErrors({});
    setAddedCount((total) => total + 1);
    setLastCategoryId(draft.categoryId);
    if (scanNext) {
      setDraft({ ...blankDraft(""), categoryId: draft.categoryId });
      setPhase("scanning");
    }
    onCreated(product, scanNext);
  }

  async function save(scanNext: boolean): Promise<void> {
    setPending(true);
    setError(null);
    const outcome = await createProduct(repo, draft);
    setPending(false);
    if (outcome.status === "done") {
      finishSaved(outcome.value, scanNext);
      return;
    }
    if (outcome.status === "rejected") {
      setErrors(fieldMessages(outcome.fields));
    } else if (outcome.status === "barcode_exists") {
      setErrors({ barcode: t().scanAdd.barcodeExists });
    } else {
      setError(writeErrorMessage(outcome));
      setErrors(
        outcome.status === "invalid" ? fieldMessages({}, outcome.fields) : {},
      );
    }
  }

  return {
    phase,
    draft,
    addedCount,
    categoryKept: lastCategoryId !== null,
    scanError,
    pending,
    error,
    errors,
    scan,
    save,
    update: (changes: Partial<NewProductDraft>) => {
      setDraft((current) => ({ ...current, ...changes }));
    },
  };
}
