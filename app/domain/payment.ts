export type PaymentMethod = "cash" | "card" | "wallet";

export type CashCheck =
  { status: "covered"; change: number } | { status: "short"; missing: number };

// Change due is received minus total; it is not a return. Paisa in, paisa out.
export function checkCash(total: number, received: number): CashCheck {
  return received >= total
    ? { status: "covered", change: received - total }
    : { status: "short", missing: total - received };
}

// Pay stays off until the bill has items and, for cash, the money covers the total.
export function canPay(
  itemCount: number,
  method: PaymentMethod,
  total: number,
  received: number | null,
): boolean {
  if (itemCount <= 0) {
    return false;
  }
  return method !== "cash" || (received !== null && received >= total);
}
