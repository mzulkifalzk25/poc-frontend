import { parseAmountInput } from "./product-draft";

export interface DeliveryLine {
  productId: number;
  name: string;
  barcode: string;
  qty: string;
  unitCost: string;
  lastCost: string;
}

export interface DeliveryDraft {
  supplierId: number | null;
  invoiceNo: string;
  deliveryDate: string;
  lines: DeliveryLine[];
}

export interface DeliveryPayload {
  supplierId: number;
  invoiceNo: string;
  deliveryDate: string;
  lines: { productId: number; qty: string; unitCost: string }[];
}

export type DeliveryError = "no_supplier" | "no_lines" | "bad_line" | "no_date";

export type DeliveryValidation =
  { ok: true; payload: DeliveryPayload } | { ok: false; error: DeliveryError };

export type CostChange =
  | { kind: "new" }
  | { kind: "same" }
  | { kind: "higher"; diff: number }
  | { kind: "lower"; diff: number };

function amount(text: string): number {
  const parsed = parseAmountInput(text, 3);
  return parsed === null ? 0 : Number(parsed);
}

export function costChange(unitCost: string, lastCost: string): CostChange {
  const last = amount(lastCost);
  if (last <= 0) {
    return { kind: "new" };
  }
  const diff = Math.round((amount(unitCost) - last) * 100) / 100;
  if (diff === 0) {
    return { kind: "same" };
  }
  return diff > 0
    ? { kind: "higher", diff }
    : { kind: "lower", diff: Math.abs(diff) };
}

export function lineTotal(line: DeliveryLine): number {
  return Math.round(amount(line.qty) * amount(line.unitCost) * 100) / 100;
}

export function deliverySummary(lines: DeliveryLine[]) {
  return {
    lines: lines.length,
    units: lines.reduce((sum, line) => sum + amount(line.qty), 0),
    total: lines.reduce((sum, line) => sum + lineTotal(line), 0),
  };
}

export function costRiseCount(lines: DeliveryLine[]): number {
  return lines.filter(
    (line) => costChange(line.unitCost, line.lastCost).kind === "higher",
  ).length;
}

interface ScannedProduct {
  id: number;
  name: string;
  barcode: string;
  cost: string | null;
}

// Scanning a product again adds one more unit to the same line.
export function addScanned(
  lines: DeliveryLine[],
  product: ScannedProduct,
): DeliveryLine[] {
  const existing = lines.find((line) => line.productId === product.id);
  if (existing) {
    return lines.map((line) =>
      line === existing ? { ...line, qty: String(amount(line.qty) + 1) } : line,
    );
  }
  const cost = product.cost ?? "0";
  return [
    ...lines,
    {
      productId: product.id,
      name: product.name,
      barcode: product.barcode,
      qty: "1",
      unitCost: String(Number(cost)),
      lastCost: cost,
    },
  ];
}

export function validateDelivery(draft: DeliveryDraft): DeliveryValidation {
  if (draft.supplierId === null) {
    return { ok: false, error: "no_supplier" };
  }
  if (draft.deliveryDate === "") {
    return { ok: false, error: "no_date" };
  }
  if (draft.lines.length === 0) {
    return { ok: false, error: "no_lines" };
  }
  const lines: DeliveryPayload["lines"] = [];
  for (const line of draft.lines) {
    const qty = parseAmountInput(line.qty, 3);
    const unitCost = parseAmountInput(line.unitCost, 2);
    if (qty === null || unitCost === null || Number(qty) <= 0) {
      return { ok: false, error: "bad_line" };
    }
    lines.push({ productId: line.productId, qty, unitCost });
  }
  return {
    ok: true,
    payload: {
      supplierId: draft.supplierId,
      invoiceNo: draft.invoiceNo.trim(),
      deliveryDate: draft.deliveryDate,
      lines,
    },
  };
}

// "2026-09-19" for the store's today.
export function todayIn(timeZone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
}
