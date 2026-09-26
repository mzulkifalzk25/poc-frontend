export type ProductFieldError = "required" | "invalid_amount";

export interface ProductEditDraft {
  name: string;
  categoryId: number | null;
  unit: string;
  price: string;
  cost: string;
  lowStockAlert: string;
}

export interface ProductEditPayload {
  name: string;
  categoryId: number;
  unit: string;
  price: string;
  cost: string;
  lowStockAlert: string;
}

export type FieldErrors<T> = Partial<Record<keyof T, ProductFieldError>>;

export type Validation<T, P> =
  { ok: true; payload: P } | { ok: false; fields: FieldErrors<T> };

// Accepts "1,650" or "620.5"; returns a fixed-decimal API string or null.
export function parseAmountInput(text: string, decimals: 2 | 3): string | null {
  const clean = text.replace(/[\s,]/g, "");
  if (!/^\d+(\.\d+)?$/.test(clean)) {
    return null;
  }
  return Number(clean).toFixed(decimals);
}

export function amountError(
  text: string,
  decimals: 2 | 3,
): ProductFieldError | undefined {
  if (text.trim() === "") {
    return "required";
  }
  return parseAmountInput(text, decimals) === null
    ? "invalid_amount"
    : undefined;
}

function collectErrors<T>(
  checks: Partial<Record<keyof T, ProductFieldError | undefined>>,
): FieldErrors<T> {
  const fields: FieldErrors<T> = {};
  for (const key of Object.keys(checks) as (keyof T)[]) {
    const error = checks[key];
    if (error) {
      fields[key] = error;
    }
  }
  return fields;
}

export function validateProductEdit(
  draft: ProductEditDraft,
): Validation<ProductEditDraft, ProductEditPayload> {
  const price = parseAmountInput(draft.price, 2);
  const cost = parseAmountInput(draft.cost, 2);
  const lowStockAlert = parseAmountInput(draft.lowStockAlert, 3);
  const { categoryId } = draft;
  if (
    categoryId === null ||
    !price ||
    !cost ||
    !lowStockAlert ||
    !draft.name.trim() ||
    !draft.unit
  ) {
    return {
      ok: false,
      fields: collectErrors<ProductEditDraft>({
        name: draft.name.trim() === "" ? "required" : undefined,
        categoryId: categoryId === null ? "required" : undefined,
        unit: draft.unit === "" ? "required" : undefined,
        price: amountError(draft.price, 2),
        cost: amountError(draft.cost, 2),
        lowStockAlert: amountError(draft.lowStockAlert, 3),
      }),
    };
  }
  const name = draft.name.trim().replace(/\s+/g, " ");
  return {
    ok: true,
    payload: { name, categoryId, unit: draft.unit, price, cost, lowStockAlert },
  };
}
