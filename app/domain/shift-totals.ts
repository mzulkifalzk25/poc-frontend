import type { PaymentMethod } from "./payment";

// Everything in paisa.
export interface ShiftSale {
  method: PaymentMethod;
  total: number;
}

export interface ShiftRefund {
  amount: number;
  paidFromDrawer: boolean;
}

export interface ShiftTotals {
  bills: number;
  totalSales: number;
  byMethod: Record<PaymentMethod, number>;
  refundCount: number;
  refundAmount: number;
  cashRefundCount: number;
  cashRefunds: number;
}

export type DrawerCheck =
  | { status: "balanced"; difference: 0 }
  | { status: "over" | "short"; difference: number };

// Sales are gross; refunds are shown separately. Card and wallet refunds never touch the drawer.
export function shiftTotals(
  sales: ShiftSale[],
  refunds: ShiftRefund[],
): ShiftTotals {
  const byMethod: Record<PaymentMethod, number> = {
    cash: 0,
    card: 0,
    wallet: 0,
  };
  for (const sale of sales) {
    byMethod[sale.method] += sale.total;
  }
  const drawer = refunds.filter((refund) => refund.paidFromDrawer);
  return {
    bills: sales.length,
    totalSales: byMethod.cash + byMethod.card + byMethod.wallet,
    byMethod,
    refundCount: refunds.length,
    refundAmount: refunds.reduce((sum, refund) => sum + refund.amount, 0),
    cashRefundCount: drawer.length,
    cashRefunds: drawer.reduce((sum, refund) => sum + refund.amount, 0),
  };
}

// Expected in drawer = opening cash + cash sales − cash refunds.
export function expectedCash(openingCash: number, totals: ShiftTotals): number {
  return openingCash + totals.byMethod.cash - totals.cashRefunds;
}

export function checkDrawer(counted: number, expected: number): DrawerCheck {
  const difference = counted - expected;
  if (difference === 0) {
    return { status: "balanced", difference: 0 };
  }
  return {
    status: difference > 0 ? "over" : "short",
    difference: Math.abs(difference),
  };
}
